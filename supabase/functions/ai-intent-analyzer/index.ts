import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Content-Type": "application/json"
};

const OPENAI_API_KEY = Deno.env.get("OPEN_AI_KEY")!;

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

async function fetchFullSchema(supabase: any) {
  const { data, error } = await supabase.rpc("execute_sql", {
    query: `
      SELECT table_schema, table_name, column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position
    `
  });

  if (error) throw new Error(`Schema fetch error: ${error.message}`);
  return data || [];
}

function buildSchemaDescription(schemaRows: any[]) {
  const tables: Record<string, string[]> = {};
  
  for (const row of schemaRows) {
    const tableName = row.table_name;
    if (!tables[tableName]) {
      tables[tableName] = [];
    }
    tables[tableName].push(`${row.column_name}(${row.data_type})`);
  }

  let description = "Database Tables:\n";
  for (const [table, columns] of Object.entries(tables)) {
    description += `- ${table}: ${columns.slice(0, 5).join(", ")}${columns.length > 5 ? "..." : ""}\n`;
  }
  
  return description;
}

async function analyzeIntent(
  userQuestion: string, 
  conversationHistory: ConversationMessage[],
  schemaDescription: string
): Promise<{
  intent: string;
  clarifiedQuestion: string;
  needsClarification: boolean;
  clarificationQuestion?: string;
  suggestedQueries?: string[];
}> {
  const historyText = conversationHistory
    .slice(-6) // Last 6 messages for context
    .map(m => `${m.role === "user" ? "User" : "AI"}: ${m.content}`)
    .join("\n");

  const systemPrompt = `You are an intelligent AI assistant that understands user intent from natural language queries about a database.

${schemaDescription}

Your job is to:
1. Understand what the user REALLY wants, even if they don't express it clearly
2. Use conversation history to understand context
3. Clarify ambiguous requests
4. Suggest related queries they might want

IMPORTANT MAPPINGS:
- "rp", "rupiah", "nilai", "harga" → usually means monetary value (selling_price, purchase_price, total_amount, nominal)
- "total", "jumlah" → could mean COUNT or SUM depending on context
- "stok", "barang", "item" → stock table
- "gudang", "warehouse" → warehouses table
- "pelanggan", "customer" → customers table
- "supplier", "pemasok" → suppliers table
- "transaksi", "penjualan" → sales_transactions or kas_transaksi
- "karyawan", "pegawai" → employees table

Respond in JSON format:
{
  "intent": "brief description of what user wants",
  "clarifiedQuestion": "the question rewritten clearly for SQL generation",
  "needsClarification": true/false,
  "clarificationQuestion": "question to ask user if unclear (optional)",
  "suggestedQueries": ["related query 1", "related query 2"] (optional, max 3)
}`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { 
          role: "user", 
          content: `Conversation history:\n${historyText}\n\nCurrent question: ${userQuestion}\n\nAnalyze the intent and respond in JSON.`
        }
      ],
      temperature: 0.3,
      max_tokens: 500
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  let content = data.choices[0].message.content.trim();
  
  // Remove markdown code blocks if present
  content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  
  try {
    return JSON.parse(content);
  } catch {
    return {
      intent: "database query",
      clarifiedQuestion: userQuestion,
      needsClarification: false
    };
  }
}

async function generateSQL(userQuestion: string, schemaDescription: string): Promise<string> {
  const systemPrompt = `You are an AI assistant that generates read-only SQL queries for a PostgreSQL database.

${schemaDescription}

IMPORTANT RULES:
1. Generate ONLY SELECT queries
2. Do NOT generate INSERT, UPDATE, DELETE, DROP, ALTER, or any data modification queries
3. Return ONLY the SQL query without explanation or markdown formatting
4. Use proper PostgreSQL syntax
5. For list queries, add LIMIT 100. For SUM/COUNT/AVG queries, do NOT add LIMIT
6. Use table and column names exactly as shown in the schema
7. For COUNT queries, use "as count" alias
8. For SUM queries, use COALESCE(SUM(column), 0) as total to handle NULL
9. For "total rp" or "total harga" or "total nilai", SUM the price/amount column

COLUMN MAPPING (IMPORTANT):
- stock table: "selling_price" for harga jual, "purchase_price" for harga beli, "quantity" for jumlah stok
- sales_transactions: "total_amount" for total penjualan
- kas_transaksi: "nominal" for nilai transaksi
- purchase_transactions: "total_amount" for total pembelian

Examples:
- "berapa jumlah gudang" → SELECT COUNT(*) as count FROM warehouses
- "list semua customer" → SELECT * FROM customers LIMIT 100
- "total stok" → SELECT COALESCE(SUM(quantity), 0) as total FROM stock
- "total rp" or "total harga jual" → SELECT COALESCE(SUM(selling_price * quantity), 0) as total FROM stock
- "total nilai stok" → SELECT COALESCE(SUM(selling_price * quantity), 0) as total_nilai FROM stock
- "berapa total penjualan" → SELECT COALESCE(SUM(total_amount), 0) as total FROM sales_transactions

Generate the SQL query for the user's question:`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userQuestion }
      ],
      temperature: 0,
      max_tokens: 500
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  let sql = data.choices[0].message.content.trim();
  
  sql = sql.replace(/```sql\n?/g, "").replace(/```\n?/g, "").trim();
  
  return sql;
}

function validateSQL(sql: string): boolean {
  const lowered = sql.toLowerCase().trim();
  
  if (!lowered.startsWith("select")) return false;
  
  const dangerousKeywords = [
    "insert", "update", "delete", "drop", "alter", "truncate",
    "create", "grant", "revoke", "execute", "call"
  ];
  
  for (const keyword of dangerousKeywords) {
    if (lowered.includes(keyword)) return false;
  }
  
  return true;
}

async function generateExplanation(
  question: string, 
  sqlResult: any,
  conversationHistory: ConversationMessage[]
): Promise<string> {
  const historyContext = conversationHistory
    .slice(-4)
    .map(m => `${m.role === "user" ? "User" : "AI"}: ${m.content}`)
    .join("\n");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant. Provide a concise, natural language answer in Indonesian based on the query results. 
          
Keep it short and direct. Use proper formatting:
- For numbers, use Indonesian format (e.g., Rp 1.234.567)
- For lists, use bullet points
- Be conversational and friendly

Previous conversation:
${historyContext}`
        },
        {
          role: "user",
          content: `Question: ${question}\n\nQuery results: ${JSON.stringify(sqlResult)}\n\nProvide a short, natural answer in Indonesian:`
        }
      ],
      temperature: 0.7,
      max_tokens: 300
    })
  });

  if (!response.ok) {
    return Array.isArray(sqlResult) 
      ? `Ditemukan ${sqlResult.length} hasil` 
      : JSON.stringify(sqlResult);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }

  try {
    const { question, conversationHistory = [] } = await req.json();
    
    if (!question) {
      return new Response(JSON.stringify({
        error: "Missing 'question' in request body"
      }), { status: 400, headers: CORS });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("=== AI INTENT ANALYZER ===");
    console.log("Question:", question);
    console.log("History length:", conversationHistory.length);

    // Fetch full database schema
    const schemaRows = await fetchFullSchema(supabase);
    const schemaDescription = buildSchemaDescription(schemaRows);
    
    console.log(`Schema loaded: ${schemaRows.length} columns`);

    // Step 1: Analyze user intent
    const intentAnalysis = await analyzeIntent(question, conversationHistory, schemaDescription);
    console.log("Intent analysis:", JSON.stringify(intentAnalysis));

    // If clarification needed, return early
    if (intentAnalysis.needsClarification && intentAnalysis.clarificationQuestion) {
      return new Response(JSON.stringify({
        success: true,
        needsClarification: true,
        clarificationQuestion: intentAnalysis.clarificationQuestion,
        suggestedQueries: intentAnalysis.suggestedQueries,
        intent: intentAnalysis.intent
      }), { headers: CORS });
    }

    // Step 2: Generate SQL query using clarified question
    const sql = await generateSQL(intentAnalysis.clarifiedQuestion, schemaDescription);
    console.log("Generated SQL:", sql);

    // Validate SQL
    if (!validateSQL(sql)) {
      return new Response(JSON.stringify({
        error: "Generated SQL query is not valid or safe",
        sql,
        question
      }), { status: 400, headers: CORS });
    }

    // Step 3: Execute SQL query
    const { data: queryResult, error: queryError } = await supabase.rpc("execute_sql", {
      query: sql
    });

    if (queryError) {
      console.error("Query execution error:", queryError);
      return new Response(JSON.stringify({
        error: `Database query error: ${queryError.message}`,
        sql,
        question
      }), { status: 500, headers: CORS });
    }

    console.log("Query result:", JSON.stringify(queryResult).substring(0, 200));

    // Step 4: Generate natural language explanation with context
    const explanation = await generateExplanation(question, queryResult, conversationHistory);

    return new Response(JSON.stringify({
      success: true,
      question,
      intent: intentAnalysis.intent,
      clarifiedQuestion: intentAnalysis.clarifiedQuestion,
      sql,
      result: queryResult,
      explanation,
      rowCount: Array.isArray(queryResult) ? queryResult.length : 1,
      suggestedQueries: intentAnalysis.suggestedQueries
    }), { headers: CORS });

  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({
      error: error.message,
      stack: error.stack
    }), { status: 500, headers: CORS });
  }
});

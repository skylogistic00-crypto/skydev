import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Content-Type": "application/json"
};

const OPENAI_API_KEY = Deno.env.get("OPEN_AI_KEY")!;

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

  let description = "Database Schema:\n\n";
  for (const [table, columns] of Object.entries(tables)) {
    description += `Table: ${table}\n`;
    description += `Columns: ${columns.join(", ")}\n\n`;
  }
  
  return description;
}

async function generateSQL(userQuestion: string, schemaDescription: string) {
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

function validateSQL(sql: string) {
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

async function generateExplanation(question: string, sqlResult: any) {
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
          content: "You are a helpful assistant. Provide a concise, natural language answer in Indonesian based on the query results. Keep it short and direct."
        },
        {
          role: "user",
          content: `Question: ${question}\n\nQuery results: ${JSON.stringify(sqlResult)}\n\nProvide a short, natural answer in Indonesian:`
        }
      ],
      temperature: 0.7,
      max_tokens: 200
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
    const { question } = await req.json();
    
    if (!question) {
      return new Response(JSON.stringify({
        error: "Missing 'question' in request body"
      }), { status: 400, headers: CORS });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("=== AI SMART SEARCH ===");
    console.log("Question:", question);

    const schemaRows = await fetchFullSchema(supabase);
    const schemaDescription = buildSchemaDescription(schemaRows);
    
    console.log(`Schema loaded: ${schemaRows.length} columns`);

    const sql = await generateSQL(question, schemaDescription);
    console.log("Generated SQL:", sql);

    if (!validateSQL(sql)) {
      return new Response(JSON.stringify({
        error: "Generated SQL query is not valid or safe",
        sql,
        question
      }), { status: 400, headers: CORS });
    }

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

    const explanation = await generateExplanation(question, queryResult);

    return new Response(JSON.stringify({
      success: true,
      question,
      sql,
      result: queryResult,
      explanation,
      rowCount: Array.isArray(queryResult) ? queryResult.length : 1
    }), { headers: CORS });

  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({
      error: error.message,
      stack: error.stack
    }), { status: 500, headers: CORS });
  }
});


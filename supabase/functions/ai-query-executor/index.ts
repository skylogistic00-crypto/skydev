import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Content-Type": "application/json"
};

const OPENAI_API_KEY = Deno.env.get("OPEN_AI_KEY")!;

interface SchemaRow {
  table_schema: string;
  table_name: string;
  column_name: string;
  data_type: string;
}

async function fetchFullSchema(supabase: any): Promise<SchemaRow[]> {
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

function buildSchemaDescription(schemaRows: SchemaRow[]): string {
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

async function generateSQL(userQuestion: string, schemaDescription: string): Promise<string> {
  const systemPrompt = `You are an AI assistant that generates read-only SQL queries for a PostgreSQL database.

${schemaDescription}

IMPORTANT RULES:
1. Generate ONLY SELECT queries
2. Do NOT generate INSERT, UPDATE, DELETE, DROP, ALTER, or any data modification queries
3. Return ONLY the SQL query without explanation or markdown formatting
4. Use proper PostgreSQL syntax
5. Always add LIMIT 100 to prevent large result sets
6. Use table and column names exactly as shown in the schema
7. For COUNT queries, use "as count" alias
8. For date filtering, use proper date format: 'YYYY-MM-DD'

Examples:
- "berapa jumlah gudang" → SELECT COUNT(*) as count FROM warehouses
- "list semua customer" → SELECT * FROM customers LIMIT 100
- "total stok" → SELECT SUM(quantity) as total FROM stock

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
  
  // Remove markdown code blocks if present
  sql = sql.replace(/```sql\n?/g, "").replace(/```\n?/g, "").trim();
  
  return sql;
}

function validateSQL(sql: string): boolean {
  const lowered = sql.toLowerCase().trim();
  
  // Must start with SELECT
  if (!lowered.startsWith("select")) return false;
  
  // Block dangerous keywords
  const dangerousKeywords = [
    "insert", "update", "delete", "drop", "alter", "truncate",
    "create", "grant", "revoke", "execute", "call"
  ];
  
  for (const keyword of dangerousKeywords) {
    if (lowered.includes(keyword)) return false;
  }
  
  return true;
}

async function generateExplanation(question: string, sqlResult: any): Promise<string> {
  const resultSummary = Array.isArray(sqlResult) 
    ? `Found ${sqlResult.length} results` 
    : JSON.stringify(sqlResult);

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
    return resultSummary;
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

    console.log("=== AI QUERY EXECUTOR ===");
    console.log("Question:", question);

    // Fetch full database schema
    const schemaRows = await fetchFullSchema(supabase);
    const schemaDescription = buildSchemaDescription(schemaRows);
    
    console.log(`Schema loaded: ${Object.keys(schemaRows).length} tables`);

    // Generate SQL query using OpenAI
    const sql = await generateSQL(question, schemaDescription);
    console.log("Generated SQL:", sql);

    // Validate SQL
    if (!validateSQL(sql)) {
      return new Response(JSON.stringify({
        error: "Generated SQL query is not valid or safe",
        sql,
        question
      }), { status: 400, headers: CORS });
    }

    // Execute SQL query
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

    // Generate natural language explanation
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

  try {
    // Build OpenAI request for query execution
    const openaiRequestBody = {
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a SQL query executor assistant. Convert natural language queries into SQL and explain the results.",
        },
        {
          role: "user",
          content: body.query,
        },
      ],
      temperature: 0.7,
      n: 1,
    };

    console.log("Executing AI query:", body.query.substring(0, 50));

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify(openaiRequestBody),
    });

    if (!openaiResponse.ok) {
      const errorBody = await openaiResponse.text();
      console.error("OpenAI API error:", errorBody);
      return new Response(
        JSON.stringify({ error: "OpenAI API error", details: errorBody }),
        { status: openaiResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await openaiResponse.json();
    const result = data.choices?.[0]?.message?.content || "No response from AI";

    return new Response(
      JSON.stringify({ result }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Query executor error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

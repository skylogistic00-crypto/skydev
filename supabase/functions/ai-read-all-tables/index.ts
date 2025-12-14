import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Content-Type": "application/json"
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function runSqlQuery(sqlQuery: string) {
  const { data, error } = await supabase.rpc('execute_sql', { query_text: sqlQuery });
  
  if (error) {
    throw new Error(`SQL query failed: ${error.message}`);
  }

  return data;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }

  try {
    const { action, query } = await req.json();

    if (action === "get_schema") {
      const sql = `
        SELECT table_name, column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'public'
        ORDER BY table_name, ordinal_position;
      `;
      
      const result = await runSqlQuery(sql);
      
      const tables: Record<string, { columns: { name: string; type: string }[] }> = {};
      
      if (Array.isArray(result)) {
        for (const row of result) {
          const tableName = row.table_name;
          if (!tables[tableName]) {
            tables[tableName] = { columns: [] };
          }
          tables[tableName].columns.push({
            name: row.column_name,
            type: row.data_type
          });
        }
      }

      return new Response(JSON.stringify({
        success: true,
        tables,
        tableCount: Object.keys(tables).length
      }), { headers: CORS });
    }

    if (action === "run_query") {
      if (!query) {
        return new Response(JSON.stringify({
          error: "Query is required"
        }), { status: 400, headers: CORS });
      }

      const upperQuery = query.trim().toUpperCase();
      if (!upperQuery.startsWith("SELECT")) {
        return new Response(JSON.stringify({
          error: "Only SELECT queries are allowed"
        }), { status: 400, headers: CORS });
      }

      const result = await runSqlQuery(query);
      
      return new Response(JSON.stringify({
        success: true,
        result,
        rowCount: Array.isArray(result) ? result.length : 0
      }), { headers: CORS });
    }

    if (action === "get_table_data") {
      const { tableName, limit = 100 } = await req.json().catch(() => ({}));
      
      if (!tableName) {
        return new Response(JSON.stringify({
          error: "tableName is required"
        }), { status: 400, headers: CORS });
      }

      const safeTableName = tableName.replace(/[^a-zA-Z0-9_]/g, "");
      const sql = `SELECT * FROM ${safeTableName} LIMIT ${Math.min(limit, 1000)}`;
      
      const result = await runSqlQuery(sql);
      
      return new Response(JSON.stringify({
        success: true,
        table: safeTableName,
        result,
        rowCount: Array.isArray(result) ? result.length : 0
      }), { headers: CORS });
    }

    return new Response(JSON.stringify({
      error: "Invalid action. Use: get_schema, run_query, or get_table_data"
    }), { status: 400, headers: CORS });

  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({
      error: error.message,
      stack: error.stack
    }), { status: 500, headers: CORS });
  }
});

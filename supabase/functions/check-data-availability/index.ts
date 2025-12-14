import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Content-Type": "application/json"
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get allowed tables from ai_allowed_tables
    const { data: allowedTables } = await supabase
      .from("ai_allowed_tables")
      .select("table_name");

    const tableNames = allowedTables?.map(t => t.table_name) || [];
    const results: any = {};

    // Check count for each table
    for (const tableName of tableNames) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select("*", { count: "exact", head: true });

        results[tableName] = {
          count: count || 0,
          hasData: (count || 0) > 0,
          error: error?.message
        };
      } catch (e) {
        results[tableName] = {
          count: 0,
          hasData: false,
          error: "Cannot read"
        };
      }
    }

    // Sort by count descending
    const sortedResults = Object.entries(results)
      .sort((a: any, b: any) => b[1].count - a[1].count)
      .reduce((acc: any, [key, val]) => {
        acc[key] = val;
        return acc;
      }, {});

    return new Response(JSON.stringify({ 
      results: sortedResults,
      totalTables: tableNames.length,
      tablesWithData: Object.values(results).filter((r: any) => r.hasData).length,
      summary: Object.entries(sortedResults)
        .filter((e: any) => e[1].hasData)
        .map(([table, info]: any) => `${table}: ${info.count} records`)
        .join("\n")
    }), {
      headers: CORS
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack 
    }), {
      status: 500,
      headers: CORS
    });
  }
});


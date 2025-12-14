import { corsHeaders } from "@shared/cors.ts";

interface UpsertCOARequest {
  records: Array<{
    account_code: string;
    account_name: string;
    account_type?: string;
    normal_balance?: string;
    level?: number;
    is_header?: boolean;
    is_active?: boolean;
    parent_code?: string;
  }>;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const PICA_SECRET_KEY = Deno.env.get("PICA_SECRET_KEY");
    const PICA_SUPABASE_CONNECTION_KEY = Deno.env.get("PICA_SUPABASE_CONNECTION_KEY");
    const SUPABASE_PROJECT_ID = Deno.env.get("SUPABASE_PROJECT_ID");

    if (!PICA_SECRET_KEY || !PICA_SUPABASE_CONNECTION_KEY || !SUPABASE_PROJECT_ID) {
      throw new Error("Missing required environment variables");
    }

    const payload: UpsertCOARequest = await req.json();

    if (!payload.records || payload.records.length === 0) {
      throw new Error("No records provided for upsert");
    }

    // Build UPSERT SQL query with ON CONFLICT
    const values = payload.records.map((record) => {
      const accountCode = record.account_code.replace(/'/g, "''");
      const accountName = (record.account_name || "").replace(/'/g, "''");
      const accountType = (record.account_type || "").replace(/'/g, "''");
      const normalBalance = (record.normal_balance || "Debit").replace(/'/g, "''");
      const level = record.level || 1;
      const isHeader = record.is_header || false;
      const isActive = record.is_active !== false;
      const parentCode = record.parent_code ? `'${record.parent_code.replace(/'/g, "''")}'` : "NULL";

      return `('${accountCode}', '${accountName}', '${accountType}', '${normalBalance}', ${level}, ${isHeader}, ${isActive}, ${parentCode})`;
    }).join(",\n");

    const sqlQuery = `
INSERT INTO chart_of_accounts (account_code, account_name, account_type, normal_balance, level, is_header, is_active, parent_code)
VALUES ${values}
ON CONFLICT (account_code) DO UPDATE
SET 
  account_name = EXCLUDED.account_name,
  account_type = EXCLUDED.account_type,
  normal_balance = EXCLUDED.normal_balance,
  level = EXCLUDED.level,
  is_header = EXCLUDED.is_header,
  is_active = EXCLUDED.is_active,
  parent_code = EXCLUDED.parent_code,
  updated_at = NOW();
`;

    console.log("Executing UPSERT query for", payload.records.length, "records");

    const url = `https://api.picaos.com/v1/passthrough/v1/projects/${SUPABASE_PROJECT_ID}/database/query`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "x-pica-secret": PICA_SECRET_KEY,
        "x-pica-connection-key": PICA_SUPABASE_CONNECTION_KEY,
        "x-pica-action-id": "conn_mod_def::GC40SckOddE::NFFu2-49QLyGsPBdfweitg",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: sqlQuery }),
    });

    if (response.status === 201 || response.status === 200) {
      return new Response(
        JSON.stringify({
          success: true,
          message: `Successfully upserted ${payload.records.length} COA records`,
          records_processed: payload.records.length,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } else {
      const errorText = await response.text();
      console.error("Pica API error:", response.status, errorText);
      throw new Error(`Failed to execute query: ${errorText}`);
    }
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});

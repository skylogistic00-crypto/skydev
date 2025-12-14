import { corsHeaders } from "@shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing required environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const tables = [
      "cash_disbursement",
      "sales_transactions",
      "purchase_transactions",
      "cash_and_bank_receipts",
    ];

    const results: any = {
      checked: [],
      added: [],
      errors: [],
    };

    // Check and add ocr_data column for each table
    for (const tableName of tables) {
      try {
        // Check if column exists by trying to select it
        const { data: checkData, error: checkError } = await supabase
          .from(tableName)
          .select("ocr_data")
          .limit(1);

        if (checkError && checkError.message.includes("column")) {
          // Column doesn't exist
          results.errors.push({ 
            table: tableName, 
            error: "Column ocr_data tidak ada. Jalankan SQL: ALTER TABLE " + tableName + " ADD COLUMN IF NOT EXISTS ocr_data JSONB;" 
          });
        } else {
          results.checked.push(tableName);
        }
      } catch (error: any) {
        results.errors.push({ table: tableName, error: error.message });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "OCR columns check completed",
        results,
        sql_to_run: tables.map(t => `ALTER TABLE ${t} ADD COLUMN IF NOT EXISTS ocr_data JSONB;`).join("\n"),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

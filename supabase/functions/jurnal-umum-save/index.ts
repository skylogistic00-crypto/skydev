import { corsHeaders } from "@shared/cors.ts";
import { createClient } from "@supabase/supabase-js";

interface JournalLine {
  line_description: string;
  account_code: string;
  debit: number;
  credit: number;
}

interface SavePayload {
  transaction_date: string;
  reference_no: string | null;
  description: string | null;
  lines: JournalLine[];
  created_by: string;
  journal_type: string;
}

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_KEY")!;
const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = (await req.json()) as SavePayload;

    const { transaction_date, reference_no, description, lines, created_by, journal_type } =
      payload;

    if (!transaction_date || !lines?.length || !created_by) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { error: rpcError, data: rpcResult } = await supabase.rpc(
      "manual_general_journal_insert",
      {
        p_transaction_date: transaction_date,
        p_reference_no: reference_no,
        p_description: description,
        p_created_by: created_by,
        p_journal_type: journal_type,
        p_lines: lines,
      },
    );

    if (rpcError) {
      console.error("RPC error", rpcError);
      return new Response(JSON.stringify({ error: rpcError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ data: rpcResult }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

import { createSupabaseAdminClient } from "@shared/supabase-client.ts";
import { corsHeaders } from "@shared/cors.ts";

interface DisbursementRequest {
  advance_id: string;
  disbursement_method: "Kas" | "Bank";
  disbursement_account_id: string;
  disbursement_date: string;
  reference_number: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  try {
    const supabase = createSupabaseAdminClient();
    
    // Check if body exists
    const bodyText = await req.text();
    console.log("📥 RAW BODY:", bodyText);
    
    if (!bodyText || bodyText.trim() === "") {
      return new Response(
        JSON.stringify({ error: "Request body is empty" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
    
    let parsedBody: DisbursementRequest;
    try {
      parsedBody = JSON.parse(bodyText);
    } catch (parseError) {
      console.error("❌ JSON PARSE ERROR:", parseError);
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body", detail: bodyText }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
    
    const { advance_id, disbursement_method, disbursement_account_id, disbursement_date, reference_number } = parsedBody;

    // Get advance details
    const { data: advance, error: advanceError } = await supabase
      .from("employee_advances")
      .select("*")
      .eq("id", advance_id)
      .single();

    if (advanceError || !advance) {
      return new Response(
        JSON.stringify({ error: "Advance not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    // Get COA account details for uang muka
    let uangMukaAccount;
    
    if (advance.coa_account_id) {
      const { data, error } = await supabase
        .from("chart_of_accounts")
        .select("*")
        .eq("id", advance.coa_account_id)
        .single();
      
      if (!error && data) {
        uangMukaAccount = data;
      }
    }
    
    // Fallback to account code if id not found
    if (!uangMukaAccount && advance.coa_account_code) {
      const { data, error } = await supabase
        .from("chart_of_accounts")
        .select("*")
        .eq("account_code", advance.coa_account_code)
        .single();
      
      if (!error && data) {
        uangMukaAccount = data;
      }
    }
    
    // Final fallback to default uang muka account
    if (!uangMukaAccount) {
      const { data, error } = await supabase
        .from("chart_of_accounts")
        .select("*")
        .eq("account_code", "1-1500")
        .single();
      
      if (!error && data) {
        uangMukaAccount = data;
      }
    }

    if (!uangMukaAccount) {
      return new Response(
        JSON.stringify({ error: "Uang Muka account not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    // Get disbursement account details
    const { data: disbursementAccount, error: disbursementError } = await supabase
      .from("chart_of_accounts")
      .select("*")
      .eq("id", disbursement_account_id)
      .single();

    if (disbursementError || !disbursementAccount) {
      return new Response(
        JSON.stringify({ error: "Disbursement account not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    // Generate journal reference
    const journalRef = `JRN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Journal creation is handled by SQL trigger on employee_advances (same pattern as cash_and_bank_receipts & cash_disbursement).
    // So this edge function must NOT insert into journal_entries to avoid duplicates.

    // Update advance status; journal creation will be handled by DB trigger (approval-based)
    const { error: updateError } = await supabase
      .from("employee_advances")
      .update({
        status: "disbursed",
        disbursement_method,
        disbursement_account_id,
        disbursement_date,
        reference_number,

        debit_account_code: uangMukaAccount.account_code,
        debit_account_name: uangMukaAccount.account_name,
        credit_account_code: disbursementAccount.account_code,
        credit_account_name: disbursementAccount.account_name,

        updated_at: new Date().toISOString(),
      })
      .eq("id", advance_id);

    if (updateError) {
      return new Response(
        JSON.stringify({ error: updateError.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        advance_id,
        journal_ref: journalRef,
        message: "Uang muka berhasil dicairkan",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("🔥 DISBURSE ERROR DETAIL:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        detail: error?.message ?? error,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

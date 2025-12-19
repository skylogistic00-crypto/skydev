import { corsHeaders } from "@shared/cors.ts";
import { createSupabaseClient } from "@shared/supabase-client.ts";
import { getAccountCOAByCode } from "@shared/coa-helper.ts";

interface SettlementRequest {
  settlement_id: string;
  advance_id: string;
  settlement_amount: number;
  settlement_date: string;
  description?: string;
  expense_account_code: string;
  coa_account_code?: string;
  bukti_url?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  try {
    const supabaseClient = createSupabaseClient();

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser(authHeader.replace("Bearer ", ""));

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const payload: SettlementRequest = await req.json();

    if (!payload.settlement_id || !payload.advance_id || !payload.expense_account_code) {
      throw new Error("settlement_id, advance_id, and expense_account_code are required");
    }

    // Get current advance
    const { data: advance, error: advanceError } = await supabaseClient
      .from("employee_advances")
      .select("*")
      .eq("id", payload.advance_id)
      .single();

    if (advanceError || !advance) {
      throw new Error(advanceError?.message || "Advance not found");
    }

    // Resolve advance COA (default 1-1500)
    let advanceCOA = null;
    if (payload.coa_account_code) {
      advanceCOA = await getAccountCOAByCode(supabaseClient, payload.coa_account_code);
    } else if (advance.coa_account_code) {
      advanceCOA = await getAccountCOAByCode(supabaseClient, advance.coa_account_code);
    } else {
      advanceCOA = await getAccountCOAByCode(supabaseClient, "1-1500");
    }

    if (!advanceCOA) {
      throw new Error("Employee advance COA account not found (1-1500)");
    }

    // Resolve expense COA
    const expenseCOA = await getAccountCOAByCode(supabaseClient, payload.expense_account_code);

    if (!expenseCOA) {
      throw new Error(`Expense COA account not found: ${payload.expense_account_code}`);
    }

    const amount = payload.settlement_amount;

    // Build journal entries for settlement
    const journalDescription = `Penyelesaian uang muka ${advance.employee_name} - ${
      payload.description || ""
    }`;
    const journalRef = `SET-${new Date().toISOString()
      .slice(0, 10)
      .replace(/-/g, "")}-${
      payload.settlement_id?.slice(0, 8) || crypto.randomUUID().slice(0, 8)
    }`;

    // Create journal entries directly: Debit Expense, Credit Uang Muka
    const journalEntries = [
      {
        transaction_date: payload.settlement_date,
        journal_ref: journalRef,
        account_id: expenseCOA.id,
        account_code: expenseCOA.account_code,
        account_name: expenseCOA.account_name,
        account_type: expenseCOA.account_type,
        debit: amount,
        credit: 0,
        debit_account: expenseCOA.account_code,
        credit_account: advanceCOA.account_code,
        description: journalDescription,
        source_type: "employee_advance_settlement",
        jenis_transaksi: "Uang Muka",
        bukti_url: payload.bukti_url || null,
        approval_status: "approved",
      },
      {
        transaction_date: payload.settlement_date,
        journal_ref: journalRef,
        account_id: advanceCOA.id,
        account_code: advanceCOA.account_code,
        account_name: advanceCOA.account_name,
        account_type: advanceCOA.account_type,
        debit: 0,
        credit: amount,
        debit_account: expenseCOA.account_code,
        credit_account: advanceCOA.account_code,
        description: journalDescription,
        source_type: "employee_advance_settlement",
        jenis_transaksi: "Uang Muka",
        bukti_url: payload.bukti_url || null,
        approval_status: "approved",
      },
    ];

    const { error: journalError } = await supabaseClient
      .from("journal_entries")
      .insert(journalEntries);

    if (journalError) {
      throw new Error(`Failed to create journal entries: ${journalError.message}`);
    }

    // Update settlement with journal_ref
    await supabaseClient
      .from("employee_advance_settlements")
      .update({ journal_ref: journalRef })
      .eq("id", payload.settlement_id);

    // Note: remaining_balance and status will be automatically updated by database trigger
    // The trigger calculates: remaining_balance = advance_amount - SUM(all settlements) - SUM(all returns)

    return new Response(
      JSON.stringify({
        success: true,
        journal_ref: journalRef,
        message: "Settlement recorded successfully. Balance updated by trigger.",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("employee-advance-settlement error", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

import { corsHeaders } from "@shared/cors.ts";
import { createSupabaseClient } from "@shared/supabase-client.ts";
import { getAccountCOA, getAccountCOAByCode, insertJournalWithCOA } from "@shared/coa-helper.ts";

interface FinanceApproveRequest {
  advance_id: string;
  approver_id?: string;
  action?: "approve" | "reject";
  notes?: string;
  settlement_id?: string;
  settlement_amount: number;
  settlement_date: string;
  description?: string;
  expense_account_id?: string;
  expense_account_code?: string;
  coa_account_id?: string;
  coa_account_code?: string;
  cash_account_id?: string;
  cash_account_code?: string;
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

    const payload: FinanceApproveRequest = await req.json();

    if (!payload.advance_id) {
      throw new Error("advance_id is required");
    }

    if (payload.action && payload.action !== "approve") {
      throw new Error("Only approve action is supported for now");
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
    if (payload.coa_account_id) {
      advanceCOA = await getAccountCOA(supabaseClient, payload.coa_account_id);
    } else if (payload.coa_account_code) {
      advanceCOA = await getAccountCOAByCode(supabaseClient, payload.coa_account_code);
    } else if (advance.coa_account_id) {
      advanceCOA = await getAccountCOA(supabaseClient, advance.coa_account_id);
    } else if (advance.coa_account_code) {
      advanceCOA = await getAccountCOAByCode(supabaseClient, advance.coa_account_code);
    } else {
      advanceCOA = await getAccountCOAByCode(supabaseClient, "1-1500");
    }

    if (!advanceCOA) {
      throw new Error("Employee advance COA account not found (1-1500)");
    }

    // Resolve expense COA
    let expenseCOA = null;
    if (payload.expense_account_id) {
      expenseCOA = await getAccountCOA(supabaseClient, payload.expense_account_id);
    } else if (payload.expense_account_code) {
      expenseCOA = await getAccountCOAByCode(supabaseClient, payload.expense_account_code);
    }

    if (!expenseCOA) {
      throw new Error("Expense COA account is required for settlement");
    }

    const amount = payload.settlement_amount;

    // Build journal entries for settlement using shared helper (audit-safe)
    const journalDescription = `Penyelesaian uang muka ${advance.employee_name} - ${
      payload.description || ""
    }`;
    const journalRef = `SET-${new Date().toISOString()
      .slice(0, 10)
      .replace(/-/g, "")}-${
      payload.settlement_id?.slice(0, 8) || crypto.randomUUID().slice(0, 8)
    }`;

    // Journal must be fully COA-resolved and balanced
    const { journalEntryId, entries: resolvedEntries } = await insertJournalWithCOA(
      supabaseClient,
      {
        journalRef,
        date: payload.settlement_date,
        description: journalDescription,
        createdBy: user.id,
        referenceType: "employee_advance_settlement",
        referenceId: payload.settlement_id || payload.advance_id,
        entries: [
          {
            account_id: expenseCOA.id,
            account_code: expenseCOA.account_code,
            debit: amount,
            credit: 0,
            description: journalDescription,
          },
          {
            account_id: advanceCOA.id,
            account_code: advanceCOA.account_code,
            debit: 0,
            credit: amount,
            description: journalDescription,
          },
        ],
      }
    );

    // Ensure expense account name is never null
    const expenseEntry = resolvedEntries.find(
      (e) => e.account_code === expenseCOA.account_code && e.debit > 0
    );
    if (!expenseEntry || !expenseEntry.account_name) {
      throw new Error("Expense account name is required and must be resolved from COA");
    }

    // Update remaining balance and status
    const newRemainingBalance = (advance.remaining_balance || advance.amount || 0) - amount;
    const newStatus = newRemainingBalance <= 0 ? "settled" : "partially_settled";

    const { data: updatedAdvance, error: updateError } = await supabaseClient
      .from("employee_advances")
      .update({
        remaining_balance: newRemainingBalance,
        status: newStatus,
        finance_approver_id: payload.approver_id || user.id,
        finance_approved_at: new Date().toISOString(),
        finance_notes: payload.notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payload.advance_id)
      .eq("status", "waiting_finance_verification")
      .select()
      .single();

    if (updateError) {
      throw new Error(updateError.message);
    }

    return new Response(JSON.stringify({ data: updatedAdvance }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("employee-advance-approve-finance error", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

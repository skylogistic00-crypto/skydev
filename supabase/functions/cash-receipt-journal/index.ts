import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "@shared/cors.ts";
import { getAccountCOA, getAccountCOAByCode } from "@shared/coa-helper.ts";

interface CashReceiptJournalRequest {
  receipt_id?: string;
  date: string;
  amount: number;
  description: string;
  // Debit account (cash/bank)
  debit_account_id?: string;
  debit_account_code?: string;
  // Credit account (revenue/receivable)
  credit_account_id?: string;
  credit_account_code?: string;
  // Optional tax
  tax_amount?: number;
  tax_account_id?: string;
  tax_account_code?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

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

    const payload: CashReceiptJournalRequest = await req.json();

    // Resolve debit COA (cash/bank)
    let debitCOA = null;
    if (payload.debit_account_id) {
      debitCOA = await getAccountCOA(supabaseClient, payload.debit_account_id);
    } else if (payload.debit_account_code) {
      debitCOA = await getAccountCOAByCode(supabaseClient, payload.debit_account_code);
    } else {
      // Default to Kas
      debitCOA = await getAccountCOAByCode(supabaseClient, "1-1001");
    }

    if (!debitCOA) {
      throw new Error("Debit COA account not found");
    }

    // Resolve credit COA (revenue/receivable)
    let creditCOA = null;
    if (payload.credit_account_id) {
      creditCOA = await getAccountCOA(supabaseClient, payload.credit_account_id);
    } else if (payload.credit_account_code) {
      creditCOA = await getAccountCOAByCode(supabaseClient, payload.credit_account_code);
    }

    if (!creditCOA) {
      throw new Error("Credit COA account not found");
    }

    // Build journal entries
    const journalEntries: Array<{
      account_id: string;
      account_code: string;
      account_name: string;
      debit: number;
      credit: number;
      description: string;
    }> = [];

    // Debit: Cash/Bank
    journalEntries.push({
      account_id: debitCOA.id,
      account_code: debitCOA.account_code,
      account_name: debitCOA.account_name,
      debit: payload.amount,
      credit: 0,
      description: payload.description,
    });

    // Credit: Revenue/Receivable
    const creditAmount = payload.tax_amount ? payload.amount - payload.tax_amount : payload.amount;
    journalEntries.push({
      account_id: creditCOA.id,
      account_code: creditCOA.account_code,
      account_name: creditCOA.account_name,
      debit: 0,
      credit: creditAmount,
      description: payload.description,
    });

    // If there's tax, add tax entry
    if (payload.tax_amount && payload.tax_amount > 0) {
      let taxCOA = null;
      if (payload.tax_account_id) {
        taxCOA = await getAccountCOA(supabaseClient, payload.tax_account_id);
      } else if (payload.tax_account_code) {
        taxCOA = await getAccountCOAByCode(supabaseClient, payload.tax_account_code);
      } else {
        // Default to PPN Keluaran
        taxCOA = await getAccountCOAByCode(supabaseClient, "2-1500");
      }

      if (taxCOA) {
        journalEntries.push({
          account_id: taxCOA.id,
          account_code: taxCOA.account_code,
          account_name: taxCOA.account_name,
          debit: 0,
          credit: payload.tax_amount,
          description: `PPN - ${payload.description}`,
        });
      }
    }

    // Calculate totals
    const totalDebit = journalEntries.reduce((sum, e) => sum + e.debit, 0);
    const totalCredit = journalEntries.reduce((sum, e) => sum + e.credit, 0);

    // Generate journal reference
    const journalRef = `CR-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${payload.receipt_id?.slice(0, 8) || crypto.randomUUID().slice(0, 8)}`;

    // Create journal entry header
    const journalEntryId = crypto.randomUUID();
    const { error: journalError } = await supabaseClient
      .from("journal_entries")
      .insert({
        id: journalEntryId,
        journal_ref: journalRef,
        entry_date: payload.date,
        transaction_date: payload.date,
        description: payload.description,
        total_debit: totalDebit,
        total_credit: totalCredit,
        reference_type: "cash_receipt",
        reference_id: payload.receipt_id,
        status: "posted",
        created_by: user.id,
      });

    if (journalError) {
      console.error("Journal entry error:", journalError);
      throw new Error(`Failed to create journal entry: ${journalError.message}`);
    }

    // Insert journal entry lines
    const journalLines = journalEntries.map((entry) => ({
      journal_entry_id: journalEntryId,
      account_id: entry.account_id,
      account_code: entry.account_code,
      account_name: entry.account_name,
      debit: entry.debit,
      credit: entry.credit,
      description: entry.description,
    }));

    const { error: linesError } = await supabaseClient
      .from("journal_entry_lines")
      .insert(journalLines);

    if (linesError) {
      console.error("Journal lines error:", linesError);
      throw new Error(`Failed to create journal lines: ${linesError.message}`);
    }

    // Insert to general ledger
    const glEntries = journalEntries.map((entry) => ({
      journal_entry_id: journalEntryId,
      account_id: entry.account_id,
      account_code: entry.account_code,
      account_name: entry.account_name,
      date: payload.date,
      debit: entry.debit,
      credit: entry.credit,
      description: entry.description,
    }));

    const { error: glError } = await supabaseClient
      .from("general_ledger")
      .insert(glEntries);

    if (glError) {
      console.error("General ledger error:", glError);
      throw new Error(`Failed to create general ledger entries: ${glError.message}`);
    }

    // Update cash_and_bank_receipts with journal_entry_id if receipt_id provided
    if (payload.receipt_id) {
      await supabaseClient
        .from("cash_and_bank_receipts")
        .update({ journal_entry_id: journalEntryId, journal_ref: journalRef })
        .eq("id", payload.receipt_id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        journal_entry_id: journalEntryId,
        journal_ref: journalRef,
        message: "Cash receipt journal created successfully",
        entries: journalEntries.map((e) => ({
          account_code: e.account_code,
          account_name: e.account_name,
          debit: e.debit,
          credit: e.credit,
        })),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
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

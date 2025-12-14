import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "@shared/cors.ts";
import { getAccountCOA, getAccountCOAByCode } from "@shared/coa-helper.ts";

interface AdvanceJournalRequest {
  type: "advance" | "settlement" | "return";
  advance_id?: string;
  settlement_id?: string;
  return_id?: string;
  employee_name: string;
  amount: number;
  date: string;
  description?: string;
  // Accept either account_id or account_code
  expense_account_id?: string;
  expense_account_code?: string;
  coa_account_id?: string;
  coa_account_code?: string;
  cash_account_id?: string;
  cash_account_code?: string;
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

    const payload: AdvanceJournalRequest = await req.json();

    // Resolve COA for employee advance account
    let advanceCOA = null;
    if (payload.coa_account_id) {
      advanceCOA = await getAccountCOA(supabaseClient, payload.coa_account_id);
    } else if (payload.coa_account_code) {
      advanceCOA = await getAccountCOAByCode(supabaseClient, payload.coa_account_code);
    }

    if (!advanceCOA) {
      throw new Error("Employee advance COA account not found");
    }

    // Resolve COA for cash account (default to 1-1001 Kas)
    let cashCOA = null;
    if (payload.cash_account_id) {
      cashCOA = await getAccountCOA(supabaseClient, payload.cash_account_id);
    } else if (payload.cash_account_code) {
      cashCOA = await getAccountCOAByCode(supabaseClient, payload.cash_account_code);
    } else {
      cashCOA = await getAccountCOAByCode(supabaseClient, "1-1001");
    }

    if (!cashCOA) {
      throw new Error("Cash COA account not found");
    }

    let journalEntries: Array<{
      account_id: string;
      account_code: string;
      account_name: string;
      debit: number;
      credit: number;
      description: string;
    }> = [];
    let journalDescription = "";
    let journalRef = "";

    if (payload.type === "advance") {
      // STEP 1: Pengeluaran uang muka ke karyawan
      // Debit: Uang Muka Karyawan - {nama} (Aset)
      // Credit: Kas (Aset)
      
      journalDescription = `Uang muka kepada ${payload.employee_name}`;
      journalRef = `ADV-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${payload.advance_id?.slice(0, 8) || crypto.randomUUID().slice(0, 8)}`;
      
      journalEntries = [
        {
          account_id: advanceCOA.id,
          account_code: advanceCOA.account_code,
          account_name: `Uang Muka Karyawan - ${payload.employee_name}`,
          debit: payload.amount,
          credit: 0,
          description: journalDescription,
        },
        {
          account_id: cashCOA.id,
          account_code: cashCOA.account_code,
          account_name: cashCOA.account_name,
          debit: 0,
          credit: payload.amount,
          description: journalDescription,
        },
      ];
    } else if (payload.type === "settlement") {
      // STEP 2: Karyawan menyerahkan struk belanja
      // Debit: Beban {kategori} (Expense)
      // Credit: Uang Muka Karyawan - {nama} (Aset)
      
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

      journalDescription = `Penyelesaian uang muka ${payload.employee_name} - ${payload.description || ""}`;
      journalRef = `SET-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${payload.settlement_id?.slice(0, 8) || crypto.randomUUID().slice(0, 8)}`;
      
      journalEntries = [
        {
          account_id: expenseCOA.id,
          account_code: expenseCOA.account_code,
          account_name: expenseCOA.account_name,
          debit: payload.amount,
          credit: 0,
          description: journalDescription,
        },
        {
          account_id: advanceCOA.id,
          account_code: advanceCOA.account_code,
          account_name: `Uang Muka Karyawan - ${payload.employee_name}`,
          debit: 0,
          credit: payload.amount,
          description: journalDescription,
        },
      ];
    } else if (payload.type === "return") {
      // STEP 3: Karyawan mengembalikan sisa uang
      // Debit: Kas (Aset)
      // Credit: Uang Muka Karyawan - {nama} (Aset)
      
      journalDescription = `Pengembalian sisa uang muka dari ${payload.employee_name}`;
      journalRef = `RET-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${payload.return_id?.slice(0, 8) || crypto.randomUUID().slice(0, 8)}`;
      
      journalEntries = [
        {
          account_id: cashCOA.id,
          account_code: cashCOA.account_code,
          account_name: cashCOA.account_name,
          debit: payload.amount,
          credit: 0,
          description: journalDescription,
        },
        {
          account_id: advanceCOA.id,
          account_code: advanceCOA.account_code,
          account_name: `Uang Muka Karyawan - ${payload.employee_name}`,
          debit: 0,
          credit: payload.amount,
          description: journalDescription,
        },
      ];
    }

    // Calculate totals
    const totalDebit = journalEntries.reduce((sum, e) => sum + e.debit, 0);
    const totalCredit = journalEntries.reduce((sum, e) => sum + e.credit, 0);

    // Create journal entry header
    const journalEntryId = crypto.randomUUID();
    const { error: journalError } = await supabaseClient
      .from("journal_entries")
      .insert({
        id: journalEntryId,
        journal_ref: journalRef,
        entry_date: payload.date,
        transaction_date: payload.date,
        description: journalDescription,
        total_debit: totalDebit,
        total_credit: totalCredit,
        reference_type: `employee_advance_${payload.type}`,
        reference_id: payload.advance_id || payload.settlement_id || payload.return_id,
        status: "posted",
        created_by: user.id,
      });

    if (journalError) {
      console.error("Journal entry error:", journalError);
      throw new Error(`Failed to create journal entry: ${journalError.message}`);
    }

    // Insert journal entry lines with full COA details
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

    // Insert to general ledger with full COA details
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

    // Update the settlement or return record with journal_entry_id
    if (payload.type === "settlement" && payload.settlement_id) {
      await supabaseClient
        .from("employee_advance_settlements")
        .update({ journal_entry_id: journalEntryId })
        .eq("id", payload.settlement_id);
    } else if (payload.type === "return" && payload.return_id) {
      await supabaseClient
        .from("employee_advance_returns")
        .update({ journal_entry_id: journalEntryId })
        .eq("id", payload.return_id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        journal_entry_id: journalEntryId,
        journal_ref: journalRef,
        message: `Journal entry created for ${payload.type}`,
        entries: journalEntries.map(e => ({
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
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});

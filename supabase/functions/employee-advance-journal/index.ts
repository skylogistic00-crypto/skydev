import { corsHeaders } from "@shared/cors.ts";
import { createSupabaseClient } from "@shared/supabase-client.ts";
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
  bukti_url?: string;
  // Accept either account_id or account_code
  expense_account_id?: string;
  expense_account_code?: string;
  coa_account_id?: string;
  coa_account_code?: string;
  cash_account_id?: string;
  cash_account_code?: string;
  credit_account_id?: string;
  credit_account_code?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { 
      headers: corsHeaders, 
      status: 200 
    });
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

    const payload: AdvanceJournalRequest = await req.json();

    // Resolve COA for employee advance account (default to 1-1500)
    let advanceCOA = null;
    if (payload.coa_account_id) {
      advanceCOA = await getAccountCOA(supabaseClient, payload.coa_account_id);
    } else if (payload.coa_account_code) {
      advanceCOA = await getAccountCOAByCode(supabaseClient, payload.coa_account_code);
    } else {
      // Default to 1-1500 Uang Muka Karyawan
      advanceCOA = await getAccountCOAByCode(supabaseClient, "1-1500");
    }

    if (!advanceCOA) {
      throw new Error("Employee advance COA account not found (1-1500)");
    }

    // Resolve COA for cash account (default to 1-1220 Bank Mandiri)
    let cashCOA = null;
    if (payload.credit_account_id) {
      cashCOA = await getAccountCOA(supabaseClient, payload.credit_account_id);
    } else if (payload.credit_account_code) {
      cashCOA = await getAccountCOAByCode(supabaseClient, payload.credit_account_code);
    } else if (payload.cash_account_id) {
      cashCOA = await getAccountCOA(supabaseClient, payload.cash_account_id);
    } else if (payload.cash_account_code) {
      cashCOA = await getAccountCOAByCode(supabaseClient, payload.cash_account_code);
    } else {
      cashCOA = await getAccountCOAByCode(supabaseClient, "1-1220");
    }

    if (!cashCOA) {
      throw new Error("Cash COA account not found (1-1220)");
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

    // Insert 2 separate rows in journal_entries (like cash_disbursement)
    const debitEntry = journalEntries.find(e => e.debit > 0);
    const creditEntry = journalEntries.find(e => e.credit > 0);
    
    // For advance type, credit_account should be the bank account (credit side)
    // For settlement/return, credit_account should be the actual credit side
    const debitAccountCode = debitEntry?.account_code;
    const creditAccountCode = payload.type === "advance" ? cashCOA.account_code : creditEntry?.account_code;
    
    // Determine jenis_transaksi based on type
    let jenisTransaksi = '';
    if (payload.type === 'advance') {
      jenisTransaksi = 'Uang Muka';
    } else if (payload.type === 'settlement') {
      jenisTransaksi = 'Penyelesaian Uang Muka';
    } else if (payload.type === 'return') {
      jenisTransaksi = 'Pengembalian Uang Muka';
    }

    const journalInserts = journalEntries.map((entry) => ({
      journal_ref: journalRef,
      entry_date: payload.date,
      transaction_date: payload.date,
      description: entry.description,
      account_id: entry.account_id,
      account_code: entry.account_code,
      account_name: entry.account_name,
      debit: entry.debit,
      credit: entry.credit,
      debit_account: debitAccountCode,
      credit_account: creditAccountCode,
      reference_type: `employee_advance_${payload.type}`,
      reference_id: payload.advance_id || payload.settlement_id || payload.return_id,
      jenis_transaksi: jenisTransaksi,
      bukti_url: payload.bukti_url,
      status: "posted",
      created_by: user.id,
    }));

    console.log("Inserting journal entries:", JSON.stringify(journalInserts, null, 2));

    const { error: journalError } = await supabaseClient
      .from("journal_entries")
      .insert(journalInserts);

    if (journalError) {
      console.error("Journal entry error:", journalError);
      throw new Error(`Failed to create journal entries: ${journalError.message}`);
    }

    // Insert to general ledger with full COA details
    const glEntries = journalEntries.map((entry) => ({
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

    // Update the settlement or return record with journal_ref
    if (payload.type === "settlement" && payload.settlement_id) {
      await supabaseClient
        .from("employee_advance_settlements")
        .update({ journal_ref: journalRef })
        .eq("id", payload.settlement_id);
    } else if (payload.type === "return" && payload.return_id) {
      await supabaseClient
        .from("employee_advance_returns")
        .update({ journal_ref: journalRef })
        .eq("id", payload.return_id);
    }

    return new Response(
      JSON.stringify({
        success: true,
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

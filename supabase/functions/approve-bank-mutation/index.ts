import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface BankMutation {
  id: string;
  date: string;
  mutation_date: string;
  description: string;
  amount: number;
  debit: number;
  credit: number;
  balance: number;
  status: string;
  source: string;
  pp: string;
  kas_bank: string;
  pos: string;
  akun: string;
  sub_akun: string;
  pic: string;
  mapping_status: string;
  approval_status: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { mutation_ids, user_id, p_debit_account_code, p_credit_account_code } = await req.json();

    if (!mutation_ids || mutation_ids.length === 0) {
      return new Response(
        JSON.stringify({ error: "mutation_ids wajib diisi" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If debit/credit account codes provided from frontend, validate them
    let frontendDebitAccount: any = null;
    let frontendCreditAccount: any = null;

    if (p_debit_account_code) {
      const { data: debitAcc } = await supabase
        .from("chart_of_accounts")
        .select("id, account_code, account_name, account_type")
        .eq("account_code", p_debit_account_code)
        .single();
      frontendDebitAccount = debitAcc;
    }

    if (p_credit_account_code) {
      const { data: creditAcc } = await supabase
        .from("chart_of_accounts")
        .select("id, account_code, account_name, account_type")
        .eq("account_code", p_credit_account_code)
        .single();
      frontendCreditAccount = creditAcc;
    }

    // SECURITY: Validate user role (Admin / Accounting only)
    if (user_id) {
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("role")
        .eq("id", user_id)
        .single();

      if (userError || !userData) {
        return new Response(
          JSON.stringify({ error: "User tidak ditemukan" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const allowedRoles = ["super_admin", "admin", "accounting_manager", "accounting_staff"];
      if (!allowedRoles.includes(userData.role)) {
        return new Response(
          JSON.stringify({ error: "Anda tidak memiliki akses untuk approve mutasi bank" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const results: { id: string; success: boolean; error?: string }[] = [];

    for (const mutationId of mutation_ids) {
      try {
        // Get mutation data
        const { data: mutation, error: fetchError } = await supabase
          .from("bank_mutations")
          .select("*")
          .eq("id", mutationId)
          .single();

        if (fetchError || !mutation) {
          results.push({ id: mutationId, success: false, error: "Data tidak ditemukan" });
          continue;
        }

        // Use frontend-provided accounts if available, otherwise use mutation data
        let debitAccountData = frontendDebitAccount;
        let creditAccountData = frontendCreditAccount;

        // If not provided from frontend, try to use mutation's existing data
        if (!debitAccountData && mutation.akun) {
          const { data: akunData } = await supabase
            .from("chart_of_accounts")
            .select("id, account_code, account_name, account_type")
            .eq("account_code", mutation.akun)
            .single();
          debitAccountData = akunData;
        }

        if (!creditAccountData && mutation.kas_bank) {
          const { data: kasBankData } = await supabase
            .from("chart_of_accounts")
            .select("id, account_code, account_name, account_type")
            .eq("account_code", mutation.kas_bank)
            .single();
          creditAccountData = kasBankData;
        }

        // Validate required accounts
        if (!debitAccountData || !creditAccountData) {
          results.push({ 
            id: mutationId, 
            success: false, 
            error: "Debit Account dan Credit Account wajib dipilih" 
          });
          continue;
        }

        // Get amount from mutation
        const amount = mutation.amount || mutation.debit || mutation.credit || 0;
        if (amount <= 0) {
          results.push({ 
            id: mutationId, 
            success: false, 
            error: "Amount harus lebih dari 0" 
          });
          continue;
        }

        // Create journal entry
        const journalDescription = `Mutasi Bank: ${mutation.description || ""}`;
        const transactionDate = mutation.date || mutation.mutation_date || new Date().toISOString().split("T")[0];

        // Insert journal_entries
        const { data: journalEntry, error: journalError } = await supabase
          .from("journal_entries")
          .insert({
            transaction_date: transactionDate,
            description: journalDescription,
            reference_type: "bank_mutation",
            reference_id: mutationId,
            total_debit: amount,
            total_credit: amount,
            status: "posted",
            created_by: user_id,
          })
          .select()
          .single();

        if (journalError) {
          console.error("Journal entry error:", journalError);
          results.push({ id: mutationId, success: false, error: "Gagal membuat jurnal" });
          continue;
        }

        // Insert journal_entry_lines using frontend-selected accounts
        const journalLines = [
          {
            journal_entry_id: journalEntry.id,
            account_id: debitAccountData.id,
            account_code: debitAccountData.account_code,
            account_name: debitAccountData.account_name,
            debit: amount,
            credit: 0,
            description: mutation.description,
          },
          {
            journal_entry_id: journalEntry.id,
            account_id: creditAccountData.id,
            account_code: creditAccountData.account_code,
            account_name: creditAccountData.account_name,
            debit: 0,
            credit: amount,
            description: mutation.description,
          },
        ];

        const { error: linesError } = await supabase
          .from("journal_entry_lines")
          .insert(journalLines);

        if (linesError) {
          console.error("Journal lines error:", linesError);
        }

        // Insert to general_ledger
        const glEntries = journalLines.map((line) => ({
          transaction_date: transactionDate,
          account_id: line.account_id,
          account_code: line.account_code,
          account_name: line.account_name,
          description: journalDescription,
          debit: line.debit,
          credit: line.credit,
          balance: line.debit - line.credit,
          reference_type: "bank_mutation",
          reference_id: mutationId,
          journal_entry_id: journalEntry.id,
          created_by: user_id,
        }));

        const { error: glError } = await supabase
          .from("general_ledger")
          .insert(glEntries);

        if (glError) {
          console.error("General ledger error:", glError);
        }

        // Update bank_mutation status to approved
        const { error: updateError } = await supabase
          .from("bank_mutations")
          .update({
            status: "approved",
            approval_status: "approved",
            mapping_status: "approved",
            journal_entry_id: journalEntry.id,
            approved_by: user_id,
            approved_at: new Date().toISOString(),
          })
          .eq("id", mutationId);

        if (updateError) {
          console.error("Update mutation error:", updateError);
          results.push({ id: mutationId, success: false, error: "Gagal update status" });
          continue;
        }

        results.push({ id: mutationId, success: true });
      } catch (err: any) {
        console.error("Process error:", err);
        results.push({ id: mutationId, success: false, error: err.message });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    return new Response(
      JSON.stringify({
        success: failCount === 0,
        message: `${successCount} berhasil, ${failCount} gagal`,
        results,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

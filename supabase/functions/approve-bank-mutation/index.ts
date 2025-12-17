import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface BankMutation {
  id: string;
  mutation_date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
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

    const { mutation_ids, user_id } = await req.json();

    if (!mutation_ids || mutation_ids.length === 0) {
      return new Response(
        JSON.stringify({ error: "mutation_ids wajib diisi" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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

        // VALIDASI WAJIB
        const validationErrors: string[] = [];

        // 1. akun tidak null
        if (!mutation.akun) {
          validationErrors.push("Akun wajib diisi");
        }

        // 2. sub_akun tidak null
        if (!mutation.sub_akun) {
          validationErrors.push("Sub Akun wajib diisi");
        }

        // 3. debit XOR credit (salah satu harus ada, tidak boleh keduanya atau tidak ada)
        const hasDebit = mutation.debit && mutation.debit > 0;
        const hasCredit = mutation.credit && mutation.credit > 0;
        
        if (hasDebit && hasCredit) {
          validationErrors.push("Debit dan Credit tidak boleh keduanya terisi");
        }
        if (!hasDebit && !hasCredit) {
          validationErrors.push("Debit atau Credit harus diisi");
        }

        // 4. kas_bank valid
        if (!mutation.kas_bank) {
          validationErrors.push("Kas/Bank wajib diisi");
        } else {
          // Validate kas_bank exists in chart_of_accounts
          const { data: kasBank, error: kasBankError } = await supabase
            .from("chart_of_accounts")
            .select("id, account_code, account_name")
            .eq("account_code", mutation.kas_bank)
            .single();

          if (kasBankError || !kasBank) {
            validationErrors.push("Kas/Bank tidak valid");
          }
        }

        if (validationErrors.length > 0) {
          results.push({ 
            id: mutationId, 
            success: false, 
            error: validationErrors.join(", ") 
          });
          continue;
        }

        // Get account details
        const { data: akunData } = await supabase
          .from("chart_of_accounts")
          .select("id, account_code, account_name, account_type")
          .eq("account_code", mutation.akun)
          .single();

        const { data: kasBankData } = await supabase
          .from("chart_of_accounts")
          .select("id, account_code, account_name, account_type")
          .eq("account_code", mutation.kas_bank)
          .single();

        if (!akunData || !kasBankData) {
          results.push({ id: mutationId, success: false, error: "Data akun tidak valid" });
          continue;
        }

        // Create journal entry
        const journalDescription = `Mutasi Bank: ${mutation.description || ""}`;
        const transactionDate = mutation.mutation_date || new Date().toISOString().split("T")[0];
        const amount = hasDebit ? mutation.debit : mutation.credit;

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

        // Insert journal_entry_lines
        const journalLines = [];

        if (hasDebit) {
          // Debit: uang keluar dari bank
          // Debit akun beban/aset, Credit kas/bank
          journalLines.push({
            journal_entry_id: journalEntry.id,
            account_id: akunData.id,
            account_code: akunData.account_code,
            account_name: akunData.account_name,
            debit: amount,
            credit: 0,
            description: mutation.description,
          });
          journalLines.push({
            journal_entry_id: journalEntry.id,
            account_id: kasBankData.id,
            account_code: kasBankData.account_code,
            account_name: kasBankData.account_name,
            debit: 0,
            credit: amount,
            description: mutation.description,
          });
        } else {
          // Credit: uang masuk ke bank
          // Debit kas/bank, Credit akun pendapatan/hutang
          journalLines.push({
            journal_entry_id: journalEntry.id,
            account_id: kasBankData.id,
            account_code: kasBankData.account_code,
            account_name: kasBankData.account_name,
            debit: amount,
            credit: 0,
            description: mutation.description,
          });
          journalLines.push({
            journal_entry_id: journalEntry.id,
            account_id: akunData.id,
            account_code: akunData.account_code,
            account_name: akunData.account_name,
            debit: 0,
            credit: amount,
            description: mutation.description,
          });
        }

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

        // Update bank_mutation status
        const { error: updateError } = await supabase
          .from("bank_mutations")
          .update({
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

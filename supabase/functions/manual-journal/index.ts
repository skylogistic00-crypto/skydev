import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "@shared/cors.ts";
import { getAccountCOA, getAccountCOAByCode } from "@shared/coa-helper.ts";

interface JournalLineInput {
  account_id?: string;
  account_code?: string;
  debit: number;
  credit: number;
  description?: string;
}

interface ManualJournalRequest {
  date: string;
  description: string;
  reference_type?: string;
  reference_id?: string;
  entries: JournalLineInput[];
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

    const payload: ManualJournalRequest = await req.json();

    if (!payload.entries || payload.entries.length === 0) {
      throw new Error("Journal entries are required");
    }

    // Resolve all COA details for each entry
    const resolvedEntries: Array<{
      account_id: string;
      account_code: string;
      account_name: string;
      debit: number;
      credit: number;
      description: string;
    }> = [];

    for (const entry of payload.entries) {
      let coa = null;
      
      if (entry.account_id) {
        coa = await getAccountCOA(supabaseClient, entry.account_id);
      } else if (entry.account_code) {
        coa = await getAccountCOAByCode(supabaseClient, entry.account_code);
      }

      if (!coa) {
        throw new Error(
          `COA not found for account_id: ${entry.account_id} or account_code: ${entry.account_code}`
        );
      }

      resolvedEntries.push({
        account_id: coa.id,
        account_code: coa.account_code,
        account_name: coa.account_name,
        debit: entry.debit || 0,
        credit: entry.credit || 0,
        description: entry.description || payload.description,
      });
    }

    // Calculate totals
    const totalDebit = resolvedEntries.reduce((sum, e) => sum + e.debit, 0);
    const totalCredit = resolvedEntries.reduce((sum, e) => sum + e.credit, 0);

    // Validate balance
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error(
        `Journal not balanced: Debit (${totalDebit}) != Credit (${totalCredit})`
      );
    }

    // Generate journal reference
    const journalRef = `MJ-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${crypto.randomUUID().slice(0, 8)}`;

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
        reference_type: payload.reference_type || "manual_journal",
        reference_id: payload.reference_id,
        status: "posted",
        created_by: user.id,
      });

    if (journalError) {
      console.error("Journal entry error:", journalError);
      throw new Error(`Failed to create journal entry: ${journalError.message}`);
    }

    // Insert journal entry lines with full COA details
    const journalLines = resolvedEntries.map((entry) => ({
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
    const glEntries = resolvedEntries.map((entry) => ({
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

    return new Response(
      JSON.stringify({
        success: true,
        journal_entry_id: journalEntryId,
        journal_ref: journalRef,
        message: "Manual journal entry created successfully",
        total_debit: totalDebit,
        total_credit: totalCredit,
        entries: resolvedEntries.map((e) => ({
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

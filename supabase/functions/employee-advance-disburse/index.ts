import { corsHeaders } from "@shared/cors.ts";
import { createSupabaseClient } from "@shared/supabase-client.ts";
import { getAccountCOAByCode } from "@shared/coa-helper.ts";

interface DisburseRequest {
  employee_id: string;
  employee_name: string;
  amount: number;
  advance_date?: string;
  purpose?: string;
  notes?: string;
  bukti_url?: string;
  cash_account_code?: string;
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

    const payload: DisburseRequest = await req.json();

    // Validate required fields
    if (!payload.employee_id || !payload.employee_name || !payload.amount) {
      throw new Error("Missing required fields: employee_id, employee_name, amount");
    }

    if (payload.amount <= 0) {
      throw new Error("Amount must be greater than 0");
    }

    // Get COA accounts
    const advanceCOA = await getAccountCOAByCode(supabaseClient, "1-1500");
    if (!advanceCOA) {
      throw new Error("Employee advance COA account not found (1-1500)");
    }

    const cashAccountCode = payload.cash_account_code || "1-1110";
    const cashCOA = await getAccountCOAByCode(supabaseClient, cashAccountCode);
    if (!cashCOA) {
      throw new Error(`Cash COA account not found (${cashAccountCode})`);
    }

    // Create employee advance record
    const { data: advanceData, error: advanceError } = await supabaseClient
      .from("employee_advances")
      .insert({
        employee_id: payload.employee_id,
        employee_name: payload.employee_name,
        amount: payload.amount,
        remaining_balance: payload.amount,
        advance_date: payload.advance_date || new Date().toISOString().split('T')[0],
        purpose: payload.purpose || "Uang Muka Karyawan",
        notes: payload.notes,
        bukti_url: payload.bukti_url,
        coa_account_code: "1-1500",
        status: "pending",
        created_by: user.id,
      })
      .select()
      .single();

    if (advanceError) {
      throw new Error(`Failed to create advance: ${advanceError.message}`);
    }

    // Create journal entry for the disbursement
    const journalDescription = `Uang Muka Karyawan - ${payload.employee_name}`;
    
    const { data: journalData, error: journalError } = await supabaseClient
      .from("journal_entries")
      .insert({
        date: payload.advance_date || new Date().toISOString().split('T')[0],
        description: journalDescription,
        debit_account: advanceCOA.id,
        credit_account: cashCOA.id,
        amount: payload.amount,
        reference_type: "employee_advance_advance",
        reference_id: advanceData.id,
        status: "posted",
        bukti_url: payload.bukti_url,
        created_by: user.id,
      })
      .select()
      .single();

    if (journalError) {
      // Rollback advance if journal fails
      await supabaseClient
        .from("employee_advances")
        .delete()
        .eq("id", advanceData.id);
      
      throw new Error(`Failed to create journal entry: ${journalError.message}`);
    }

    // Update advance with journal entry id
    await supabaseClient
      .from("employee_advances")
      .update({ journal_entry_id: journalData.id })
      .eq("id", advanceData.id);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Employee advance disbursed successfully",
        data: {
          advance: advanceData,
          journal_entry: journalData,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in employee-advance-disburse:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

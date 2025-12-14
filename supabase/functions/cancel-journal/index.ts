import { corsHeaders } from "@shared/cors.ts";
import { createSupabaseClient } from "@shared/supabase-client.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  try {
    const body = await req.json();
    const { journal_ref, cash_disbursement_id } = body;

    if (!journal_ref) {
      return new Response(
        JSON.stringify({ success: false, error: "journal_ref is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const supabase = createSupabaseClient();

    // Call RPC cancel_journal with journal_ref
    const { data: rpcResult, error: rpcError } = await supabase.rpc("cancel_journal", {
      p_journal_ref: journal_ref
    });

    if (rpcError) {
      console.error("RPC Error:", rpcError);
      return new Response(
        JSON.stringify({ success: false, error: rpcError.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Check RPC result
    if (rpcResult && !rpcResult.success) {
      return new Response(
        JSON.stringify({ success: false, error: rpcResult.error }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Update cash_disbursement status back to "approved" if cash_disbursement_id provided
    if (cash_disbursement_id) {
      const { error: updateError } = await supabase
        .from("cash_disbursement")
        .update({ 
          approval_status: "approved",
          journal_ref: null // Clear journal reference
        })
        .eq("id", cash_disbursement_id);

      if (updateError) {
        console.error("Update Error:", updateError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Journal cancelled but failed to update cash_disbursement: ${updateError.message}` 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Jurnal berhasil dibatalkan",
        data: rpcResult
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    console.error("Cancel journal error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

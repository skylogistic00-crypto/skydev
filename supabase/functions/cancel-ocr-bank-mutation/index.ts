import { corsHeaders } from "./_shared/cors.ts";
import { createSupabaseClient } from "@shared/supabase-client.ts";

type ReqBody = {
  rowId: string;
};

Deno.serve(async (req) => {
  // CORS preflight must return HTTP 200
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  // Avoid 503 noise from link preview bots (Slackbot, etc.) hitting GET
  if (req.method === "GET") {
    return new Response(JSON.stringify({ ok: true, name: "cancel-ocr-bank-mutation" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }

  try {
    const supabase = createSupabaseClient();
    const body: ReqBody = await req.json();

    if (!body.rowId) {
      return new Response(JSON.stringify({ success: false, error: "rowId is required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Fetch current row for guard + file deletion
    const { data: row, error: fetchError } = await supabase
      .from("bank_mutations")
      .select(
        [
          "id",
          "approval_status",
          "bukti_url",
          "ocr_text",
          "invoice_file_path",
          "invoice_storage_bucket",
        ].join(",")
      )
      .eq("id", body.rowId)
      .single();

    if (fetchError) throw fetchError;
    if (!row) {
      return new Response(JSON.stringify({ success: false, error: "bank_mutations row not found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    if (row.approval_status === "approved") {
      return new Response(JSON.stringify({ success: false, error: "Cannot cancel OCR: already approved" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    // Requirement: only allow cancel when waiting_approval
    if (row.approval_status !== "waiting_approval") {
      return new Response(
        JSON.stringify({ success: false, error: "Cancel OCR only allowed when approval_status = waiting_approval" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

    // Delete file from storage if we have it
    const bucket = (row.invoice_storage_bucket as string | null) ?? "mutation-evidence";
    const filePath = row.invoice_file_path as string | null;

    let storageDeleted = false;
    if (filePath) {
      const { error: removeError } = await supabase.storage.from(bucket).remove([filePath]);
      if (removeError) throw removeError;
      storageDeleted = true;
    }

    // Clear OCR results (and related AI outputs)
    const { error: updateError } = await supabase
      .from("bank_mutations")
      .update({
        bukti_url: null,
        ocr_text: null,

        // Tax extraction fields
        invoice_id: null,
        invoice_number: null,
        dpp_amount: 0,
        ppn_amount: 0,
        pph_amount: 0,
        gross_amount: 0,
        tax_extraction_status: null,
        tax_extraction_confidence: 0,
        tax_extraction_timestamp: null,
        tax_document_type: null,

        // OCR integrated accounting fields
        vat_amount: 0,
        stamp_amount: 0,
        revenue_account_code: null,
        expense_account_code: null,
        vat_output_account_code: null,
        vat_input_account_code: null,

        // File tracking
        invoice_file_path: null,
        invoice_storage_bucket: null,
      })
      .eq("id", body.rowId);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({
        success: true,
        rowId: body.rowId,
        storageDeleted,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: (e as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

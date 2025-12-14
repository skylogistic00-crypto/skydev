import { corsHeaders } from "@shared/cors.ts";
import { createSupabaseClient } from "@shared/supabase-client.ts";

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 });
  }

  try {
    const { document_type, structured_data, raw_text, user_id } = await req.json();

    console.log("Received request:", { document_type, structured_data_keys: Object.keys(structured_data || {}), raw_text_length: raw_text?.length });

    if (!document_type) {
      throw new Error("document_type is required");
    }

    // If no structured_data, just return success without saving
    if (!structured_data || Object.keys(structured_data).length === 0) {
      console.log("No structured_data provided, skipping save");
      return new Response(
        JSON.stringify({
          success: true,
          message: "No data to save",
          skipped: true,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    const supabase = createSupabaseClient();

    // Save to generic document_results table instead of specific tables
    // This is more flexible and doesn't require creating tables for each document type
    const { data, error } = await supabase
      .from('document_results')
      .insert({
        document_type: document_type,
        structured_data: structured_data,
        raw_text: raw_text || null,
        processed_at: new Date().toISOString(),
        user_id: user_id || null,
      })
      .select()
      .single();

    if (error) {
      // If document_results table doesn't exist, log and return success anyway
      // The OCR extraction still worked, we just couldn't save the results
      console.error("Database save error:", error);
      
      // Return success with warning - don't fail the whole OCR process
      return new Response(
        JSON.stringify({
          success: true,
          warning: "OCR completed but results could not be saved to database",
          error_detail: error.message,
          document_type: document_type,
          fields_extracted: Object.keys(structured_data),
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data,
        document_type: document_type,
        fields_saved: Object.keys(structured_data),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Save Document Results Error:", error);
    
    // Return success with warning instead of 400 error
    // This prevents the OCR flow from failing just because save failed
    return new Response(
      JSON.stringify({
        success: true,
        warning: "OCR completed but an error occurred during save",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  }
});

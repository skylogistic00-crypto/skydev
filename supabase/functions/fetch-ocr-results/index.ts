import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from "@shared/cors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "userId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data, error } = await supabase
      .from("ocr_results")
      .select("id, document_type, file_name, file_url, extracted_data, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    const groupedResults: Record<string, any[]> = {};
    
    // Fields to exclude from OCR results (personal information)
    const fieldsToExclude = ['first_name', 'last_name', 'full_name', 'nama'];
    
    if (data && Array.isArray(data)) {
      data.forEach((result: any) => {
        const docType = result.document_type || "unknown";
        if (!groupedResults[docType]) {
          groupedResults[docType] = [];
        }
        
        const filteredData: Record<string, any> = {};
        if (result.extracted_data && typeof result.extracted_data === "object") {
          Object.entries(result.extracted_data).forEach(([key, value]) => {
            // Filter out empty values AND personal information fields
            if (value !== null && value !== "" && value !== undefined && !fieldsToExclude.includes(key)) {
              filteredData[key] = value;
            }
          });
        }
        
        groupedResults[docType].push({
          id: result.id,
          fileName: result.file_name,
          fileUrl: result.file_url,
          extractedData: filteredData,
          createdAt: result.created_at
        });
      });
    }

    return new Response(
      JSON.stringify({ results: groupedResults }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error: any) {
    console.error("Error fetching OCR results:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

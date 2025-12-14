import { corsHeaders } from "@shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { ocrData, tableName, userId } = await req.json();

    if (!ocrData || !tableName) {
      return new Response(
        JSON.stringify({ error: 'ocrData and tableName are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Columns to exclude (fields in the red box)
    const columnsToExclude = ['first_name', 'last_name', 'full_name'];

    // Filter out unwanted columns from OCR data
    const filteredData = Object.fromEntries(
      Object.entries(ocrData).filter(([key]) => !columnsToExclude.includes(key))
    );

    // Add user_id if provided
    if (userId) {
      filteredData.user_id = userId;
    }

    // Insert data via Supabase
    const { data, error } = await supabase
      .from(tableName)
      .insert([filteredData])
      .select();

    if (error) {
      throw new Error(`Failed to insert data: ${error.message}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Data inserted successfully',
        filtered_fields: columnsToExclude,
        inserted_data: data
      }),
      { 
        status: 201, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Error saving filtered OCR data:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

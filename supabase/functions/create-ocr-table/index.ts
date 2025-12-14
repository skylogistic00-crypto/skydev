import { corsHeaders } from "@shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: corsHeaders,
      status: 200 
    });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS ocr_results (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        file_name TEXT NOT NULL,
        extracted_text TEXT NOT NULL,
        confidence NUMERIC(5,2) DEFAULT 0,
        image_url TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        created_by UUID REFERENCES auth.users(id)
      );

      ALTER TABLE ocr_results ENABLE ROW LEVEL SECURITY;

      DROP POLICY IF EXISTS "Users can view all OCR results" ON ocr_results;
      CREATE POLICY "Users can view all OCR results" ON ocr_results
        FOR SELECT USING (true);

      DROP POLICY IF EXISTS "Users can insert OCR results" ON ocr_results;
      CREATE POLICY "Users can insert OCR results" ON ocr_results
        FOR INSERT WITH CHECK (true);

      DROP POLICY IF EXISTS "Users can delete their own OCR results" ON ocr_results;
      CREATE POLICY "Users can delete their own OCR results" ON ocr_results
        FOR DELETE USING (true);

      CREATE INDEX IF NOT EXISTS idx_ocr_results_created_at ON ocr_results(created_at DESC);
    `;

    const { data, error } = await supabase.rpc('execute_sql', { query_text: createTableQuery });

    if (error) {
      throw new Error(`Failed to create table: ${error.message}`);
    }

    const result = data;

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'OCR results table created successfully',
        data: result 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error creating OCR table:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

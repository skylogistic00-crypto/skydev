import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 });
  }

  try {
    console.log("=== Upload OCR File Edge Function Started ===");
    console.log("Request method:", req.method);

    const contentType = req.headers.get('content-type');
    console.log("Content-Type:", contentType);

    if (!contentType || !contentType.includes('multipart/form-data')) {
      throw new Error(`Invalid Content-Type: ${contentType}. Expected multipart/form-data`);
    }

    const formData = await req.formData();
    console.log("FormData received");
    
    const file = formData.get('file') as File;
    const fileName = formData.get('fileName') as string;

    console.log("File:", file ? "present" : "missing");
    console.log("FileName:", fileName || "missing");

    if (!file || !fileName) {
      throw new Error("file and fileName are required");
    }

    console.log(`Uploading file: ${fileName}, type: ${file.type}`);

    // Validate MIME type
    const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!supportedTypes.includes(file.type)) {
      throw new Error(`Unsupported file type: ${file.type}. Supported: ${supportedTypes.join(', ')}`);
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Convert file to buffer
    const fileBuffer = await file.arrayBuffer();
    console.log(`File size: ${fileBuffer.byteLength} bytes`);

    // Upload directly to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('ocr-receipts')
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload failed:', uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    console.log('Upload successful:', uploadData);

    // Create signed URL
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('ocr-receipts')
      .createSignedUrl(fileName, 3600);

    if (signedUrlError) {
      console.error('Signed URL creation failed:', signedUrlError);
      throw new Error(`Signed URL creation failed: ${signedUrlError.message}`);
    }

    console.log('Signed URL created successfully');

    return new Response(
      JSON.stringify({
        success: true,
        filePath: fileName,
        signedUrl: signedUrlData.signedUrl,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error("=== Upload OCR File Error ===");
    console.error("Error type:", error.constructor.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Unknown error occurred",
        errorType: error.constructor.name,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

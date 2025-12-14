import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_KEY");

    console.log("Environment check:", {
      hasSupabaseUrl: !!SUPABASE_URL,
      hasServiceKey: !!SUPABASE_SERVICE_KEY,
    });

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing SUPABASE_URL or SUPABASE_SERVICE_KEY",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { persistSession: false },
    });

    const { bucketName } = await req.json();

    if (!bucketName) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "bucketName is required",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    console.log(`Checking bucket: ${bucketName}`);

    // List all buckets
    const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();

    if (listError) {
      console.error("Failed to list buckets:", listError);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Failed to list buckets: ${listError.message}`,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    console.log("Existing buckets:", buckets?.map(b => b.name));

    const bucketExists = buckets?.some((b: any) => b.name === bucketName);

    if (bucketExists) {
      return new Response(
        JSON.stringify({
          success: true,
          exists: true,
          message: `Bucket '${bucketName}' already exists`,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Bucket doesn't exist, create it
    console.log(`Creating bucket: ${bucketName}`);
    const { data: newBucket, error: createError } = await supabaseAdmin.storage.createBucket(bucketName, {
      public: false,
      fileSizeLimit: 52428800,
      allowedMimeTypes: ["image/jpeg", "image/png", "image/jpg", "application/pdf"],
    });

    if (createError) {
      console.error("Failed to create bucket:", createError);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Failed to create bucket: ${createError.message}`,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    console.log("Bucket created:", newBucket);

    return new Response(
      JSON.stringify({
        success: true,
        exists: false,
        created: true,
        message: `Bucket '${bucketName}' created successfully`,
        bucket: newBucket,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (err: any) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message || "An unexpected error occurred",
        details: err.toString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

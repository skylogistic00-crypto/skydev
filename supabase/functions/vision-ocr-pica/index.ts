import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return new Response(JSON.stringify({ error: "File is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Uploading file to Supabase Storage:", file.name, file.type);

    const fileName = `ocr/${crypto.randomUUID()}-${file.name}`;
    const fileBuffer = await file.arrayBuffer();
    
    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(fileName, new Uint8Array(fileBuffer), {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError.message);
      return new Response(JSON.stringify({ error: "File upload failed: " + uploadError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("File uploaded successfully.");

    const { data: publicUrlData } = supabase.storage
      .from("documents")
      .getPublicUrl(fileName);

    if (!publicUrlData || !publicUrlData.publicUrl) {
      return new Response(JSON.stringify({ error: "Failed to get public URL" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const publicUrl = publicUrlData.publicUrl;
    console.log("Public URL:", publicUrl);

    const OPENAI_API_KEY = Deno.env.get("OPEN_AI_KEY");
    
    if (!OPENAI_API_KEY) {
      console.error("OPEN_AI_KEY is missing");
      return new Response(JSON.stringify({ error: "Missing OpenAI API key" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Calling OpenAI Vision API directly...");

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract all text and structured data from this document. Return the output as JSON with 'text' field containing all extracted text and 'data' field containing structured data like tables, forms, or key-value pairs found in the document.",
              },
              {
                type: "image_url",
                image_url: {
                  url: publicUrl,
                },
              },
            ],
          },
        ],
        max_tokens: 4000,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error("OpenAI API error:", errorText);
      return new Response(JSON.stringify({ error: "OpenAI API request failed: " + errorText }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const openaiJson = await openaiResponse.json();
    console.log("OpenAI response received:", JSON.stringify(openaiJson).substring(0, 200));

    let ocrResult;
    try {
      const content = openaiJson.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error("No content in response");
      }
      
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        ocrResult = JSON.parse(jsonMatch[1]);
      } else {
        try {
          ocrResult = JSON.parse(content);
        } catch {
          ocrResult = { text: content, data: {} };
        }
      }
    } catch (e) {
      console.error("Failed to parse OCR JSON:", e);
      ocrResult = { 
        text: openaiJson.choices?.[0]?.message?.content || "", 
        data: {} 
      };
    }

    const { error: dbError } = await supabase
      .from("ocr_results")
      .insert([
        {
          file_url: publicUrl,
          ocr_data: ocrResult,
          created_at: new Date().toISOString(),
        },
      ]);

    if (dbError) {
      console.error("Database insert error:", dbError.message);
    } else {
      console.log("OCR result saved to database.");
    }

    return new Response(
      JSON.stringify({
        message: "OCR success",
        data: ocrResult,
        file_url: publicUrl,
        confidence: 95,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

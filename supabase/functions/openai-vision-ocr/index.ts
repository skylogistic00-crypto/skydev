import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, content-type, apikey",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const jsonHeaders = {
  ...corsHeaders,
  "Content-Type": "application/json",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
      status: 200,
    });
  }

  try {
    console.log("Starting OCR processing via OpenAI");
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const form = await req.formData();
    const file = form.get("file") as File;

    if (!file) {
      return new Response(
        JSON.stringify({ error: "No file provided" }),
        { status: 400, headers: jsonHeaders }
      );
    }

    console.log("File received:", file.name, file.type);

    const arrayBuffer = await file.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    const OPENAI_API_KEY = Deno.env.get("OPEN_AI_KEY");
    
    if (!OPENAI_API_KEY) {
      console.error("OpenAI API key is missing");
      return new Response(
        JSON.stringify({ error: "Missing OpenAI API key" }),
        { status: 500, headers: jsonHeaders }
      );
    }

    // Upload file to storage first to get public URL
    const buffer = new Uint8Array(arrayBuffer);
    const filePath = `ocr/${crypto.randomUUID()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(filePath, buffer, { contentType: file.type });

    let imageUrl = "";
    if (!uploadError) {
      const { data: urlData } = supabase.storage
        .from("documents")
        .getPublicUrl(filePath);
      imageUrl = urlData.publicUrl;
    } else {
      imageUrl = `data:${file.type};base64,${base64}`;
    }

    console.log("Calling OpenAI API directly for OCR...");

    const prompt = "Extract all text and data from this document. Return the extracted information in a structured JSON format with a 'data' field containing the extracted content.";

    const openaiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: prompt,
                },
                {
                  type: "image_url",
                  image_url: {
                    url: imageUrl,
                  },
                },
              ],
            },
          ],
          max_tokens: 2000,
          temperature: 0,
        }),
      }
    );

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      throw new Error(`OpenAI API error: ${openaiResponse.statusText} - ${errorText}`);
    }

    const openaiData = await openaiResponse.json();
    console.log("OpenAI response received:", JSON.stringify(openaiData).substring(0, 200));
    
    let extractedContent = "";
    if (openaiData.choices && openaiData.choices.length > 0 && openaiData.choices[0].message) {
      extractedContent = openaiData.choices[0].message.content || "";
    } else {
      throw new Error("Invalid OpenAI response structure");
    }
    
    if (!extractedContent) {
      throw new Error("No content extracted from OpenAI response");
    }
    
    let result;
    try {
      result = JSON.parse(extractedContent);
    } catch {
      result = { text: extractedContent };
    }

    const file_url = uploadError 
      ? null 
      : `${Deno.env.get("SUPABASE_URL")}/storage/v1/object/public/documents/${filePath}`;

    return new Response(
      JSON.stringify({
        message: "OCR success",
        data: result,
        file_url,
        confidence: 95,
      }),
      {
        status: 200,
        headers: jsonHeaders,
      }
    );
  } catch (error) {
    console.error("Edge function error:", error);
    console.error("Error stack:", error.stack);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack 
      }),
      {
        status: 500,
        headers: jsonHeaders,
      }
    );
  }
});

import { corsHeaders } from "@shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get("OPEN_AI_KEY");

    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({
          connected: false,
          error: "Missing OpenAI API key",
          message: "OPEN_AI_KEY belum dikonfigurasi"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400
        }
      );
    }

    // Test OpenAI connection with a simple models list request
    const response = await fetch("https://api.openai.com/v1/models", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI connection check failed:", response.status, errorText);
      
      return new Response(
        JSON.stringify({
          connected: false,
          error: `Connection failed: ${response.status}`,
          message: "Koneksi ke OpenAI gagal. Periksa konfigurasi OPEN_AI_KEY.",
          details: errorText
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200
        }
      );
    }

    const data = await response.json();
    
    return new Response(
      JSON.stringify({
        connected: true,
        message: "✅ Koneksi ke OpenAI berhasil!",
        modelsCount: data.data?.length || 0
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      }
    );

  } catch (error) {
    console.error("Error checking OpenAI connection:", error);
    
    return new Response(
      JSON.stringify({
        connected: false,
        error: error.message,
        message: "Terjadi kesalahan saat memeriksa koneksi OpenAI"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    );
  }
});

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json"
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      status: 204, 
      headers: CORS 
    });
  }

  const { message } = await req.json().catch(() => ({}));

  if (!message) {
    return new Response(JSON.stringify({ error: "Message required" }), {
      status: 400,
      headers: CORS
    });
  }

  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") || Deno.env.get("OPEN_AI_KEY");
  if (!OPENAI_API_KEY) {
    return new Response(JSON.stringify({ error: "Missing OPENAI_API_KEY" }), {
      status: 500,
      headers: CORS
    });
  }

  try {
    const ai = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: message }]
      })
    });

    const json = await ai.json();

    if (!ai.ok) {
      console.error("OpenAI API error:", json);
      return new Response(JSON.stringify({ error: json.error?.message || "OpenAI API error" }), {
        status: ai.status,
        headers: CORS
      });
    }

    return new Response(JSON.stringify({ reply: json.choices?.[0]?.message?.content || "" }), {
      headers: CORS
    });
  } catch (error) {
    console.error("Chat AI error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: CORS
    });
  }
});

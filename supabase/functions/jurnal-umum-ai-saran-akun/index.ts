import { corsHeaders } from "@shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { userInput } = await req.json();

    if (!userInput || typeof userInput !== "string") {
      return new Response(
        JSON.stringify({ error: "Invalid or missing userInput in request body" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const openAiPayload = {
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: `Suggest journal entries for the following transaction: ${userInput}`,
        },
      ],
      n: 1,
      max_completion_tokens: null,
      temperature: 0.7,
      presence_penalty: 0,
      frequency_penalty: 0,
      stop: null,
      stream: false,
    };

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
      },
      body: JSON.stringify(openAiPayload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("OpenAI API error:", errorBody);
      return new Response(
        JSON.stringify({ error: "OpenAI API request failed", details: errorBody }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const data = await response.json();
    const aiOutput = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ suggestions: aiOutput }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("jurnal-umum-ai-saran-akun internal error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

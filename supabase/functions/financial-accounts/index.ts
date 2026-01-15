import { corsHeaders } from "./_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  return new Response(JSON.stringify({ error: "Function implementation was reset during CORS sweep" }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 500,
  });
});

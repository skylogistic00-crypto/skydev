import { corsHeaders } from "@shared/cors.ts";

const PICA_ENDPOINT = "https://api.picaos.com/v1/passthrough/v1/projects";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { projectRef, sql } = await req.json();

    if (!projectRef || !sql) {
      return new Response(
        JSON.stringify({ error: "projectRef dan sql wajib diisi" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const url = `${PICA_ENDPOINT}/${projectRef}/database/query`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "x-pica-secret": Deno.env.get("PICA_SECRET_KEY")!,
        "x-pica-connection-key": Deno.env.get("PICA_SUPABASE_CONNECTION_KEY")!,
        "x-pica-action-id": "conn_mod_def::GC40SckOddE::NFFu2-49QLyGsPBdfweitg",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: sql }),
    });

    if (response.status === 201) {
      const data = await response.json();
      return new Response(JSON.stringify({ success: true, data }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const errorText = await response.text();

    return new Response(
      JSON.stringify({
        success: false,
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

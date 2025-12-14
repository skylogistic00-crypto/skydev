import { corsHeaders } from "@shared/cors.ts";

interface AkunCOA {
  account_code: string;
  account_name: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.searchParams.get("path");

    if (path === "fetch-coa") {
      const projectRef = url.searchParams.get("projectRef");
      if (!projectRef) {
        return new Response(JSON.stringify({ error: "Missing projectRef" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const response = await fetch(
        `https://api.picaos.com/v1/passthrough/v1/projects/${projectRef}/database/query`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-pica-secret": Deno.env.get("PICA_SECRET_KEY")!,
            "x-pica-connection-key": Deno.env.get("PICA_SUPABASE_CONNECTION_KEY")!,
            "x-pica-action-id": "conn_mod_def::GC40SckOddE::NFFu2-49QLyGsPBdfweitg",
          },
          body: JSON.stringify({
            query:
              "select account_code, account_name from chart_of_accounts where is_active = true and is_header = false order by account_code asc",
          }),
        },
      );

      if (!response.ok) {
        return new Response(
          JSON.stringify({ error: `Failed to fetch Akun COA: ${response.statusText}` }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      const result = await response.json();
      if (result.error) {
        return new Response(
          JSON.stringify({ error: `Supabase error: ${result.error}` }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      const data = result.data as AkunCOA[];
      return new Response(JSON.stringify({ data }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

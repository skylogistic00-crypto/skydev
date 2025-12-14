import { corsHeaders } from "@shared/cors.ts";

const endpoint = "https://api.picaos.com/v1/passthrough/v1/projects";
const actionId = "conn_mod_def::GC40SckOddE::NFFu2-49QLyGsPBdfweitg";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  try {
    const projectRef = Deno.env.get("SUPABASE_PROJECT_ID");
    const picaSecret = Deno.env.get("PICA_SECRET_KEY");
    const supabaseConnectionKey = Deno.env.get("PICA_SUPABASE_CONNECTION_KEY");

    if (!projectRef || !picaSecret || !supabaseConnectionKey) {
      return new Response(
        JSON.stringify({ error: "Missing required environment variables" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const sqlQuery = `
      SELECT account_code, account_name, description, account_type
      FROM chart_of_accounts
      WHERE account_type = 'Expense'
        AND is_active = true
        AND is_header = false;
    `;

    const url = `${endpoint}/${projectRef}/database/query`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "x-pica-secret": picaSecret,
        "x-pica-connection-key": supabaseConnectionKey,
        "x-pica-action-id": actionId,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: sqlQuery }),
    });

    const data = await response.json();

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          error: `Error running query: ${response.status} ${response.statusText}`,
          details: data,
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
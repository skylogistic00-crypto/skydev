import { corsHeaders } from "@shared/cors.ts";
import { createClient } from "@shared/supabase-client.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(authHeader);

    const body = await req.json();
    const { action, data, id } = body;

    let result;

    if (action === "insert") {
      const { data: insertData, error } = await supabase
        .from("employee_contracts")
        .insert({
          employee_id: data.employee_id,
          contract_number: data.contract_number,
          contract_type: data.contract_type,
          start_date: data.start_date,
          end_date: data.end_date || null,
          salary: data.salary,
          allowances: data.allowances,
          status: data.status || "active",
          document_url: data.document_url,
          notes: data.notes,
        })
        .select()
        .single();

      if (error) throw error;
      result = insertData;
    } else if (action === "update" && id) {
      const { data: updateData, error } = await supabase
        .from("employee_contracts")
        .update({
          employee_id: data.employee_id,
          contract_number: data.contract_number,
          contract_type: data.contract_type,
          start_date: data.start_date,
          end_date: data.end_date || null,
          salary: data.salary,
          allowances: data.allowances,
          status: data.status,
          document_url: data.document_url,
          notes: data.notes,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      result = updateData;
    } else if (action === "terminate" && id) {
      const { data: terminateData, error } = await supabase
        .from("employee_contracts")
        .update({
          status: "terminated",
          end_date: new Date().toISOString(),
          notes: data.notes,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      result = terminateData;
    } else if (action === "renew" && id) {
      // First get the old contract
      const { data: oldContract, error: fetchError } = await supabase
        .from("employee_contracts")
        .select("employee_id")
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;

      // Terminate old contract
      const { error: terminateError } = await supabase
        .from("employee_contracts")
        .update({ status: "expired" })
        .eq("id", id);

      if (terminateError) throw terminateError;

      // Create new contract
      const { data: newContract, error: insertError } = await supabase
        .from("employee_contracts")
        .insert({
          employee_id: oldContract.employee_id,
          contract_number: data.contract_number,
          contract_type: data.contract_type,
          start_date: data.start_date,
          end_date: data.end_date || null,
          salary: data.salary,
          allowances: data.allowances,
          status: "active",
          notes: "Perpanjangan kontrak",
        })
        .select()
        .single();

      if (insertError) throw insertError;
      result = newContract;
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid action" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: action === "insert" ? "Kontrak berhasil dibuat" : 
                 action === "renew" ? "Kontrak berhasil diperpanjang" : "Kontrak berhasil diupdate",
        data: result,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Internal server error", message: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Internal server error", message: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

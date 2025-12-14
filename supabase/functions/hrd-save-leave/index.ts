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
        .from("leave_requests")
        .insert({
          employee_id: data.employee_id,
          leave_type: data.leave_type,
          start_date: data.start_date,
          end_date: data.end_date,
          total_days: data.total_days,
          reason: data.reason,
          status: data.status || "pending",
          approved_by: data.approved_by || null,
          approved_at: data.approved_at || null,
          notes: data.notes,
        })
        .select()
        .single();

      if (error) throw error;
      result = insertData;
    } else if (action === "update" && id) {
      const { data: updateData, error } = await supabase
        .from("leave_requests")
        .update({
          employee_id: data.employee_id,
          leave_type: data.leave_type,
          start_date: data.start_date,
          end_date: data.end_date,
          total_days: data.total_days,
          reason: data.reason,
          status: data.status,
          approved_by: data.approved_by || null,
          approved_at: data.approved_at || null,
          notes: data.notes,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      result = updateData;
    } else if (action === "approve" && id) {
      const { data: approveData, error } = await supabase
        .from("leave_requests")
        .update({
          status: "approved",
          approved_by: data.approved_by,
          approved_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      result = approveData;
    } else if (action === "reject" && id) {
      const { data: rejectData, error } = await supabase
        .from("leave_requests")
        .update({
          status: "rejected",
          approved_by: data.approved_by,
          approved_at: new Date().toISOString(),
          notes: data.notes,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      result = rejectData;
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid action" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: action === "insert" ? "Pengajuan cuti berhasil" : "Data cuti berhasil diupdate",
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

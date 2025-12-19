import { corsHeaders } from "@shared/cors.ts";
import { createSupabaseClient } from "@shared/supabase-client.ts";

interface ManagerApproveRequest {
  advance_id: string;
  approver_id?: string;
  action?: "approve" | "reject";
  notes?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  try {
    const supabaseClient = createSupabaseClient();

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser(authHeader.replace("Bearer ", ""));

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const payload: ManagerApproveRequest = await req.json();

    if (!payload.advance_id) {
      throw new Error("advance_id is required");
    }

    if (payload.action && payload.action !== "approve") {
      throw new Error("Only approve action is supported for now");
    }

    const { data, error } = await supabaseClient
      .from("employee_advances")
      .update({
        status: "waiting_finance_verification",
        manager_approver_id: payload.approver_id || user.id,
        manager_approved_at: new Date().toISOString(),
        manager_notes: payload.notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payload.advance_id)
      .eq("status", "disbursed")
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return new Response(JSON.stringify({ data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("employee-advance-approve-manager error", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

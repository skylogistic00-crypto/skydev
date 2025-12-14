import { corsHeaders } from "@shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({ error: "Missing Supabase configuration" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body = await req.json();
    const { action, data, id } = body;

    let result;

    if (action === "clock_in") {
      const attendanceDate = data.attendance_date || new Date().toISOString().split('T')[0];
      const clockInTime = new Date().toISOString();
      
      const { data: insertData, error } = await supabase
        .from("attendance")
        .insert({
          employee_id: data.employee_id,
          attendance_date: attendanceDate,
          clock_in: clockInTime,
          clock_in_location: data.clock_in_location || null,
          clock_in_photo_url: data.clock_in_photo_url || null,
          status: "present",
          notes: data.notes || null,
          overtime_hours: 0,
        })
        .select("id")
        .single();

      if (error) throw error;
      result = insertData;

    } else if (action === "clock_out" && id) {
      const clockOutTime = new Date().toISOString();
      
      const { data: updateData, error } = await supabase
        .from("attendance")
        .update({
          clock_out: clockOutTime,
          clock_out_location: data.clock_out_location || null,
          clock_out_photo_url: data.clock_out_photo_url || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select("id")
        .single();

      if (error) throw error;
      result = updateData;

    } else if (action === "insert") {
      const { data: insertData, error } = await supabase
        .from("attendance")
        .insert({
          employee_id: data.employee_id,
          attendance_date: data.attendance_date,
          clock_in: data.clock_in || null,
          clock_out: data.clock_out || null,
          clock_in_location: data.clock_in_location || null,
          clock_out_location: data.clock_out_location || null,
          clock_in_photo_url: data.clock_in_photo_url || null,
          clock_out_photo_url: data.clock_out_photo_url || null,
          status: data.status || "present",
          overtime_hours: data.overtime_hours || 0,
          notes: data.notes || null,
        })
        .select("id")
        .single();

      if (error) throw error;
      result = insertData;

    } else if (action === "update" && id) {
      const { data: updateData, error } = await supabase
        .from("attendance")
        .update({
          employee_id: data.employee_id,
          attendance_date: data.attendance_date,
          clock_in: data.clock_in || null,
          clock_out: data.clock_out || null,
          clock_in_location: data.clock_in_location || null,
          clock_out_location: data.clock_out_location || null,
          clock_in_photo_url: data.clock_in_photo_url || null,
          clock_out_photo_url: data.clock_out_photo_url || null,
          status: data.status,
          overtime_hours: data.overtime_hours || 0,
          notes: data.notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select("id")
        .single();

      if (error) throw error;
      result = updateData;

    } else {
      return new Response(
        JSON.stringify({ error: "Invalid action" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: action === "clock_in" ? "Clock in berhasil" : 
                 action === "clock_out" ? "Clock out berhasil" : "Kehadiran berhasil disimpan",
        data: result,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in hrd-save-attendance:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", message: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

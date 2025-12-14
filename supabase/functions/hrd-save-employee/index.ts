import { corsHeaders } from "@shared/cors.ts";
import { createSupabaseClient } from "@shared/supabase-client.ts";

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  try {
    const supabase = createSupabaseClient();
    const body = await req.json();
    const { action, data, id } = body;

    // Sanitize string values to prevent SQL injection
    const sanitize = (val: string | null | undefined): string => {
      if (val === null || val === undefined || val === "") return "NULL";
      return `'${String(val).replace(/'/g, "''")}'`;
    };

    const sanitizeNumber = (val: string | number | null | undefined): string => {
      if (val === null || val === undefined || val === "") return "NULL";
      const num = typeof val === "string" ? parseFloat(val) : val;
      return isNaN(num) ? "NULL" : String(num);
    };

    // Sanitize UUID fields - returns NULL for empty strings or wraps valid UUIDs in quotes
    const sanitizeUUID = (val: string | null | undefined): string => {
      if (val === null || val === undefined || val === "" || val.trim() === "") return "NULL";
      // Basic UUID validation (8-4-4-4-12 format)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(val.trim())) {
        return `'${val.trim()}'`;
      }
      return "NULL";
    };

    // Sanitize date fields - returns NULL for empty strings or null values
    const sanitizeDate = (dateValue: string | null | undefined): string => {
      if (dateValue === null || dateValue === undefined) {
        return "NULL";
      }
      if (typeof dateValue === "string" && dateValue.trim() === "") {
        return "NULL";
      }
      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(dateValue)) {
        return "NULL";
      }
      return `'${dateValue}'`;
    };

    let result;

    if (action === "insert") {
      const { data: insertData, error: insertError } = await supabase
        .from("employees")
        .insert({
          full_name: data.full_name || null,
          email: data.email || null,
          phone: data.phone || null,
          birth_date: data.birth_date || null,
          birth_place: data.birth_place || null,
          gender: data.gender || null,
          religion: data.religion || null,
          marital_status: data.marital_status || null,
          address: data.address || null,
          city: data.city || null,
          province: data.province || null,
          postal_code: data.postal_code || null,
          ktp_number: data.ktp_number || null,
          npwp_number: data.npwp_number || null,
          bpjs_kesehatan: data.bpjs_kesehatan || null,
          bpjs_ketenagakerjaan: data.bpjs_ketenagakerjaan || null,
          department_id: data.department_id || null,
          position_id: data.position_id || null,
          employment_status: data.employment_status || null,
          join_date: data.join_date || null,
          basic_salary: data.basic_salary || null,
          bank_name: data.bank_name || null,
          bank_account_number: data.bank_account_number || null,
          bank_account_holder: data.bank_account_holder || null,
          emergency_contact_name: data.emergency_contact_name || null,
          emergency_contact_relation: data.emergency_contact_relation || null,
          emergency_contact_phone: data.emergency_contact_phone || null,
          emergency_contact_address: data.emergency_contact_address || null,
          last_education: data.last_education || null,
          institution_name: data.institution_name || null,
          major: data.major || null,
          graduation_year: data.graduation_year || null,
          status: data.status || "active",
          notes: data.notes || null,
        })
        .select("id, employee_number")
        .single();

      if (insertError) {
        return new Response(
          JSON.stringify({ error: "Database operation failed", details: insertError.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      result = insertData;
    } else if (action === "update" && id) {
      const { data: updateData, error: updateError } = await supabase
        .from("employees")
        .update({
          full_name: data.full_name || null,
          email: data.email || null,
          phone: data.phone || null,
          birth_date: data.birth_date || null,
          birth_place: data.birth_place || null,
          gender: data.gender || null,
          religion: data.religion || null,
          marital_status: data.marital_status || null,
          address: data.address || null,
          city: data.city || null,
          province: data.province || null,
          postal_code: data.postal_code || null,
          ktp_number: data.ktp_number || null,
          npwp_number: data.npwp_number || null,
          bpjs_kesehatan: data.bpjs_kesehatan || null,
          bpjs_ketenagakerjaan: data.bpjs_ketenagakerjaan || null,
          department_id: data.department_id || null,
          position_id: data.position_id || null,
          employment_status: data.employment_status || null,
          join_date: data.join_date || null,
          basic_salary: data.basic_salary || null,
          bank_name: data.bank_name || null,
          bank_account_number: data.bank_account_number || null,
          bank_account_holder: data.bank_account_holder || null,
          emergency_contact_name: data.emergency_contact_name || null,
          emergency_contact_relation: data.emergency_contact_relation || null,
          emergency_contact_phone: data.emergency_contact_phone || null,
          emergency_contact_address: data.emergency_contact_address || null,
          last_education: data.last_education || null,
          institution_name: data.institution_name || null,
          major: data.major || null,
          graduation_year: data.graduation_year || null,
          status: data.status || null,
          notes: data.notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select("id, employee_number")
        .single();

      if (updateError) {
        return new Response(
          JSON.stringify({ error: "Database operation failed", details: updateError.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      result = updateData;
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid action. Use 'insert' or 'update'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: action === "insert" ? "Karyawan berhasil ditambahkan" : "Karyawan berhasil diupdate",
        data: result,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error.message,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

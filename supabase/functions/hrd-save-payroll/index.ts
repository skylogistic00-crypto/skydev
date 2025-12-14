import { corsHeaders } from "@shared/cors.ts";
import { createSupabaseClient } from "@shared/supabase-client.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      headers: corsHeaders, 
      status: 204 
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with service role to bypass RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.39.3');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify user token and check role
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Check user role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role_name')
      .eq('id', user.id)
      .single();
    
    console.log("User ID:", user.id);
    console.log("User data:", userData);
    console.log("User error:", userError);
    
    if (userError || !userData) {
      return new Response(
        JSON.stringify({ 
          error: "User not found",
          details: userError?.message,
          userId: user.id
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const allowedRoles = ['super_admin', 'admin', 'hr_manager', 'hr_staff'];
    console.log("User role:", userData.role_name);
    console.log("Allowed roles:", allowedRoles);
    
    if (!allowedRoles.includes(userData.role_name)) {
      return new Response(
        JSON.stringify({ 
          error: "Insufficient permissions",
          userRole: userData.role_name,
          allowedRoles: allowedRoles
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const requestText = await req.text();
    console.log("Request body text:", requestText);
    
    if (!requestText || requestText.trim() === '') {
      return new Response(
        JSON.stringify({ error: "Empty request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = JSON.parse(requestText);
    const { action, data, id } = body;

    let result;

    if (action === "insert") {
      // Check if payroll already exists for this employee and period
      const { data: existingPayroll } = await supabase
        .from("payroll")
        .select("id")
        .eq("employee_id", data.employee_id)
        .eq("period_month", data.period_month)
        .eq("period_year", data.period_year)
        .single();

      if (existingPayroll) {
        return new Response(
          JSON.stringify({ 
            error: "Payroll sudah ada untuk karyawan ini pada periode yang sama",
            message: `Payroll untuk bulan ${data.period_month}/${data.period_year} sudah dibuat. Gunakan fitur edit untuk mengubah data.`
          }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Calculate totals
      const basicSalary = parseFloat(data.basic_salary) || 0;
      const allowances = parseFloat(data.allowances) || 0;
      const overtimePay = parseFloat(data.overtime_pay) || 0;
      const deductions = parseFloat(data.deductions) || 0;
      const tax = parseFloat(data.tax) || 0;
      const bpjsKesehatan = parseFloat(data.bpjs_kesehatan) || 0;
      const bpjsKetenagakerjaan = parseFloat(data.bpjs_ketenagakerjaan) || 0;

      const grossSalary = basicSalary + allowances + overtimePay;
      const totalDeductions = deductions + tax + bpjsKesehatan + bpjsKetenagakerjaan;
      const netSalary = grossSalary - totalDeductions;

      const { data: insertData, error } = await supabase
        .from("payroll")
        .insert({
          employee_id: data.employee_id,
          period_month: data.period_month,
          period_year: data.period_year,
          basic_salary: basicSalary,
          transport_allowance: 0,
          meal_allowance: 0,
          position_allowance: 0,
          other_allowances: allowances > 0 ? { other: allowances } : null,
          overtime_hours: parseFloat(data.overtime_hours) || 0,
          overtime_pay: overtimePay,
          late_deduction: 0,
          absence_deduction: 0,
          loan_deduction: 0,
          bpjs_kesehatan_deduction: bpjsKesehatan,
          bpjs_ketenagakerjaan_deduction: bpjsKetenagakerjaan,
          other_deductions: deductions > 0 ? { other: deductions } : null,
          tax_pph21: tax,
          gross_salary: grossSalary,
          total_deductions: totalDeductions,
          net_salary: netSalary,
          payment_status: data.status || "pending",
          notes: data.notes,
        })
        .select()
        .single();

      if (error) throw error;
      result = insertData;
    } else if (action === "update" && id) {
      // Calculate totals for update
      const basicSalary = parseFloat(data.basic_salary) || 0;
      const allowances = parseFloat(data.allowances) || 0;
      const overtimePay = parseFloat(data.overtime_pay) || 0;
      const deductions = parseFloat(data.deductions) || 0;
      const tax = parseFloat(data.tax) || 0;
      const bpjsKesehatan = parseFloat(data.bpjs_kesehatan) || 0;
      const bpjsKetenagakerjaan = parseFloat(data.bpjs_ketenagakerjaan) || 0;

      const grossSalary = basicSalary + allowances + overtimePay;
      const totalDeductions = deductions + tax + bpjsKesehatan + bpjsKetenagakerjaan;
      const netSalary = grossSalary - totalDeductions;

      const { data: updateData, error } = await supabase
        .from("payroll")
        .update({
          employee_id: data.employee_id,
          period_month: data.period_month,
          period_year: data.period_year,
          basic_salary: basicSalary,
          transport_allowance: 0,
          meal_allowance: 0,
          position_allowance: 0,
          other_allowances: allowances > 0 ? { other: allowances } : null,
          overtime_hours: parseFloat(data.overtime_hours) || 0,
          overtime_pay: overtimePay,
          late_deduction: 0,
          absence_deduction: 0,
          loan_deduction: 0,
          bpjs_kesehatan_deduction: bpjsKesehatan,
          bpjs_ketenagakerjaan_deduction: bpjsKetenagakerjaan,
          other_deductions: deductions > 0 ? { other: deductions } : null,
          tax_pph21: tax,
          gross_salary: grossSalary,
          total_deductions: totalDeductions,
          net_salary: netSalary,
          payment_status: data.status || "pending",
          notes: data.notes,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      result = updateData;
    } else if (action === "process" && id) {
      const { data: processData, error } = await supabase
        .from("payroll")
        .update({
          payment_status: "processed",
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      result = processData;
    } else if (action === "pay" && id) {
      const { data: payData, error } = await supabase
        .from("payroll")
        .update({
          payment_status: "paid",
          payment_date: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      result = payData;
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid action" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: action === "insert" ? "Payroll berhasil dibuat" : "Payroll berhasil diupdate",
        data: result,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in hrd-save-payroll:", error);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error", 
        message: error.message,
        details: error.details || null,
        hint: error.hint || null,
        code: error.code || null
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

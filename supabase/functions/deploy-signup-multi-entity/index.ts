import { corsHeaders } from "@shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  try {
    // The signup-multi-entity function code
    const functionCode = `import { corsHeaders } from "@shared/cors.ts";
import { createSupabaseClient } from "@shared/supabase-client.ts";
import { validateEmail, validatePassword, validateRequiredFields } from "@shared/validation.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  try {
    const body = await req.json();
    console.log("REQUEST BODY:", body);

    const { 
      email, 
      password, 
      full_name, 
      entity_type, 
      phone, 
      details = {}, 
      file_urls = {}, 
      role_name, 
      role_id 
    } = body;

    const requiredFields = ["email", "password", "full_name", "entity_type"];
    const validation = validateRequiredFields(body, requiredFields);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: \`Missing required fields: \${validation.missing?.join(", ")}\` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    if (!validateEmail(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return new Response(
        JSON.stringify({ error: passwordValidation.error }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const supabase = createSupabaseClient();

    let normalizedEntityType = (entity_type || "customer")
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\\s+/g, "_");

    if (normalizedEntityType === "karyawan") normalizedEntityType = "employee";

    const normalizedRoleFromUI = role_name && typeof role_name === "string"
      ? role_name.trim().toLowerCase().replace(/\\s+/g, "_")
      : null;

    const fallbackRoleForEntity = (() => {
      if (normalizedEntityType === "employee") return "admin";
      if (["supplier", "customer", "consignee", "shipper", "driver"].includes(normalizedEntityType)) {
        return "viewer";
      }
      return "viewer";
    })();

    const role = normalizedRoleFromUI || fallbackRoleForEntity;
    const resolvedRoleId = role_id || null;
    const resolvedRoleName = role_name || role;

    console.log("Normalized entity:", normalizedEntityType, "resolved role:", role, "role_id:", resolvedRoleId, "role_name:", resolvedRoleName);

    const redirectTo = "https://acc.skykargo.co.id/email-redirect/index.html";
    const { data: authUser, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
        data: {
          full_name,
          entity_type: normalizedEntityType,
          role,
          role_id: resolvedRoleId
        }
      }
    });

    if (authError) {
      console.error("Auth error:", authError);
      if (authError.message?.includes("already been registered") || authError.code === "email_exists") {
        return new Response(
          JSON.stringify({ 
            error: "An account with this email already exists. Please login instead or use a different email." 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 409 }
        );
      }
      return new Response(
        JSON.stringify({ error: authError.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    if (!authUser || !authUser.user || !authUser.user.id) {
      console.error("Auth returned no user:", authUser);
      return new Response(
        JSON.stringify({ error: "Failed to create auth user" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const usersData: Record<string, any> = {
      id: authUser.user.id,
      email,
      full_name,
      role,
      role_id: resolvedRoleId,
      role_name: resolvedRoleName,
      entity_type: normalizedEntityType,
      entity: normalizedEntityType,
      phone,
      is_active: false,
      created_at: new Date().toISOString()
    };

    if (normalizedEntityType === "supplier") {
      usersData.supplier_name = details.entity_name || full_name;
      usersData.contact_person = details.contact_person || full_name;
      usersData.city = details.city;
      usersData.country = details.country;
      usersData.address = details.address;
      usersData.pkp_status = details.is_pkp;
      usersData.bank_account_holder = details.bank_account_holder;
    }

    const { error: userError } = await supabase
      .from("users")
      .upsert(usersData, { onConflict: "id" });

    if (userError) {
      console.error("User upsert error:", userError);
      try {
        await supabase.auth.admin.deleteUser(authUser.user.id);
      } catch (delErr) {
        console.error("Rollback delete user error:", delErr);
      }
      return new Response(
        JSON.stringify({ error: "Failed to create user profile" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    let entityError = null;
    const normalizedEntity = normalizedEntityType.toLowerCase();
    
    const allowedColumns: Record<string, string[]> = {
      supplier: ["address", "city", "country", "is_pkp", "tax_id", "bank_name", "bank_account_holder", "payment_terms", "category", "currency", "status"],
      customer: ["address", "city", "country", "is_pkp", "tax_id", "bank_name", "bank_account_holder", "payment_terms", "category", "currency", "status", "birth_date"],
      consignee: ["address", "city", "country", "is_pkp", "tax_id", "bank_name", "bank_account_holder", "payment_terms", "category", "currency", "status"],
      shipper: ["address", "city", "country", "is_pkp", "tax_id", "bank_name", "bank_account_holder", "payment_terms", "category", "currency", "status"],
      employee: ["position", "department", "hire_date", "address", "city", "country", "status"],
      driver: ["license_number", "license_type", "license_expiry", "address", "city", "country", "status"],
    };
    
    const filterEntityData = (data: Record<string, any>, entityType: string): Record<string, any> => {
      const allowed = allowedColumns[entityType] || [];
      const filtered: Record<string, any> = {};
      for (const key of allowed) {
        if (data[key] !== undefined) {
          filtered[key] = data[key];
        }
      }
      return filtered;
    };
    
    const entityData = filterEntityData({ ...details, ...file_urls }, normalizedEntity);
    
    try {
      if (normalizedEntity === "supplier") {
        const { error } = await supabase.from("suppliers").insert({
          user_id: authUser.user.id,
          supplier_name: details.entity_name || full_name,
          contact_person: details.contact_person || full_name,
          email,
          phone_number: phone || "",
          ...entityData,
        });
        entityError = error;
      } else if (normalizedEntity === "customer") {
        const { error } = await supabase.from("customers").insert({
          user_id: authUser.user.id,
          customer_name: details.entity_name || full_name,
          contact_person: details.contact_person || full_name,
          email,
          phone_number: phone || "",
          ...entityData,
        });
        entityError = error;
      } else if (normalizedEntity === "consignee") {
        const { error } = await supabase.from("consignees").insert({
          user_id: authUser.user.id,
          consignee_name: details.entity_name || full_name,
          contact_person: details.contact_person || full_name,
          email,
          phone_number: phone || "",
          ...entityData,
        });
        entityError = error;
      } else if (normalizedEntity === "shipper") {
        const { error } = await supabase.from("shippers").insert({
          user_id: authUser.user.id,
          shipper_name: details.entity_name || full_name,
          contact_person: details.contact_person || full_name,
          email,
          phone_number: phone || "",
          ...entityData,
        });
        entityError = error;
      } else if (normalizedEntity === "employee") {
        const { error } = await supabase.from("employees").insert({
          user_id: authUser.user.id,
          full_name,
          email,
          phone,
          ...entityData,
        });
        entityError = error;
      } else if (normalizedEntity === "driver" || normalizedEntity === "driver_perusahaan" || normalizedEntity === "driver_mitra") {
        const driverType = normalizedEntity === "driver_perusahaan" ? "perusahaan" : 
                          normalizedEntity === "driver_mitra" ? "mitra" : "general";
        const { error } = await supabase.from("drivers").insert({
          user_id: authUser.user.id,
          full_name,
          email,
          phone,
          driver_type: driverType,
          ...entityData,
        });
        entityError = error;
      }
      
      if (entityError) {
        console.error("Entity insert error:", entityError);
      }
    } catch (err) {
      console.error("Entity creation error:", err);
    }

    return new Response(
      JSON.stringify({
        success: true,
        user_id: authUser.user.id,
        message: "User created successfully. Please check your email for verification.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});`;

    const url = `https://api.picaos.com/v1/passthrough/projects/${SUPABASE_PROJECT_REF}/functions/deploy`;

    const body = {
      file: [functionCode],
      metadata: {
        entrypoint_path: "index.ts",
        import_map_path: "deno.json",
        static_patterns: ["**/*"],
        verify_jwt: true,
        name: "signup-multi-entity"
      }
    };

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const response = await supabase.functions.invoke('signup-multi-entity', {
      body: body
    });

    if (response.data) {
      return new Response(
        JSON.stringify({ success: true, data: response.data }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 201 }
      );
    } else {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: response.error?.message || "Failed to deploy function" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: response.status }
      );
    }
  } catch (error) {
    console.error("Deploy error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

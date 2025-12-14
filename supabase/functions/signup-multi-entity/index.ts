import { corsHeaders } from "@shared/cors.ts";
import { createSupabaseClient } from "@shared/supabase-client.ts";
import { validateEmail, validatePassword, validateRequiredFields } from "@shared/validation.ts";

// ========================================
// UDFM ULTRA: Safe value extraction helpers
// ========================================
const safeString = (value: any, fallback = ""): string => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
};

const safeObject = (value: any, fallback = {}): Record<string, any> => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "object" && !Array.isArray(value)) return value;
  return fallback;
};

const safeAny = (value: any, fallback: any = null): any => {
  if (value === undefined) return fallback;
  return value;
};

// ========================================
// UDFM ULTRA: Smart merge for dynamic fields
// ========================================
const smartMergeFields = (
  target: Record<string, any>,
  source: Record<string, any>,
  allowedFields: string[]
): void => {
  if (!source || typeof source !== "object") return;
  
  for (const key of Object.keys(source)) {
    try {
      const value = source[key];
      // Skip if value is null, undefined, or empty string
      if (value === null || value === undefined || value === "") continue;
      // Skip if already set in target
      if (target[key] !== undefined && target[key] !== null && target[key] !== "") continue;
      // Only add if in allowed fields list
      if (allowedFields.includes(key)) {
        target[key] = value;
      }
    } catch (e) {
      console.error(`Error merging field ${key}:`, e);
    }
  }
};

Deno.serve(async (req) => {
  // CRITICAL: Handle CORS preflight request FIRST with proper 204 status
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    let body: Record<string, any>;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body", code: "PARSE_ERROR" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
    
    // ========================================
    // UDFM ULTRA: Safe body parsing with fallbacks
    // ========================================
    console.log("=== SIGNUP-MULTI-ENTITY v225 (UDFM ULTRA) ===");
    console.log("REQUEST BODY KEYS:", Object.keys(body || {}));
    console.log("REQUEST BODY (truncated):", JSON.stringify(body || {}).substring(0, 500));
    console.log("EMAIL VALUE:", body?.email ? `"${body.email}"` : "MISSING/EMPTY");
    console.log("PASSWORD VALUE:", body?.password ? `"${body.password.substring(0, 3)}***"` : "MISSING/EMPTY");
    console.log("ENTITY_TYPE VALUE:", body?.entity_type ? `"${body.entity_type}"` : "MISSING/EMPTY");
    
    // Safe extraction with fallbacks
    const email = safeString(body?.email);
    const password = safeString(body?.password);
    const full_name = safeString(body?.full_name);
    const entity_type = safeString(body?.entity_type, "customer");
    const phone = safeString(body?.phone);
    const details = safeObject(body?.details, {});
    const file_urls = safeObject(body?.file_urls, {});
    const role_name = safeString(body?.role_name);
    const role_id = safeAny(body?.role_id);
    const ktp_number = safeString(body?.ktp_number);
    const ktp_address = safeString(body?.ktp_address);
    const religion = safeString(body?.religion);
    const ethnicity = safeString(body?.ethnicity);
    const license_number = safeString(body?.license_number);
    const license_expiry_date = safeString(body?.license_expiry_date);
    const education = safeString(body?.education);
    const upload_ijasah = safeString(body?.upload_ijasah);
    const first_name = safeString(body?.first_name);
    const last_name = safeString(body?.last_name);
    
    console.log("DETAILS OBJECT KEYS:", Object.keys(details));
    console.log("FILE_URLS OBJECT KEYS:", Object.keys(file_urls));

    // ========================================
    // DEBUG: Log received details object (safe)
    // ========================================
    console.log("=== RECEIVED DETAILS FROM FRONTEND ===");
    console.log("Details keys:", Object.keys(details));
    console.log("Details has anggota_keluarga:", details?.anggota_keluarga ? "YES" : "NO");
    console.log("Details has nik:", details?.nik ? "YES" : "NO");
    console.log("Details has nomor_kk:", details?.nomor_kk ? "YES" : "NO");
    console.log("Details has nama:", details?.nama ? "YES" : "NO");
    try {
      console.log("Full details (truncated):", JSON.stringify(details, null, 2).substring(0, 1000));
    } catch (e) {
      console.log("Could not stringify details:", e);
    }
    console.log("=== END RECEIVED DETAILS ===");

    // Validate required fields - full_name is optional now (can be derived from OCR or email)
    const requiredFields = ["email", "password"];
    const bodyForValidation = { email, password };
    console.log("VALIDATION INPUT - email:", email ? `"${email}"` : "EMPTY");
    console.log("VALIDATION INPUT - password:", password ? `"${password.substring(0, 3)}***"` : "EMPTY");
    const validation = validateRequiredFields(bodyForValidation, requiredFields);
    console.log("VALIDATION RESULT:", JSON.stringify(validation));
    if (!validation.valid) {
      console.error("Validation failed:", validation.missing);
      const errorMessage = `Missing required fields: ${validation.missing?.join(", ")}`;
      console.error("Returning 400 error:", errorMessage);
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          code: "MISSING_FIELDS",
          details: {
            missing: validation.missing,
            received: { email: email ? "present" : "missing", password: password ? "present" : "missing" }
          }
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
    
    // Validate entity_type separately with fallback
    const finalEntityType = entity_type || "customer";
    console.log("Using entity_type:", finalEntityType);
    
    // Derive full_name if not provided - use email prefix as fallback
    let derivedFullName = full_name || "";
    
    // Try to get from details
    if (!derivedFullName && details) {
      derivedFullName = details.contact_person || details.entity_name || "";
    }
    
    // If still empty, derive from email
    if (!derivedFullName && email) {
      try {
        const emailPrefix = email.split("@")[0] || "User";
        // Replace dots, underscores, hyphens with spaces and capitalize each word
        const words = emailPrefix.replace(/[._-]/g, " ").split(" ");
        derivedFullName = words
          .map((word: string) => {
            if (!word) return "";
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
          })
          .filter((w: string) => w.length > 0)
          .join(" ");
      } catch (e) {
        console.error("Error deriving name from email:", e);
        derivedFullName = "User";
      }
    }
    
    // Final fallback
    if (!derivedFullName) {
      derivedFullName = "User";
    }
    
    console.log("Derived full name:", derivedFullName);

    // Validate email
    console.log("EMAIL VALIDATION - checking:", email);
    if (!validateEmail(email)) {
      console.error("Email validation failed for:", email);
      return new Response(
        JSON.stringify({ 
          error: "Invalid email format",
          code: "INVALID_EMAIL",
          details: { email: email || "empty" }
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
    console.log("EMAIL VALIDATION - passed");

    // Validate password
    console.log("PASSWORD VALIDATION - checking length:", password?.length);
    const passwordValidation = validatePassword(password);
    console.log("PASSWORD VALIDATION RESULT:", JSON.stringify(passwordValidation));
    if (!passwordValidation.valid) {
      console.error("Password validation failed:", passwordValidation.error);
      return new Response(
        JSON.stringify({ 
          error: passwordValidation.error,
          code: "INVALID_PASSWORD",
          details: { passwordLength: password?.length || 0 }
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
    console.log("PASSWORD VALIDATION - passed");

    const supabase = createSupabaseClient();

    // Keep original entity_type for display (e.g., "Karyawan")
    const originalEntityType = finalEntityType;
    
    // Normalize entity type for table mapping only
    let normalizedEntityType = originalEntityType
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "_");

    // Map synonyms for table insertion only
    if (normalizedEntityType === "karyawan") normalizedEntityType = "employee";

    // Determine role: prefer explicit role_name from UI, fallback by entity default
    const normalizedRoleFromUI = role_name && typeof role_name === "string"
      ? role_name.trim().toLowerCase().replace(/\s+/g, "_")
      : null;

    // fallback rules (only used if UI didn't send a role)
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

    console.log("Normalized entity:", normalizedEntityType, "resolved role:", role, "role_id:", resolvedRoleId, "role_name:", resolvedRoleName, "derivedFullName:", derivedFullName);

    // Create auth user with email verification
    const redirectTo = "https://acc.skykargo.co.id/email-redirect/index.html";
    const { data: authUser, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
        data: {
          full_name: derivedFullName,
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
        JSON.stringify({ error: authError.message, code: "AUTH_ERROR" }),
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

    const userId = authUser.user.id;
    console.log("Auth user created with ID:", userId);

    // Wait for auth.users to be fully committed - increased delay to 3 seconds
    console.log("Waiting for auth.users to commit...");
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log("Wait complete, proceeding with profile creation");

    // Prepare users table data
    // Use original entity from role selection (e.g., "Karyawan") not normalized
    const usersData: Record<string, any> = {
      id: userId,
      email,
      full_name: derivedFullName,
      first_name: first_name || null,
      last_name: last_name || null,
      role,
      role_id: resolvedRoleId,
      role_name: resolvedRoleName,
      entity_type: originalEntityType,  // Keep original value like "Karyawan"
      entity: originalEntityType,        // Keep original value like "Karyawan"
      phone,
      is_active: false,
      created_at: new Date().toISOString()
    };

    // ========================================
    // CRITICAL: ADD ALL OCR EXTRACTED FIELDS FROM DETAILS TO USERS TABLE
    // ========================================
    console.log("=== ADDING OCR FIELDS FROM DETAILS TO USERS TABLE ===");
    
    // Define allowed OCR fields that exist in users table
    // UDFM ULTRA: Support ALL document types
    const allowedOCRFields = [
      // KTP Fields
      "nik", "nama", "tempat_lahir", "tanggal_lahir", "jenis_kelamin",
      "agama", "status_perkawinan", "pekerjaan", "kewarganegaraan",
      "berlaku_hingga", "golongan_darah", "alamat",
      // KK Fields
      "nomor_kk", "nama_kepala_keluarga", "rt_rw", "kelurahan_desa",
      "kecamatan", "kabupaten_kota", "provinsi", "kode_pos",
      "tanggal_dikeluarkan", "anggota_keluarga",
      // IJAZAH Fields (Complete)
      "nomor_ijazah", "nama_sekolah", "jenjang", "jurusan", 
      "tahun_lulus", "tanggal_lulus", "nomor_peserta_ujian", "nisn",
      "program_studi", "fakultas", "gelar", "ipk", "akreditasi",
      "nomor_seri_ijazah", "kepala_sekolah", "tanggal_terbit",
      // NPWP Fields
      "nomor_npwp", "tanggal_terdaftar", "kpp", "status_wp",
      // SIM Fields
      "nomor_sim", "golongan_sim", "tinggi_badan",
      // STNK Fields
      "nomor_polisi", "nama_pemilik", "nomor_rangka", "nomor_mesin",
      "merk", "tipe", "model", "tahun_pembuatan", "warna",
      "bahan_bakar", "isi_silinder", "masa_berlaku",
      // PAJAK KENDARAAN Fields
      "pkb_pokok", "swdkllj", "denda_pkb", "denda_swdkllj",
      "total_bayar", "tanggal_bayar",
      // AWB Fields
      "awb_number", "shipper_name", "shipper_address",
      "consignee_name", "consignee_address", "origin", "destination",
      "flight_number", "flight_date", "pieces", "weight",
      "description", "declared_value",
      // INVOICE Fields
      "nomor_invoice", "tanggal_invoice", "nama_penjual", "alamat_penjual",
      "npwp_penjual", "nama_pembeli", "alamat_pembeli", "npwp_pembeli",
      "items", "subtotal", "ppn", "total", "tanggal_jatuh_tempo",
      // CV Fields
      "email", "telepon", "pendidikan", "pengalaman_kerja",
      "keahlian", "bahasa", "sertifikasi",
      // BPJS Fields
      "nomor_bpjs", "kelas", "faskes_tingkat_1", "tanggal_berlaku",
      // AKTA LAHIR Fields
      "nomor_akta", "nama_ayah", "nama_ibu", "tempat_terbit",
      // SURAT KETERANGAN Fields
      "nomor_surat", "perihal", "instansi",
      // Debug notes
      "debug_notes",
      // Additional fields
      "ktp_number", "ktp_address", "religion", "ethnicity", "education",
      "license_number", "license_expiry_date", "first_name", "last_name",
      // Document URLs
      "upload_ijasah", "ktp_document_url", "selfie_url", "family_card_url",
      "sim_url", "skck_url",
      // Address fields
      "address", "city", "country",
      // Document details namespace
      "details"
    ];
    
    // Add allowed fields from details to usersData with safe handling
    if (details && typeof details === "object") {
      try {
        const detailEntries = Object.entries(details);
        for (const [key, value] of detailEntries) {
          try {
            // Only add if key is in allowedOCRFields and not already in usersData
            if (allowedOCRFields.includes(key) && usersData[key] === undefined && value !== undefined && value !== null) {
              // Handle date fields - convert to proper format
              if (["tanggal_lahir", "tanggal_dikeluarkan", "license_expiry_date"].includes(key)) {
                // If it's a valid date string, keep it; otherwise set to null
                if (value && typeof value === "string" && value.trim() !== "") {
                  usersData[key] = value;
                }
              } else {
                usersData[key] = value;
              }
              const displayValue = typeof value === "object" ? JSON.stringify(value).substring(0, 50) : String(value).substring(0, 50);
              console.log(`✔ Added OCR field to users: ${key} = ${displayValue}`);
            }
          } catch (fieldError) {
            console.error(`Error processing field ${key}:`, fieldError);
          }
        }
      } catch (detailsError) {
        console.error("Error processing details object:", detailsError);
      }
    }
    
    console.log("=== END OCR FIELDS ADDITION ===");
    
    // Log final usersData before insert (safe)
    console.log("=== FINAL USERS DATA BEFORE INSERT ===");
    console.log("Total fields:", Object.keys(usersData).length);
    console.log("Fields:", Object.keys(usersData).join(", "));
    try {
      console.log("Sample data (truncated):", JSON.stringify(usersData, null, 2).substring(0, 500));
    } catch (e) {
      console.log("Could not stringify usersData:", e);
    }
    console.log("=== END FINAL USERS DATA ===");

    // Add employee/karyawan specific fields to users table
    // Check for karyawan, driver_perusahaan, driver_mitra, employee, or driver
    const isEmployeeType = ["employee", "driver", "karyawan", "driver_perusahaan", "driver_mitra"].includes(normalizedEntityType);
    
    if (isEmployeeType) {
      // Get upload_ijasah URL - file already uploaded from frontend (safe extraction)
      const ijasahUrl = safeString(upload_ijasah) || safeString(details?.upload_ijasah) || safeString(file_urls?.upload_ijasah_url) || null;
      
      // Get ktp_document_url - file already uploaded from frontend
      const ktpDocUrl = safeString(details?.ktp_document_url) || safeString(file_urls?.ktp_document_url) || null;
      
      // Get selfie_url - file already uploaded from frontend
      const selfieUrl = safeString(details?.selfie_url) || safeString(file_urls?.selfie_url) || null;
      
      // Get family_card_url - file already uploaded from frontend
      const familyCardUrl = safeString(details?.family_card_url) || safeString(file_urls?.family_card_url) || null;
      
      // Get sim_url - file already uploaded from frontend
      const simUrl = safeString(details?.sim_url) || safeString(file_urls?.sim_url) || null;
      
      // Get skck_url - file already uploaded from frontend
      const skckUrl = safeString(details?.skck_url) || safeString(file_urls?.skck_url) || null;
      
      console.log("=== DOCUMENT URLS DEBUG ===");
      console.log("upload_ijasah:", ijasahUrl);
      console.log("ktp_document_url:", ktpDocUrl);
      console.log("selfie_url:", selfieUrl);
      console.log("family_card_url:", familyCardUrl);
      console.log("sim_url:", simUrl);
      console.log("skck_url:", skckUrl);
      console.log("=== END DEBUG ===");
      
      usersData["upload_ijasah"] = ijasahUrl;
      usersData["ktp_document_url"] = ktpDocUrl;
      usersData["selfie_url"] = selfieUrl;
      usersData["family_card_url"] = familyCardUrl;
      usersData["sim_url"] = simUrl;
      usersData["skck_url"] = skckUrl;
      usersData.ktp_number = safeString(ktp_number) || safeString(details?.ktp_number) || null;
      usersData.ktp_address = safeString(ktp_address) || safeString(details?.ktp_address) || null;
      usersData.religion = safeString(religion) || safeString(details?.religion) || null;
      usersData.ethnicity = safeString(ethnicity) || safeString(details?.ethnicity) || null;
      usersData.education = safeString(education) || safeString(details?.education) || null;
      usersData.license_number = safeString(license_number) || safeString(details?.license_number) || null;
      usersData.license_expiry_date = safeString(license_expiry_date) || safeString(details?.license_expiry_date) || null;
    }

    // For suppliers, add supplier-specific fields to users table (safe extraction)
    if (normalizedEntityType === "supplier") {
      usersData.supplier_name = safeString(details?.entity_name) || derivedFullName;
      usersData.contact_person = safeString(details?.contact_person) || derivedFullName;
      usersData.city = safeString(details?.city);
      usersData.country = safeString(details?.country);
      usersData.address = safeString(details?.address);
      usersData.pkp_status = safeAny(details?.is_pkp);
      usersData.bank_account_holder = safeString(details?.bank_account_holder);
    }

    // Upsert into users table with retry mechanism for foreign key constraint
    console.log("=== USERS DATA TO UPSERT ===");
    try {
      console.log(JSON.stringify(usersData, null, 2));
    } catch (e) {
      console.log("Could not stringify usersData for logging:", e);
    }
    console.log("=== END USERS DATA ===");
    
    let userError = null;
    let retryCount = 0;
    const maxRetries = 5;
    
    while (retryCount < maxRetries) {
      const { error } = await supabase
        .from("users")
        .upsert(usersData, { onConflict: "id" });
      
      if (!error) {
        userError = null;
        console.log("User profile created successfully on attempt", retryCount + 1);
        break;
      }
      
      // Check if it's a foreign key constraint error
      if (error.code === "23503" && error.message?.includes("users_id_fkey")) {
        retryCount++;
        console.log(`Foreign key constraint error, retry ${retryCount}/${maxRetries}...`);
        // Wait longer between retries - exponential backoff
        const waitTime = 2000 * retryCount;
        console.log(`Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else {
        // Different error, don't retry
        userError = error;
        break;
      }
    }
    
    // If still failing after retries, set the error
    if (retryCount >= maxRetries) {
      userError = { code: "23503", message: "Foreign key constraint error after max retries" };
    }

    if (userError) {
      console.error("User upsert error after retries:", userError);
      console.error("Error code:", userError.code);
      console.error("Error message:", userError.message);
      console.error("Error details:", JSON.stringify(userError, null, 2));
      // Rollback: delete auth user
      try {
        await supabase.auth.admin.deleteUser(userId);
      } catch (delErr) {
        console.error("Rollback delete user error:", delErr);
      }
      return new Response(
        JSON.stringify({ error: "Failed to create user profile", details: userError.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Insert into entity-specific table based on entity_type
    let entityError = null;
    const normalizedEntity = normalizedEntityType.toLowerCase();
    
    // Define allowed columns for each entity type
    const allowedColumns: Record<string, string[]> = {
      supplier: ["address", "city", "country", "is_pkp", "tax_id", "bank_name", "bank_account_holder", "payment_terms", "category", "currency", "status"],
      customer: ["address", "city", "country", "is_pkp", "tax_id", "bank_name", "bank_account_holder", "payment_terms", "category", "currency", "status", "birth_date"],
      consignee: ["address", "city", "country", "is_pkp", "tax_id", "bank_name", "bank_account_holder", "payment_terms", "category", "currency", "status"],
      shipper: ["address", "city", "country", "is_pkp", "tax_id", "bank_name", "bank_account_holder", "payment_terms", "category", "currency", "status"],
      employee: ["position", "department", "hire_date", "address", "city", "country", "status"],
      driver: ["license_number", "license_type", "license_expiry", "address", "city", "country", "status"],
    };
    
    // Filter entity data to only include allowed columns
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
    
    // Merge details and file_urls into entity data (safe)
    const safeDetails = safeObject(details, {});
    const safeFileUrls = safeObject(file_urls, {});
    const entityData = filterEntityData({ ...safeDetails, ...safeFileUrls }, normalizedEntity);
    
    try {
      if (normalizedEntity === "supplier") {
        const { error } = await supabase.from("suppliers").insert({
          user_id: userId,
          supplier_name: safeString(details?.entity_name) || derivedFullName,
          contact_person: safeString(details?.contact_person) || derivedFullName,
          email,
          phone_number: phone || "",
          ...entityData,
        });
        entityError = error;
      } else if (normalizedEntity === "customer") {
        const { error } = await supabase.from("customers").insert({
          user_id: userId,
          customer_name: safeString(details?.entity_name) || derivedFullName,
          contact_person: safeString(details?.contact_person) || derivedFullName,
          email,
          phone_number: phone || "",
          ...entityData,
        });
        entityError = error;
      } else if (normalizedEntity === "consignee") {
        // Remove full_name from entityData if it exists
        const { full_name: _, ...cleanEntityData } = entityData as any;
        
        const { error } = await supabase.from("consignees").insert({
          user_id: userId,
          consignee_name: safeString(details?.entity_name) || derivedFullName,
          contact_person: safeString(details?.contact_person) || derivedFullName,
          email,
          phone_number: phone || "",
          ...cleanEntityData,
        });
        entityError = error;
      } else if (normalizedEntity === "shipper") {
        const { error } = await supabase.from("shippers").insert({
          user_id: userId,
          shipper_name: safeString(details?.entity_name) || derivedFullName,
          contact_person: safeString(details?.contact_person) || derivedFullName,
          email,
          phone_number: phone || "",
          ...entityData,
        });
        entityError = error;
      } else if (normalizedEntity === "employee") {
        // Get document URLs for employees table (safe extraction)
        const empKtpDocUrl = safeString(details?.ktp_document_url) || safeString(file_urls?.ktp_document_url) || null;
        const empSelfieUrl = safeString(details?.selfie_url) || safeString(file_urls?.selfie_url) || null;
        const empIjasahUrl = safeString(upload_ijasah) || safeString(details?.upload_ijasah) || safeString(file_urls?.upload_ijasah_url) || null;
        const empFamilyCardUrl = safeString(details?.family_card_url) || safeString(file_urls?.family_card_url) || null;
        const empSimUrl = safeString(details?.sim_url) || safeString(file_urls?.sim_url) || null;
        const empSkckUrl = safeString(details?.skck_url) || safeString(file_urls?.skck_url) || null;
        
        const { error } = await supabase.from("employees").insert({
          user_id: userId,
          full_name: derivedFullName,
          email,
          phone,
          ktp_document_url: empKtpDocUrl,
          selfie_url: empSelfieUrl,
          upload_ijasah: empIjasahUrl,
          family_card_url: empFamilyCardUrl,
          sim_url: empSimUrl,
          skck_url: empSkckUrl,
          ktp_number: safeString(ktp_number) || safeString(details?.ktp_number) || null,
          ktp_address: safeString(ktp_address) || safeString(details?.ktp_address) || null,
          religion: safeString(religion) || safeString(details?.religion) || null,
          ethnicity: safeString(ethnicity) || safeString(details?.ethnicity) || null,
          education: safeString(education) || safeString(details?.education) || null,
          ...entityData,
        });
        entityError = error;
      } else if (normalizedEntity === "driver" || normalizedEntity === "driver_perusahaan" || normalizedEntity === "driver_mitra") {
        const driverType = normalizedEntity === "driver_perusahaan" ? "perusahaan" : 
                          normalizedEntity === "driver_mitra" ? "mitra" : "general";
        
        // Get all driver-specific fields from details and file_urls (safe extraction)
        const drvKtpDocUrl = safeString(details?.ktp_document_url) || safeString(file_urls?.ktp_document_url) || null;
        const drvSelfieUrl = safeString(details?.selfie_url) || safeString(file_urls?.selfie_url) || null;
        const drvSimUrl = safeString(details?.sim_url) || safeString(file_urls?.sim_url) || null;
        const drvSkckUrl = safeString(details?.skck_url) || safeString(file_urls?.skck_url) || null;
        const drvFamilyCardUrl = safeString(details?.family_card_url) || safeString(file_urls?.family_card_url) || null;
        const drvStnkUrl = safeString(details?.upload_stnk_url) || safeString(file_urls?.upload_stnk_url) || null;
        const drvVehiclePhoto = safeString(details?.vehicle_photo) || safeString(file_urls?.upload_vehicle_photo_url) || null;
        
        const { error } = await supabase.from("drivers").insert({
          user_id: userId,
          full_name: derivedFullName,
          email,
          phone,
          driver_type: driverType,
          // KTP and personal info
          ktp_number: safeString(ktp_number) || safeString(details?.ktp_number) || null,
          ktp_address: safeString(ktp_address) || safeString(details?.ktp_address) || null,
          religion: safeString(religion) || safeString(details?.religion) || null,
          ethnicity: safeString(ethnicity) || safeString(details?.ethnicity) || null,
          // License info
          license_number: safeString(license_number) || safeString(details?.license_number) || null,
          license_expiry: safeString(license_expiry_date) || safeString(details?.license_expiry) || safeString(details?.license_expiry_date) || null,
          // Vehicle info (for driver_mitra)
          vehicle_brand: safeString(details?.vehicle_brand) || null,
          vehicle_model: safeString(details?.vehicle_model) || null,
          plate_number: safeString(details?.plate_number) || null,
          vehicle_year: safeString(details?.vehicle_year) || null,
          vehicle_color: safeString(details?.vehicle_color) || null,
          // Document URLs
          ktp_document_url: drvKtpDocUrl,
          selfie_url: drvSelfieUrl,
          sim_url: drvSimUrl,
          skck_url: drvSkckUrl,
          family_card_url: drvFamilyCardUrl,
          upload_stnk_url: drvStnkUrl,
          vehicle_photo: drvVehiclePhoto,
          ...entityData,
        });
        entityError = error;
      }
      
      if (entityError) {
        console.error("Entity insert error:", entityError);
        // Don't rollback - entity table is optional
      }
    } catch (err) {
      console.error("Entity creation error:", err);
      // Continue without entity record
    }

    return new Response(
      JSON.stringify({
        success: true,
        user_id: userId,
        message: "User created successfully. Please check your email for verification.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        details: error instanceof Error ? error.stack : String(error)
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

import { corsHeaders } from "@shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface FormField {
  name: string;
  label: string;
  type: "text" | "number" | "date" | "boolean";
  required: boolean;
}

interface ExtractedField {
  name: string;
  label?: string;
  type: string;
  required?: boolean;
}

interface AutoFieldRequest {
  // New format
  table?: string;
  fields?: Array<{ name: string; type: string }>;
  // Legacy format
  extracted_fields?: ExtractedField[];
  structured_data?: Record<string, any>;
  document_type?: string;
  table_name?: string;
}

function detectFieldType(value: any): string {
  // Detect type from actual value
  if (value === null || value === undefined || value === "") {
    return "text"; // Default for empty values
  }
  
  if (typeof value === "number") {
    return "number";
  }
  
  if (typeof value === "boolean") {
    return "boolean";
  }
  
  if (typeof value === "string") {
    // Check if it's a date
    const datePatterns = [
      /^\d{4}-\d{2}-\d{2}$/, // yyyy-MM-dd
      /^\d{2}-\d{2}-\d{4}$/, // dd-MM-yyyy
      /^\d{4}\/\d{2}\/\d{2}$/, // yyyy/MM/dd
      /^\d{2}\/\d{2}\/\d{4}$/, // dd/MM/yyyy
    ];
    
    for (const pattern of datePatterns) {
      if (pattern.test(value)) {
        return "date";
      }
    }
    
    // Check if it's a parseable date
    if (!isNaN(Date.parse(value)) && value.length > 8) {
      return "date";
    }
    
    // Check if it's a number string
    if (/^\d+(\.\d+)?$/.test(value)) {
      return "number";
    }
  }
  
  return "text";
}

function mapFieldTypeToSQLType(type: string): string {
  const typeMap: Record<string, string> = {
    text: "TEXT",
    string: "TEXT",
    number: "NUMERIC",
    numeric: "NUMERIC",
    date: "DATE",
    timestamp: "TIMESTAMP",
    boolean: "BOOLEAN",
    bool: "BOOLEAN",
    jsonb: "JSONB",
    json: "JSONB",
    array: "JSONB",
  };
  return typeMap[type.toLowerCase()] || "TEXT";
}

function normalizeFieldName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

async function getExistingColumns(
  projectRef: string,
  tableName: string,
  picaSecret: string,
  picaConnectionKey: string
): Promise<Record<string, string>> {
  const query = `
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = '${tableName}' AND table_schema = 'public';
  `;

  const { data, error } = await supabase.rpc('execute_sql', { query_text: query });

  if (error) {
    console.error(`Failed to fetch columns: ${error.message}`);
    return {};
  }

  const columns: Record<string, string> = {};

  if (data && Array.isArray(data)) {
    for (const row of data) {
      columns[row.column_name] = row.data_type;
    }
  }

  return columns;
}

async function addMissingColumns(
  tableName: string,
  fields: FormField[],
  existingColumns: Record<string, string>
): Promise<string[]> {
  const addedColumns: string[] = [];

  for (const field of fields) {
    const normalizedName = normalizeFieldName(field.name);

    if (!existingColumns[normalizedName]) {
      const sqlType = mapFieldTypeToSQLType(field.type);
      const alterQuery = `ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS ${normalizedName} ${sqlType};`;

      console.log(`Adding column: ${normalizedName} (${sqlType})`);

      const { error } = await supabase.rpc('execute_sql', { query_text: alterQuery });

      if (error) {
        console.error(
          `Failed to add column ${normalizedName}: ${error.message}`
        );
      } else {
        addedColumns.push(normalizedName);
      }
    }
  }

  return addedColumns;
}

function createFormFields(
  extractedFields: ExtractedField[]
): FormField[] {
  return extractedFields.map((field) => ({
    name: normalizeFieldName(field.name),
    label: field.label || field.name,
    type: (field.type.toLowerCase() as any) || "text",
    required: field.required ?? false,
  }));
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  try {
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (jsonError) {
      console.error("JSON parsing error:", jsonError);
      return new Response(
        JSON.stringify({
          error: "Invalid JSON in request body",
          success: false,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }
    
    // Support both new format (table, fields) and legacy format (structured_data, document_type)
    const {
      table,
      fields,
      extracted_fields,
      structured_data,
      document_type,
      table_name,
    } = requestBody as AutoFieldRequest;

    // Determine target table
    const targetTable = table || table_name || "users";

    // Convert to unified fields format
    let fieldsToProcess: ExtractedField[] = [];
    
    // New format: { table: "users", fields: [{ name, type }] }
    if (fields && Array.isArray(fields) && fields.length > 0) {
      fieldsToProcess = fields.map((f) => ({
        name: f.name,
        label: f.name.split("_").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
        type: f.type || "text",
        required: false,
      }));
    }
    // Legacy format: extracted_fields array
    else if (extracted_fields && Array.isArray(extracted_fields)) {
      fieldsToProcess = extracted_fields;
    } 
    // Legacy format: structured_data object
    else if (structured_data && typeof structured_data === "object") {
      // Convert structured_data object to extracted_fields array
      // KK-specific field type mappings
      const fieldTypeMap: Record<string, string> = {
        // KK Header Fields
        nomor_kk: "text",
        nama_kepala_keluarga: "text",
        alamat: "text",
        rt_rw: "text",
        kelurahan_desa: "text",
        kecamatan: "text",
        kabupaten_kota: "text",
        provinsi: "text",
        kode_pos: "text",
        tanggal_dikeluarkan: "date",
        anggota_keluarga: "jsonb", // JSONB for family members array
        debug_notes: "jsonb", // JSONB for debug notes
        
        // KTP Fields
        nik: "text",
        nama: "text",
        nama_lengkap: "text",
        tempat_lahir: "text",
        tanggal_lahir: "date",
        jenis_kelamin: "text",
        agama: "text",
        status_perkawinan: "text",
        pekerjaan: "text",
        kewarganegaraan: "text",
        berlaku_hingga: "text",
        golongan_darah: "text",
        kota_pembuatan: "text",
        tanggal_pembuatan: "date",
        kepala_keluarga: "text",
        
        // NPWP Fields
        npwp: "text",
        nomor_npwp: "text",
        tanggal_daftar: "date",
        tanggal_terdaftar: "date",
        kpp: "text",
        status_wp: "text",
        
        // SIM Fields
        nomor_sim: "text",
        berlaku: "date",
        kategori_sim: "text",
        golongan_sim: "text",
        tempat_pembuatan: "text",
        tinggi_badan: "text",
        
        // STNK Fields
        nomor_polisi: "text",
        nama_pemilik: "text",
        nomor_rangka: "text",
        nomor_mesin: "text",
        merk: "text",
        tipe: "text",
        jenis: "text",
        model: "text",
        tahun_pembuatan: "text",
        warna: "text",
        bahan_bakar: "text",
        isi_silinder: "text",
        masa_berlaku: "date",
        berlaku_pajak: "date",
        berlaku_stnk: "date",
        
        // Ijazah Fields (Complete)
        nomor_ijazah: "text",
        tempat_tanggal_lahir: "text",
        tahun_lulus: "text",
        nama_sekolah: "text",
        kepala_sekolah: "text",
        jurusan: "text",
        tanggal_terbit: "date",
        jenjang: "text",
        tanggal_lulus: "date",
        nomor_peserta_ujian: "text",
        nisn: "text",
        program_studi: "text",
        fakultas: "text",
        gelar: "text",
        ipk: "text",
        akreditasi: "text",
        nomor_seri_ijazah: "text",
        
        // PAJAK KENDARAAN Fields
        pkb_pokok: "number",
        pokok_pkb: "number",
        swdkllj: "number",
        denda_pkb: "number",
        denda_swdkllj: "number",
        total_bayar: "number",
        tanggal_bayar: "date",
        
        // AWB Fields
        awb_number: "text",
        mawb_number: "text",
        hawb_number: "text",
        shipper_name: "text",
        shipper_address: "text",
        consignee_name: "text",
        consignee_address: "text",
        notify_party: "text",
        origin: "text",
        destination: "text",
        origin_airport: "text",
        destination_airport: "text",
        flight_number: "text",
        flight_date: "date",
        pieces: "number",
        weight: "number",
        gross_weight: "number",
        chargeable_weight: "number",
        description: "text",
        goods_description: "text",
        declared_value: "number",
        freight_charges: "number",
        additional_notes: "text",
        
        // INVOICE Fields
        nomor_invoice: "text",
        tanggal_invoice: "date",
        nama_penjual: "text",
        alamat_penjual: "text",
        npwp_penjual: "text",
        nama_pembeli: "text",
        alamat_pembeli: "text",
        npwp_pembeli: "text",
        items: "jsonb",
        subtotal: "number",
        ppn: "number",
        total: "number",
        tanggal_jatuh_tempo: "date",
        
        // CV Fields
        email: "text",
        telepon: "text",
        pendidikan: "jsonb",
        pengalaman_kerja: "jsonb",
        keahlian: "jsonb",
        bahasa: "jsonb",
        sertifikasi: "jsonb",
        
        // BPJS Fields
        nomor_bpjs: "text",
        kelas: "text",
        faskes_tingkat_1: "text",
        tanggal_berlaku: "date",
        
        // AKTA LAHIR Fields
        nomor_akta: "text",
        nama_ayah: "text",
        nama_ibu: "text",
        tempat_terbit: "text",
        
        // SURAT KETERANGAN Fields
        nomor_surat: "text",
        perihal: "text",
        instansi: "text",
      };

      // Skip keys - technical fields that should not be created as columns
      const skipKeys = [
        "jenis_dokumen", "raw_text", "clean_text", "ocr_engine", 
        "id", "created_at", "updated_at", "user_id", "entity_id"
      ];

      // Process ALL keys from structured_data, even if value is null
      for (const [key, value] of Object.entries(structured_data)) {
        // Skip technical keys
        if (skipKeys.includes(key)) continue;
        
        // Handle anggota_keluarga as JSONB (array of family members)
        if (key === "anggota_keluarga" && Array.isArray(value)) {
          fieldsToProcess.push({
            name: key,
            label: "Anggota Keluarga",
            type: "jsonb",
            required: false,
          });
          console.log(`Field detected: ${key} (type: jsonb, ${value.length} family members)`);
          continue;
        }
        
        // Handle debug_notes as JSONB
        if (key === "debug_notes" && typeof value === "object") {
          fieldsToProcess.push({
            name: key,
            label: "Debug Notes",
            type: "jsonb",
            required: false,
          });
          console.log(`Field detected: ${key} (type: jsonb)`);
          continue;
        }
        
        // Skip other large arrays (more than 10 items)
        if (Array.isArray(value)) {
          if (value.length > 10) {
            console.log(`Skipping large array field: ${key} (${value.length} items)`);
            continue;
          }
          // Skip arrays with complex objects (except anggota_keluarga which is handled above)
          if (value.length > 0 && typeof value[0] === "object") {
            // Store as JSONB instead of skipping
            fieldsToProcess.push({
              name: key,
              label: key.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
              type: "jsonb",
              required: false,
            });
            console.log(`Field detected: ${key} (type: jsonb, complex array)`);
            continue;
          }
        }
        
        // Skip nested objects (except debug_notes which is handled above)
        if (typeof value === "object" && value !== null && !Array.isArray(value)) {
          // Store as JSONB instead of skipping
          fieldsToProcess.push({
            name: key,
            label: key.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
            type: "jsonb",
            required: false,
          });
          console.log(`Field detected: ${key} (type: jsonb, nested object)`);
          continue;
        }
        
        // Auto-detect field type from value
        const detectedType = detectFieldType(value);
        const fieldType = fieldTypeMap[key] || detectedType;
        
        fieldsToProcess.push({
          name: key,
          label: key.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
          type: fieldType,
          required: false,
        });
        
        console.log(`Field detected: ${key} (type: ${fieldType}, value: ${value})`);
      }
    }

    if (fieldsToProcess.length === 0) {
      // Return success with empty fields instead of error for backward compatibility
      return new Response(
        JSON.stringify({
          success: true,
          dynamic_fields: {},
          auto_fields_created: [],
          supabase_columns_created: [],
          supabase_columns_updated: [],
          createdColumns: [],
          message: "No fields to process",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    console.log(`Processing ${fieldsToProcess.length} extracted fields for table: ${targetTable}`);

    const formFields = createFormFields(fieldsToProcess);

    // Use Supabase Service Role Key for direct database operations
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    let addedColumns: string[] = [];

    // Use direct Supabase connection
    try {
      for (const field of formFields) {
        const normalizedName = normalizeFieldName(field.name);
        const sqlType = mapFieldTypeToSQLType(field.type);
        
        console.log(`Adding column: ${normalizedName} (${sqlType}) to ${targetTable}`);
        
        const { error } = await supabase.rpc("execute_sql", {
          query_text: `ALTER TABLE ${targetTable} ADD COLUMN IF NOT EXISTS ${normalizedName} ${sqlType};`
        });
        
        if (error) {
          console.warn(`Column ${normalizedName} may already exist or error:`, error.message);
        } else {
          addedColumns.push(normalizedName);
        }
      }
    } catch (dbError) {
      console.warn("Direct Supabase schema expansion failed:", dbError);
    }

    const normalizedFormFields = formFields.map((field) => ({
      ...field,
      name: normalizeFieldName(field.name),
    }));

    // Create dynamic_fields - key-value pairs with snake_case names
    const dynamicFields: Record<string, any> = {};
    if (structured_data) {
      for (const field of formFields) {
        const normalizedName = normalizeFieldName(field.name);
        const value = structured_data[field.name] || structured_data[normalizedName];
        dynamicFields[normalizedName] = value ?? null;
      }
    }

    // Create auto_fields_created format for backward compatibility
    const autoFieldsCreated = formFields.map((field) => ({
      name: normalizeFieldName(field.name),
      label: field.label,
      type: field.type === "date" ? "date" : field.type === "number" ? "number" : "text",
      required: field.required,
      value: structured_data ? (structured_data[field.name] ?? null) : null,
    }));

    console.log(`✅ Processed ${formFields.length} fields, created ${addedColumns.length} new columns`);
    console.log(`Dynamic fields:`, Object.keys(dynamicFields));

    return new Response(
      JSON.stringify({
        success: true,
        dynamic_fields: dynamicFields, // Key-value pairs with snake_case names
        auto_fields_created: autoFieldsCreated, // Array format for UI rendering
        supabase_columns_created: addedColumns,
        supabase_columns_updated: addedColumns,
        createdColumns: addedColumns,
        form_fields: normalizedFormFields,
        added_columns: addedColumns,
        total_fields: formFields.length,
        new_columns_count: addedColumns.length,
        message: `Processed ${formFields.length} fields, created ${addedColumns.length} new columns`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Auto field creation error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        success: false,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

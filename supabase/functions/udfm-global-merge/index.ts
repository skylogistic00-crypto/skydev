import { corsHeaders } from "@shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type SourceType = "user" | "ocr";

interface FieldMeta {
  source: SourceType;
  document_type: string;
  confidence: number;
  last_updated_at: string;
}

interface MetaMap {
  [fieldName: string]: FieldMeta;
}

interface DataMap {
  [fieldName: string]: any;
}

// Canonical mapping dictionary: normalized key -> canonical field
const canonicalMap: Record<string, string> = {
  // KTP Fields
  "nik": "ktpNumber",
  "no_ktp": "ktpNumber",
  "nomor_ktp": "ktpNumber",
  "nama": "fullName",
  "nama_lengkap": "fullName",
  "nama_peserta": "fullName",
  "tempat_lahir": "placeOfBirth",
  "birth_place": "placeOfBirth",
  "tanggal_lahir": "dateOfBirth",
  "tgl_lahir": "dateOfBirth",
  "dob": "dateOfBirth",
  "alamat": "address",
  "alamat_ktp": "address",
  "alamat_domisili": "address",
  "jenis_kelamin": "gender",
  "agama": "religion",
  "status_perkawinan": "maritalStatus",
  "pekerjaan": "occupation",
  "kewarganegaraan": "nationality",
  "berlaku_hingga": "validUntil",
  "golongan_darah": "bloodType",
  
  // KK Fields
  "nomor_kk": "familyCardNumber",
  "no_kk": "familyCardNumber",
  "nama_kepala_keluarga": "familyHeadName",
  "rt_rw": "rtRw",
  "kelurahan_desa": "kelurahanDesa",
  "desa_kelurahan": "kelurahanDesa",
  "kecamatan": "district",
  "kabupaten_kota": "city",
  "provinsi": "province",
  "kode_pos": "postalCode",
  "tanggal_dikeluarkan": "issueDate",
  "anggota_keluarga": "kkMembers",
  
  // IJAZAH Fields
  "nomor_ijazah": "ijazahNumber",
  "no_ijazah": "ijazahNumber",
  "nama_sekolah": "schoolName",
  "tingkat_pendidikan": "educationLevel",
  "jenjang": "educationLevel",
  "jurusan": "major",
  "program_studi": "major",
  "tahun_lulus": "graduationYear",
  "year_graduated": "graduationYear",
  "tanggal_lulus": "graduationDate",
  "kota_penerbit": "issueCity",
  "tanggal_penerbitan": "issueDate",
  "kepala_sekolah": "principalName",
  "nisn": "nisn",
  "nomor_peserta_ujian": "examParticipantNumber",
  "gelar": "degree",
  "ipk": "gpa",
  "akreditasi": "accreditation",
  "nomor_seri_ijazah": "certificateSerialNumber",
  "fakultas": "faculty",
  
  // NPWP Fields
  "nomor_npwp": "npwpNumber",
  "no_npwp": "npwpNumber",
  "tanggal_terdaftar": "registrationDate",
  "tanggal_daftar": "registrationDate",
  "kpp": "taxOffice",
  "status_wp": "taxpayerStatus",
  
  // SIM Fields
  "nomor_sim": "simNumber",
  "no_sim": "simNumber",
  "golongan_sim": "simClass",
  "tinggi_badan": "height",
  
  // STNK Fields
  "nomor_polisi": "plateNumber",
  "no_polisi": "plateNumber",
  "plate_number": "plateNumber",
  "nama_pemilik": "ownerName",
  "merk_kendaraan": "vehicleBrand",
  "merk": "vehicleBrand",
  "tipe": "vehicleType",
  "jenis": "vehicleCategory",
  "model": "vehicleModel",
  "tahun_pembuatan": "manufacturingYear",
  "warna": "color",
  "nomor_rangka": "chassisNumber",
  "nomor_mesin": "engineNumber",
  "bahan_bakar": "fuelType",
  "isi_silinder": "engineCapacity",
  "masa_berlaku": "validUntil",
  
  // PAJAK KENDARAAN Fields
  "pkb_pokok": "mainTax",
  "jumlah_pkb": "mainTax",
  "swdkllj": "insuranceFee",
  "jumlah_swdkllj": "insuranceFee",
  "denda_pkb": "mainTaxPenalty",
  "denda_swdkllj": "insurancePenalty",
  "total_bayar": "totalPayment",
  "tanggal_bayar": "paymentDate",
  "jatuh_tempo_pajak": "taxDueDate",
  
  // AWB Fields
  "awb_number": "awbNumber",
  "no_awb": "awbNumber",
  "shipper_name": "shipperName",
  "shipper_address": "shipperAddress",
  "consignee_name": "consigneeName",
  "consignee_address": "consigneeAddress",
  "origin": "origin",
  "destination": "destination",
  "gross_weight": "grossWeight",
  "chargeable_weight": "chargeableWeight",
  "weight": "weight",
  "pieces": "pieces",
  "goods_description": "goodsDescription",
  "description": "goodsDescription",
  "declared_value": "declaredValue",
  "flight_number": "flightNumber",
  "flight_date": "flightDate",
  
  // INVOICE Fields
  "nomor_invoice": "invoiceNumber",
  "no_invoice": "invoiceNumber",
  "tanggal_invoice": "invoiceDate",
  "nama_penjual": "sellerName",
  "alamat_penjual": "sellerAddress",
  "npwp_penjual": "sellerNpwp",
  "nama_pembeli": "buyerName",
  "alamat_pembeli": "buyerAddress",
  "npwp_pembeli": "buyerNpwp",
  "items": "invoiceItems",
  "subtotal": "subtotal",
  "ppn": "vat",
  "total": "total",
  "tanggal_jatuh_tempo": "dueDate",
  
  // CV Fields
  "email": "email",
  "telepon": "phone",
  "no_telepon": "phone",
  "no_hp": "phone",
  "pendidikan": "educationHistory",
  "pengalaman_kerja": "workExperience",
  "keahlian": "skills",
  "bahasa": "languages",
  "sertifikasi": "certifications",
  
  // BPJS Fields
  "nomor_bpjs": "bpjsNumber",
  "no_bpjs": "bpjsNumber",
  "kelas": "bpjsClass",
  "faskes_tingkat_1": "primaryHealthcare",
  "tanggal_berlaku": "validFrom",
  
  // AKTA LAHIR Fields
  "nomor_akta": "birthCertificateNumber",
  "no_akta": "birthCertificateNumber",
  "nama_ayah": "fatherName",
  "nama_ibu": "motherName",
  "tempat_terbit": "issuePlace",
  
  // SURAT KETERANGAN Fields
  "nomor_surat": "letterNumber",
  "no_surat": "letterNumber",
  "perihal": "subject",
  "instansi": "institution",
};

// Fields that should be stored as JSONB
const jsonbFields = new Set([
  "kkMembers",
  "anggota_keluarga",
  "educationHistory",
  "workExperience",
  "skills",
  "languages",
  "certifications",
  "invoiceItems",
  "rawOcr",
  "details",
]);

// Utility: Convert string to snake_case
function toSnakeCase(str: string): string {
  return str
    .replace(/\.?([A-Z]+)/g, (x, y) => "_" + y.toLowerCase())
    .replace(/^_/, "")
    .replace(/[\s\-]+/g, "_")
    .toLowerCase();
}

/**
 * Smart merge function with metadata protection
 */
function smartMergeWithMeta(
  oldData: DataMap,
  oldMeta: MetaMap,
  newData: DataMap,
  newMeta: MetaMap,
  documentType: string
): { mergedData: DataMap; mergedMeta: MetaMap; newFields: string[] } {
  const mergedData: DataMap = { ...oldData };
  const mergedMeta: MetaMap = { ...oldMeta };
  const newFields: string[] = [];

  console.log(`Smart Merge: Processing ${Object.keys(newData).length} fields for ${documentType}`);

  for (const field in newData) {
    const newValue = newData[field];
    const newFieldMeta = newMeta[field];

    // Rule 2: Ignore new values that are empty, null, or empty string
    if (newValue === null || newValue === "" || newValue === undefined) {
      console.log(`⊗ SKIP [${field}]: Empty/null value`);
      continue;
    }

    const oldValue = oldData[field];
    const oldFieldMeta = oldMeta[field];

    // Rule 1: If old source is "user", never overwrite
    if (oldFieldMeta?.source === "user") {
      console.log(`⊗ PROTECTED [${field}]: User-edited field, preserving value`);
      continue;
    }

    // Rule 3: If no old value, accept new value
    if (oldValue === undefined || oldValue === null || oldValue === "") {
      mergedData[field] = newValue;
      mergedMeta[field] = {
        source: newFieldMeta?.source || "ocr",
        document_type: documentType,
        confidence: newFieldMeta?.confidence ?? 1,
        last_updated_at: new Date().toISOString(),
      };
      
      // Track new fields for auto-create
      if (!(field in oldData)) {
        newFields.push(field);
      }
      
      console.log(`✔ NEW [${field}]: Added with confidence ${newFieldMeta?.confidence ?? 1}`);
      continue;
    }

    // Rule 4: If old source is OCR, overwrite only if new confidence > old confidence
    if (oldFieldMeta?.source === "ocr") {
      const oldConfidence = oldFieldMeta.confidence ?? 0;
      const newConfidence = newFieldMeta?.confidence ?? 0;

      if (newConfidence > oldConfidence) {
        mergedData[field] = newValue;
        mergedMeta[field] = {
          source: newFieldMeta?.source || "ocr",
          document_type: documentType,
          confidence: newConfidence,
          last_updated_at: new Date().toISOString(),
        };
        console.log(`✔ UPGRADE [${field}]: Confidence ${oldConfidence} → ${newConfidence}`);
      } else {
        console.log(`⊗ KEEP [${field}]: Old confidence ${oldConfidence} >= new ${newConfidence}`);
      }
    }
  }

  console.log(`Smart Merge Complete: ${Object.keys(mergedData).length} total fields, ${newFields.length} new fields`);

  return { mergedData, mergedMeta, newFields };
}

/**
 * Normalize and map structured_data to canonical fields
 */
function normalizeAndMapToCanonical(
  structuredData: DataMap,
  confidencePerField: Record<string, number> = {}
): { canonicalData: DataMap; canonicalMeta: MetaMap; dynamicFields: DataMap } {
  const canonicalData: DataMap = {};
  const canonicalMeta: MetaMap = {};
  const dynamicFields: DataMap = {};

  for (const rawKey in structuredData) {
    const value = structuredData[rawKey];
    
    // Skip null/empty values
    if (value === null || value === undefined || value === "") {
      continue;
    }

    const normalizedKey = toSnakeCase(rawKey);
    const canonicalField = canonicalMap[normalizedKey] || canonicalMap[rawKey];

    if (canonicalField) {
      canonicalData[canonicalField] = value;
      canonicalMeta[canonicalField] = {
        source: "ocr",
        document_type: "",
        confidence: confidencePerField[rawKey] ?? confidencePerField[normalizedKey] ?? 0.8,
        last_updated_at: new Date().toISOString(),
      };
      console.log(`✔ Mapped: ${rawKey} → ${canonicalField}`);
    } else {
      // Dynamic field - keep with normalized key
      dynamicFields[normalizedKey] = value;
      console.log(`◆ Dynamic field: ${normalizedKey}`);
    }
  }

  return { canonicalData, canonicalMeta, dynamicFields };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  try {
    const {
      structured_data,
      confidence_per_field,
      document_type,
      signUpData,
      signUpMeta,
      autoCreateColumns = true,
    } = await req.json();

    if (!structured_data || !document_type) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "structured_data and document_type are required",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    console.log("UDFM Global Merge: Starting process");
    console.log(`Document Type: ${document_type}`);
    console.log(`Input Fields: ${Object.keys(structured_data).length}`);

    // Step 1: Normalize and map to canonical fields
    const { canonicalData, canonicalMeta, dynamicFields } = normalizeAndMapToCanonical(
      structured_data,
      confidence_per_field || {}
    );

    // Update document_type in meta
    for (const field in canonicalMeta) {
      canonicalMeta[field].document_type = document_type;
    }

    console.log(`Canonical Fields: ${Object.keys(canonicalData).length}`);
    console.log(`Dynamic Fields: ${Object.keys(dynamicFields).length}`);

    // Step 2: Smart merge with existing signUpData
    const { mergedData, mergedMeta, newFields } = smartMergeWithMeta(
      signUpData || {},
      signUpMeta || {},
      canonicalData,
      canonicalMeta,
      document_type
    );

    // Step 3: Store full OCR data in namespace
    if (!mergedData.details) {
      mergedData.details = {};
    }
    mergedData.details[document_type] = structured_data;

    // Step 4: Add dynamic fields to merged data
    for (const field in dynamicFields) {
      if (!(field in mergedData)) {
        mergedData[field] = dynamicFields[field];
        mergedMeta[field] = {
          source: "ocr",
          document_type: document_type,
          confidence: 0.7,
          last_updated_at: new Date().toISOString(),
        };
        newFields.push(field);
      }
    }

    // Step 5: Auto-create columns if enabled
    let columnsCreated: string[] = [];
    if (autoCreateColumns && newFields.length > 0) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Determine column types
        const fieldsToCreate: { name: string; type: string }[] = [];
        
        for (const field of newFields) {
          const value = mergedData[field];
          let columnType = "TEXT";
          
          if (jsonbFields.has(field) || Array.isArray(value) || (typeof value === "object" && value !== null)) {
            columnType = "JSONB";
          } else if (typeof value === "number") {
            columnType = Number.isInteger(value) ? "INTEGER" : "NUMERIC";
          } else if (typeof value === "boolean") {
            columnType = "BOOLEAN";
          }
          
          fieldsToCreate.push({ name: field, type: columnType });
        }

        console.log(`Auto-creating ${fieldsToCreate.length} columns:`, fieldsToCreate);

        // Create columns
        for (const { name, type } of fieldsToCreate) {
          const columnName = toSnakeCase(name);
          const sql = `ALTER TABLE users ADD COLUMN IF NOT EXISTS "${columnName}" ${type}`;
          
          const { error } = await supabase.rpc("execute_sql", { sql_query: sql });
          
          if (error) {
            console.error(`Failed to create column ${columnName}:`, error);
          } else {
            columnsCreated.push(columnName);
            console.log(`✔ Created column: ${columnName} (${type})`);
          }
        }
      } catch (autoCreateError) {
        console.error("Auto-create columns error:", autoCreateError);
      }
    }

    const stats = {
      totalInputFields: Object.keys(structured_data).length,
      canonicalFieldsMapped: Object.keys(canonicalData).length,
      dynamicFieldsPreserved: Object.keys(dynamicFields).length,
      totalMergedFields: Object.keys(mergedData).length,
      newFieldsDetected: newFields.length,
      columnsCreated: columnsCreated.length,
      protectedFields: Object.keys(signUpMeta || {}).filter(
        (k) => signUpMeta[k]?.source === "user"
      ).length,
    };

    console.log("UDFM Global Merge Complete:", stats);

    return new Response(
      JSON.stringify({
        success: true,
        signUpData: mergedData,
        signUpMeta: mergedMeta,
        dynamicFields,
        newFields,
        columnsCreated,
        stats,
        documentType: document_type,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("UDFM Global Merge error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

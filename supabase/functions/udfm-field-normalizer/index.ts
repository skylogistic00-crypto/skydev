import { corsHeaders } from "@shared/cors.ts";

// Utility: Convert string to snake_case
function toSnakeCase(str: string): string {
  return str
    .replace(/\.?([A-Z]+)/g, (x, y) => "_" + y.toLowerCase())
    .replace(/^_/, "")
    .replace(/[\s\-]+/g, "_")
    .toLowerCase();
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
  
  // IJAZAH Fields
  "nomor_ijazah": "ijazahNumber",
  "no_ijazah": "ijazahNumber",
  "nama_sekolah": "schoolName",
  "tingkat_pendidikan": "educationLevel",
  "jenjang": "educationLevel",
  "jurusan": "major",
  "program_studi": "major",
  "major": "major",
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
  "items": "items",
  "subtotal": "subtotal",
  "ppn": "vat",
  "total": "total",
  "tanggal_jatuh_tempo": "dueDate",
  
  // CV Fields
  "email": "email",
  "telepon": "phone",
  "pendidikan": "education",
  "pengalaman_kerja": "workExperience",
  "keahlian": "skills",
  "bahasa": "languages",
  "sertifikasi": "certifications",
  
  // BPJS Fields
  "nomor_bpjs": "bpjsNumber",
  "no_bpjs": "bpjsNumber",
  "kelas": "class",
  "faskes_tingkat_1": "primaryHealthcare",
  "tanggal_berlaku": "validFrom",
  
  // AKTA LAHIR Fields
  "nomor_akta": "certificateNumber",
  "no_akta": "certificateNumber",
  "nama_ayah": "fatherName",
  "nama_ibu": "motherName",
  "tempat_terbit": "issuePlace",
  
  // SURAT KETERANGAN Fields
  "nomor_surat": "letterNumber",
  "no_surat": "letterNumber",
  "perihal": "subject",
  "instansi": "institution",
};

// Recursive function to normalize and map keys
function normalizeAndMap(
  data: any,
  existingData: any = {}
): { signUpData: Record<string, any>; dynamicFields: Record<string, any> } {
  const signUpData: Record<string, any> = {};
  const dynamicFields: Record<string, any> = {};

  if (Array.isArray(data)) {
    // Process array elements recursively
    return {
      signUpData: data.map((item) => {
        if (typeof item === "object" && item !== null) {
          return normalizeAndMap(item, {}).signUpData;
        }
        return item;
      }),
      dynamicFields: {},
    };
  } else if (typeof data === "object" && data !== null) {
    for (const rawKey in data) {
      const value = data[rawKey];
      const normalizedKey = toSnakeCase(rawKey);

      // Skip null or undefined values
      if (value === null || value === undefined) {
        continue;
      }

      // Recursively process nested objects or arrays
      let processedValue;
      if (Array.isArray(value)) {
        processedValue = value.map((v) => {
          if (typeof v === "object" && v !== null) {
            return normalizeAndMap(v, {}).signUpData;
          }
          return v;
        });
      } else if (typeof value === "object" && value !== null) {
        processedValue = normalizeAndMap(value, {}).signUpData;
      } else {
        processedValue = value;
      }

      // Determine canonical field
      const canonicalField = canonicalMap[normalizedKey];

      if (canonicalField) {
        // Merge with existingData if present, avoid overwriting high-confidence data
        if (
          existingData[canonicalField] === undefined ||
          existingData[canonicalField] === null ||
          existingData[canonicalField] === ""
        ) {
          signUpData[canonicalField] = processedValue;
          console.log(
            `✔ Mapped: ${normalizedKey} → ${canonicalField} = ${JSON.stringify(processedValue).substring(0, 50)}`
          );
        } else {
          // Preserve existing data if present
          console.log(
            `⊗ Preserved existing: ${canonicalField} (from existingData)`
          );
          signUpData[canonicalField] = existingData[canonicalField];
        }
      } else {
        // Dynamic field: preserve original normalized key and value
        dynamicFields[normalizedKey] = processedValue;
        console.log(
          `◆ Dynamic field: ${normalizedKey} = ${JSON.stringify(processedValue).substring(0, 50)}`
        );
      }
    }
  }

  return { signUpData, dynamicFields };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  try {
    const { structured_data, existingData } = await req.json();

    if (!structured_data) {
      return new Response(
        JSON.stringify({ success: false, error: "structured_data is required" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    console.log("UDFM Field Normalizer: Processing structured data...");
    console.log(
      "Input fields:",
      Object.keys(structured_data).length,
      "keys"
    );

    const { signUpData, dynamicFields } = normalizeAndMap(
      structured_data,
      existingData || {}
    );

    console.log(
      "UDFM Field Normalizer: Normalization complete"
    );
    console.log("Canonical fields mapped:", Object.keys(signUpData).length);
    console.log("Dynamic fields preserved:", Object.keys(dynamicFields).length);

    return new Response(
      JSON.stringify({
        success: true,
        signUpData,
        dynamicFields,
        stats: {
          totalInputFields: Object.keys(structured_data).length,
          canonicalFieldsMapped: Object.keys(signUpData).length,
          dynamicFieldsPreserved: Object.keys(dynamicFields).length,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("UDFM Field Normalizer error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

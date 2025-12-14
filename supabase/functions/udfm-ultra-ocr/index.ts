import { corsHeaders } from "@shared/cors.ts";

const PICA_SECRET_KEY = Deno.env.get("PICA_SECRET_KEY");
const PICA_OPENAI_CONNECTION_KEY = Deno.env.get("PICA_OPENAI_CONNECTION_KEY");

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  try {
    const { ocr_text, document_type_hint } = await req.json();

    if (!ocr_text) {
      return new Response(
        JSON.stringify({ success: false, error: "ocr_text is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    if (!PICA_SECRET_KEY || !PICA_OPENAI_CONNECTION_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: "PICA credentials not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    console.log("UDFM ULTRA OCR: Processing document...");
    console.log("Document type hint:", document_type_hint || "none");

    const systemPrompt = `You are an AI assistant specialized in extracting structured data from various Indonesian documents. For each document, return a JSON object with the following structure:
{
  "document_type": "<detected document type>",
  "structured_data": { ...key-value pairs of extracted fields... },
  "fields_detected": ["field1", "field2", ...],
  "confidence_per_field": { "field1": 0.9, "field2": 0.7, ... },
  "debug_notes": "<explanations or uncertainties>"
}

DOCUMENT TYPE DETECTION RULES:
- Contains "KARTU KELUARGA" or "NOMOR KK" → document_type = "KK"
- Contains "NIK" + "Tempat/Tgl Lahir" → document_type = "KTP"
- Contains "IJAZAH", "SEKOLAH MENENGAH", "NISN" → document_type = "IJAZAH"
- Contains "NPWP" → document_type = "NPWP"
- Contains "SURAT TANDA NOMOR KENDARAAN" or "STNK" → document_type = "STNK"
- Contains "PAJAK KENDARAAN BERMOTOR", "PKB", "SAMSAT" → document_type = "PAJAK_KENDARAAN"
- Contains "AIR WAYBILL", "AWB", "Consignee", "Shipper" → document_type = "AWB"
- Contains "INVOICE", "FAKTUR", "BILL TO" → document_type = "INVOICE"
- Contains "CURRICULUM VITAE", "RIWAYAT HIDUP" → document_type = "CV"
- Contains "BPJS", "JAMINAN KESEHATAN" → document_type = "BPJS"
- Contains "AKTA KELAHIRAN" → document_type = "AKTA_LAHIR"
- Contains "SURAT KETERANGAN", "SKCK" → document_type = "SURAT_KETERANGAN"
- If unclear → document_type = "UNKNOWN"

Use the following minimal field templates for each document type:

KTP:
{"nik": null, "nama": null, "tempat_lahir": null, "tanggal_lahir": null, "alamat": null, "rt_rw": null, "kelurahan_desa": null, "kecamatan": null, "kabupaten_kota": null, "provinsi": null, "agama": null, "status_perkawinan": null, "pekerjaan": null, "jenis_kelamin": null, "kewarganegaraan": null, "berlaku_hingga": null, "golongan_darah": null}

KK:
{"nomor_kk": null, "nama_kepala_keluarga": null, "alamat": null, "rt_rw": null, "kelurahan_desa": null, "kecamatan": null, "kabupaten_kota": null, "provinsi": null, "kode_pos": null, "tanggal_dikeluarkan": null, "anggota_keluarga": []}

IJAZAH:
{"nomor_ijazah": null, "nama": null, "tempat_lahir": null, "tanggal_lahir": null, "nama_sekolah": null, "tingkat_pendidikan": null, "jenjang": null, "jurusan": null, "program_studi": null, "fakultas": null, "tahun_lulus": null, "tanggal_lulus": null, "kota_penerbit": null, "tanggal_penerbitan": null, "kepala_sekolah": null, "nisn": null, "nomor_peserta_ujian": null, "gelar": null, "ipk": null, "akreditasi": null, "nomor_seri_ijazah": null}

NPWP:
{"nomor_npwp": null, "nama": null, "alamat": null, "kelurahan": null, "kecamatan": null, "kota": null, "provinsi": null, "tanggal_terdaftar": null, "kpp": null}

SIM:
{"nomor_sim": null, "nama": null, "tempat_lahir": null, "tanggal_lahir": null, "alamat": null, "golongan_sim": null, "berlaku_hingga": null, "tinggi_badan": null, "golongan_darah": null, "pekerjaan": null}

STNK:
{"nomor_polisi": null, "nama_pemilik": null, "alamat": null, "merk_kendaraan": null, "merk": null, "tipe": null, "jenis": null, "model": null, "tahun_pembuatan": null, "warna": null, "nomor_rangka": null, "nomor_mesin": null, "bahan_bakar": null, "isi_silinder": null, "masa_berlaku": null}

PAJAK_KENDARAAN:
{"nomor_polisi": null, "nama_pemilik": null, "alamat": null, "merk": null, "tipe": null, "tahun": null, "warna": null, "nomor_rangka": null, "nomor_mesin": null, "jatuh_tempo_pajak": null, "pkb_pokok": null, "jumlah_pkb": null, "swdkllj": null, "jumlah_swdkllj": null, "total_bayar": null, "tanggal_bayar": null, "masa_berlaku": null}

AWB:
{"awb_number": null, "shipper_name": null, "shipper_address": null, "consignee_name": null, "consignee_address": null, "origin": null, "destination": null, "gross_weight": null, "chargeable_weight": null, "weight": null, "pieces": null, "goods_description": null, "description": null, "declared_value": null, "flight_number": null, "flight_date": null}

INVOICE:
{"nomor_invoice": null, "tanggal_invoice": null, "nama_penjual": null, "alamat_penjual": null, "npwp_penjual": null, "nama_pembeli": null, "alamat_pembeli": null, "npwp_pembeli": null, "items": [], "subtotal": null, "ppn": null, "total": null, "tanggal_jatuh_tempo": null}

CV:
{"nama": null, "tempat_lahir": null, "tanggal_lahir": null, "alamat": null, "email": null, "telepon": null, "pendidikan": [], "pengalaman_kerja": [], "keahlian": [], "bahasa": [], "sertifikasi": []}

BPJS:
{"nomor_bpjs": null, "nama": null, "nik": null, "tanggal_lahir": null, "jenis_kelamin": null, "kelas": null, "faskes_tingkat_1": null, "tanggal_berlaku": null}

AKTA_LAHIR:
{"nomor_akta": null, "nama": null, "tempat_lahir": null, "tanggal_lahir": null, "jenis_kelamin": null, "nama_ayah": null, "nama_ibu": null, "tanggal_terbit": null, "tempat_terbit": null}

SURAT_KETERANGAN:
{"nomor_surat": null, "nama": null, "nik": null, "alamat": null, "perihal": null, "instansi": null, "tanggal_terbit": null}

UNKNOWN:
Extract all identifiable fields. Common fields: nama, nomor, tanggal, alamat, and any other relevant fields found.

RULES:
1. Return valid JSON only
2. Use null for missing fields
3. Dates must be in yyyy-MM-dd format
4. Numbers should be strings to preserve formatting
5. Extract ALL available information
6. For arrays (like anggota_keluarga, items, pendidikan), include all items found
7. Always set document_type in UPPERCASE with underscores (no spaces)
8. Explain any uncertainties or missing data in debug_notes`;

    const userContent = document_type_hint 
      ? `Document type hint: ${document_type_hint}\n\nOCR Text:\n${ocr_text}`
      : `OCR Text:\n${ocr_text}`;

    const response = await fetch("https://api.picaos.com/v1/passthrough/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-pica-secret": PICA_SECRET_KEY,
        "x-pica-connection-key": PICA_OPENAI_CONNECTION_KEY,
        "x-pica-action-id": "conn_mod_def::GDzgi1QfvM4::4OjsWvZhRxmAVuLAuWgfVA"
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent }
        ],
        temperature: 0,
        max_completion_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("PICA API error:", errorText);
      return new Response(
        JSON.stringify({ success: false, error: `PICA API error: ${response.statusText}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const data = await response.json();
    const assistantMessage = data.choices?.[0]?.message?.content;

    if (!assistantMessage) {
      return new Response(
        JSON.stringify({ success: false, error: "No content returned from OpenAI" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    console.log("UDFM ULTRA OCR: Raw response received");

    // Parse the JSON structured output
    let parsedOutput;
    try {
      // Clean the response - remove markdown code blocks if present
      let cleanedMessage = assistantMessage.trim();
      if (cleanedMessage.startsWith("```json")) {
        cleanedMessage = cleanedMessage.slice(7);
      }
      if (cleanedMessage.startsWith("```")) {
        cleanedMessage = cleanedMessage.slice(3);
      }
      if (cleanedMessage.endsWith("```")) {
        cleanedMessage = cleanedMessage.slice(0, -3);
      }
      cleanedMessage = cleanedMessage.trim();

      parsedOutput = JSON.parse(cleanedMessage);
    } catch (parseError) {
      console.error("Failed to parse assistant response:", parseError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Failed to parse AI response as JSON",
          raw_response: assistantMessage 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    console.log("UDFM ULTRA OCR: Document type detected:", parsedOutput.document_type);
    console.log("UDFM ULTRA OCR: Fields detected:", parsedOutput.fields_detected?.length || 0);

    return new Response(
      JSON.stringify({
        success: true,
        document_type: parsedOutput.document_type,
        jenis_dokumen: parsedOutput.document_type,
        structured_data: parsedOutput.structured_data,
        data: parsedOutput.structured_data,
        fields_detected: parsedOutput.fields_detected,
        confidence_per_field: parsedOutput.confidence_per_field,
        debug_notes: parsedOutput.debug_notes,
        raw_text: ocr_text,
        ocr_engine: "udfm_ultra_pica_openai"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    console.error("UDFM ULTRA OCR error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

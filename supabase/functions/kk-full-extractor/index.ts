import { corsHeaders } from "@shared/cors.ts";

interface AnggotaKeluarga {
  nama: string;
  nik: string;
  jenis_kelamin: string;
  tempat_lahir: string;
  tanggal_lahir: string;
  agama: string;
  pendidikan: string;
  jenis_pekerjaan: string;
  status_perkawinan: string;
  status_hubungan_keluarga: string;
  kewarganegaraan: string;
  no_paspor: string;
  no_kitap: string;
  nama_ayah: string;
  nama_ibu: string;
}

interface KKData {
  nomor_kk: string;
  nama_kepala_keluarga: string;
  alamat: string;
  rt_rw: string;
  kelurahan_desa: string;
  kecamatan: string;
  kabupaten_kota: string;
  provinsi: string;
  kode_pos: string;
  tanggal_dikeluarkan: string;
  anggota_keluarga: AnggotaKeluarga[];
  debug_notes: {
    inferred_fields: string[];
    uncertain_values: string[];
    ocr_confidence: number;
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  try {
    const { ocr_text, image_url, file_type } = await req.json();

    let rawText = ocr_text || "";

    // If no OCR text provided but image_url is given, perform OCR first
    if (!rawText && image_url) {
      console.log("No OCR text provided, performing OCR on image...");
      rawText = await performOCR(image_url, file_type);
    }

    if (!rawText || rawText.trim() === "") {
      return new Response(
        JSON.stringify({
          success: false,
          error: "No OCR text provided or OCR failed to extract text",
          data: null,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    console.log(`Processing KK document with ${rawText.length} characters`);
    console.log(`OCR text preview: ${rawText.substring(0, 500)}...`);

    // Get OpenAI API key directly (Pica disabled)
    const OPENAI_API_KEY = Deno.env.get("OPEN_AI_KEY");

    if (!OPENAI_API_KEY) {
      console.error("OpenAI API key not configured");
      return new Response(
        JSON.stringify({
          success: false,
          error: "AI service not configured - OPEN_AI_KEY missing",
          data: null,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // KK Full-Table Extractor System Prompt with Enhanced Smart Header Inference
    const systemPrompt = `You are an expert AI specialized in extracting detailed structured data from Indonesian Kartu Keluarga (KK) documents. Follow the instructions strictly to output a JSON with all required fields, perform AGGRESSIVE smart header inference, reconstruct and normalize the anggota_keluarga table, and include debug notes.

============================================================
SMART HEADER INFERENCE ENGINE (AGGRESSIVE MODE)
============================================================
CRITICAL: You MUST NEVER return empty values if data can be inferred from ANY part of the document.

If raw OCR does not capture KK headers (nama kepala keluarga, alamat, RT/RW, etc):

➡ You MUST infer from KK display format, national standard patterns, and KK table:

1. "nama_kepala_keluarga":
   - FIRST: Find anggota_keluarga with status_hubungan_keluarga = "KEPALA KELUARGA"
   - SECOND: If not found, take the FIRST person in the table (row 1)
   - THIRD: Look for name appearing near "Kepala Keluarga" label in header
   - NEVER leave empty if any name exists in document

2. "alamat":
   - Look for text after "Alamat" or "Alamat:" label
   - Look for street names (Jl., Jalan, Gg., Gang, Komp., Perumahan)
   - Combine address fragments if split across lines
   - Include house number if visible

3. "rt_rw":
   - Format MUST be "NNN/NNN" (e.g., "001/002", "012/003")
   - Search for patterns: RT/RW, RT.RW, RT RW, followed by numbers
   - If only partial found, infer the other part as "000"

4. "kelurahan_desa":
   - Look for "Kel.", "Kelurahan", "Desa", "Ds." keywords
   - Usually appears after RT/RW in address section
   - Check for village names in uppercase

5. "kecamatan":
   - Look for "Kec.", "Kecamatan" keywords
   - Usually appears after kelurahan in address section

6. "kabupaten_kota":
   - Look for "Kab.", "Kabupaten", "Kota" keywords
   - Check header area of KK document
   - Indonesian cities/regencies are often in UPPERCASE

7. "provinsi":
   - Look for "Prov.", "Provinsi" keywords
   - Check top header of KK document
   - Common provinces: JAWA BARAT, JAWA TENGAH, JAWA TIMUR, DKI JAKARTA, etc.
   - If city is found, INFER province from city (e.g., BANDUNG → JAWA BARAT)

8. "kode_pos":
   - Look for 5-digit number near address
   - Usually at end of address section

9. "tanggal_dikeluarkan":
   - Look for date near bottom of document
   - Look for "Dikeluarkan tanggal" or similar text
   - Format to yyyy-MM-dd

INFERENCE RULES:
- If province not found but city is known, INFER province from city
- If RT/RW partially found, complete with "000"
- If address fragments exist, COMBINE them
- NEVER return "" if ANY related text exists in document
- Use context clues from surrounding text

============================================================
TABLE RECONSTRUCTOR (ANGGOTA KELUARGA) - ADVANCED MODE
============================================================
If OCR merges columns, splits rows, or is messy:

You MUST reconstruct the table using these techniques:

1. NIK-BASED ROW IDENTIFICATION:
   - NIK is ALWAYS 16 digits (e.g., 3201234567890001)
   - Each NIK marks a NEW family member row
   - Use NIK as anchor point to separate rows
   - If NIK is split (e.g., "3201 2345 6789 0001"), MERGE it

2. COLUMN SEPARATION ALGORITHM:
   Standard KK column order (left to right):
   [1] Nama - Full name (text, usually UPPERCASE)
   [2] NIK - 16 digits
   [3] Jenis Kelamin - L/P or Laki-Laki/Perempuan
   [4] Tempat Lahir - City/place name
   [5] Tanggal Lahir - Date (various formats)
   [6] Agama - ISLAM/KRISTEN/KATOLIK/HINDU/BUDHA/KONGHUCU
   [7] Pendidikan - SD/SMP/SMA/D3/S1/S2/S3/TIDAK SEKOLAH
   [8] Jenis Pekerjaan - Job title
   [9] Status Perkawinan - BELUM KAWIN/KAWIN/CERAI HIDUP/CERAI MATI
   [10] Status Hubungan Keluarga - KEPALA KELUARGA/ISTRI/ANAK/MENANTU/CUCU/ORANG TUA/MERTUA/FAMILI LAIN/PEMBANTU/LAINNYA
   [11] Kewarganegaraan - WNI/WNA
   [12] No Paspor - Passport number or empty
   [13] No KITAP - KITAP number or empty
   [14] Nama Ayah - Father's name
   [15] Nama Ibu - Mother's name

3. MESSY OCR HANDLING:
   - If columns are merged: Use pattern matching to separate
   - If rows are split: Combine lines until next NIK found
   - If data is out of order: Reorder based on data type patterns
   - If duplicate data: Keep first occurrence

4. MISSING DATA RULES:
   - If column not found: Fill with "" (empty string)
   - NEVER use null
   - NEVER skip any column
   - All 15 columns MUST be present for each family member

============================================================
AUTOMATIC NORMALIZATION - STRICT RULES
============================================================
You MUST normalize ALL data:

1. DATES (tanggal_lahir, tanggal_dikeluarkan):
   - Convert to yyyy-MM-dd format
   - "01-05-1990" → "1990-05-01"
   - "1 Mei 1990" → "1990-05-01"
   - "01/05/90" → "1990-05-01"
   - Indonesian months: Januari, Februari, Maret, April, Mei, Juni, Juli, Agustus, September, Oktober, November, Desember

2. GENDER (jenis_kelamin):
   - "L" → "Laki-Laki"
   - "P" → "Perempuan"
   - "LAKI-LAKI" → "Laki-Laki"
   - "PEREMPUAN" → "Perempuan"

3. ADMINISTRATIVE REGIONS:
   - ALL UPPERCASE: kelurahan_desa, kecamatan, kabupaten_kota, provinsi
   - Remove extra spaces
   - Fix common OCR errors

4. RELATIONSHIP STATUS (status_hubungan_keluarga):
   - Standardize to: KEPALA KELUARGA, ISTRI, ANAK, MENANTU, CUCU, ORANG TUA, MERTUA, FAMILI LAIN, PEMBANTU, LAINNYA

5. MARITAL STATUS (status_perkawinan):
   - Standardize to: BELUM KAWIN, KAWIN, CERAI HIDUP, CERAI MATI

6. OCR ARTIFACT REMOVAL:
   - Remove: "|", "\\", "/O", "0O0", "l1", "I1"
   - Fix: "0" vs "O", "1" vs "l" vs "I"
   - Remove random punctuation in names
   - Fix split words

============================================================
OUTPUT FORMAT
============================================================
Return ONLY valid JSON with this exact structure:
{
  "nomor_kk": "",
  "nama_kepala_keluarga": "",
  "alamat": "",
  "rt_rw": "",
  "kelurahan_desa": "",
  "kecamatan": "",
  "kabupaten_kota": "",
  "provinsi": "",
  "kode_pos": "",
  "tanggal_dikeluarkan": "",
  "anggota_keluarga": [
    {
      "nama": "",
      "nik": "",
      "jenis_kelamin": "",
      "tempat_lahir": "",
      "tanggal_lahir": "",
      "agama": "",
      "pendidikan": "",
      "jenis_pekerjaan": "",
      "status_perkawinan": "",
      "status_hubungan_keluarga": "",
      "kewarganegaraan": "",
      "no_paspor": "",
      "no_kitap": "",
      "nama_ayah": "",
      "nama_ibu": ""
    }
  ],
  "debug_notes": {
    "inferred_fields": [],
    "uncertain_values": [],
    "ocr_confidence": 0
  }
}

ALL values MUST be filled using OCR text or inference. Use "" for truly missing fields, NEVER null.

FINAL CHECK BEFORE OUTPUT:
- If nama_kepala_keluarga is empty but anggota_keluarga has data → FILL from first member or KEPALA KELUARGA
- If provinsi is empty but kabupaten_kota is known → INFER provinsi
- If rt_rw is partial → COMPLETE with 000
- If any address field is empty but address text exists → EXTRACT and FILL`;

    const userPrompt = `Here is the OCR text of the KK document. Extract the complete JSON structure with all fields filled, infer missing headers AGGRESSIVELY, reconstruct tables, normalize data, and include debug notes as specified.

IMPORTANT: 
- nama_kepala_keluarga MUST be filled from anggota_keluarga if not in header
- provinsi MUST be inferred from kabupaten_kota if not found
- ALL address fields must be extracted from any address text found
- NEVER return empty string if data can be inferred

OCR TEXT:
${rawText}`;

    console.log("Calling OpenAI directly for KK extraction...");

    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0,
          max_tokens: 4000,
          response_format: { type: "json_object" },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", errorText);
      return new Response(
        JSON.stringify({
          success: false,
          error: `AI extraction failed: ${response.status}`,
          data: null,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error("No content in AI response");
      return new Response(
        JSON.stringify({
          success: false,
          error: "AI returned empty response",
          data: null,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    console.log("AI response received:", content.substring(0, 500));

    // Parse the JSON response
    let kkData: KKData;
    try {
      kkData = JSON.parse(content);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to parse AI extraction result",
          raw_response: content,
          data: null,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Ensure all required fields exist with at least empty strings
    const normalizedData = normalizeKKData(kkData);

    console.log("KK extraction successful");
    console.log(`Extracted ${normalizedData.anggota_keluarga?.length || 0} family members`);
    console.log(`Fields extracted: ${Object.keys(normalizedData).filter(k => normalizedData[k as keyof typeof normalizedData] && k !== 'anggota_keluarga' && k !== 'debug_notes').join(', ')}`);

    return new Response(
      JSON.stringify({
        success: true,
        jenis_dokumen: "KK",
        data: normalizedData,
        raw_text: rawText,
        ocr_engine: "kk_full_extractor",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("KK Full Extractor Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        data: null,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  }
});

// Perform OCR on image/PDF
async function performOCR(imageUrl: string, fileType?: string): Promise<string> {
  const mimeType = (fileType || "image/jpeg").toLowerCase();
  const isPdf = mimeType === "application/pdf" || mimeType.includes("pdf") || imageUrl.toLowerCase().includes(".pdf");

  let rawText = "";

  // Try Google Vision first (works for both images and PDFs)
  const googleApiKey = Deno.env.get("GOOGLE_VISION_API_KEY");
  
  if (googleApiKey) {
    try {
      console.log("Fetching image for Google Vision OCR...");
      
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        console.error(`Failed to fetch image: ${imageResponse.status}`);
      } else {
        const imageBuffer = await imageResponse.arrayBuffer();
        const base64Image = btoa(
          new Uint8Array(imageBuffer).reduce(
            (data, byte) => data + String.fromCharCode(byte),
            ""
          )
        );

        console.log(`Image fetched, base64 length: ${base64Image.length}`);

        const visionResponse = await fetch(
          `https://vision.googleapis.com/v1/images:annotate?key=${googleApiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              requests: [
                {
                  image: { content: base64Image },
                  features: [{ type: "DOCUMENT_TEXT_DETECTION", maxResults: 1 }],
                },
              ],
            }),
          }
        );

        if (visionResponse.ok) {
          const visionData = await visionResponse.json();
          rawText = visionData.responses?.[0]?.fullTextAnnotation?.text || "";
          console.log(`Google Vision extracted ${rawText.length} characters`);
        } else {
          const errorText = await visionResponse.text();
          console.error("Google Vision API error:", errorText);
        }
      }
    } catch (error) {
      console.error("Google Vision OCR error:", error);
    }
  }

  // Fallback to Tesseract for PDFs if Google Vision failed
  if (!rawText && isPdf) {
    try {
      console.log("Trying Tesseract OCR for PDF...");
      const ocrResponse = await fetch(
        `${Deno.env.get("SUPABASE_URL")}/functions/v1/supabase-functions-tesseract-ocr`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
          },
          body: JSON.stringify({ pdf_url: imageUrl }),
        }
      );

      if (ocrResponse.ok) {
        const ocrData = await ocrResponse.json();
        rawText = ocrData.text || "";
        console.log(`Tesseract extracted ${rawText.length} characters`);
      }
    } catch (error) {
      console.error("Tesseract OCR error:", error);
    }
  }

  return rawText;
}

// Normalize KK data to ensure all fields exist
function normalizeKKData(data: Partial<KKData>): KKData {
  const emptyAnggota: AnggotaKeluarga = {
    nama: "",
    nik: "",
    jenis_kelamin: "",
    tempat_lahir: "",
    tanggal_lahir: "",
    agama: "",
    pendidikan: "",
    jenis_pekerjaan: "",
    status_perkawinan: "",
    status_hubungan_keluarga: "",
    kewarganegaraan: "",
    no_paspor: "",
    no_kitap: "",
    nama_ayah: "",
    nama_ibu: "",
  };

  // Normalize anggota_keluarga array with OCR artifact cleaning
  const normalizedAnggota = (data.anggota_keluarga || []).map((anggota) => ({
    nama: cleanOCRArtifacts(anggota.nama || "").toUpperCase(),
    nik: cleanNIK(anggota.nik || ""),
    jenis_kelamin: normalizeGender(anggota.jenis_kelamin || ""),
    tempat_lahir: cleanOCRArtifacts(anggota.tempat_lahir || "").toUpperCase(),
    tanggal_lahir: normalizeDate(anggota.tanggal_lahir || ""),
    agama: normalizeAgama(anggota.agama || ""),
    pendidikan: normalizePendidikan(anggota.pendidikan || ""),
    jenis_pekerjaan: cleanOCRArtifacts(anggota.jenis_pekerjaan || "").toUpperCase(),
    status_perkawinan: normalizeStatusPerkawinan(anggota.status_perkawinan || ""),
    status_hubungan_keluarga: normalizeStatusHubungan(anggota.status_hubungan_keluarga || ""),
    kewarganegaraan: normalizeKewarganegaraan(anggota.kewarganegaraan || ""),
    no_paspor: cleanOCRArtifacts(anggota.no_paspor || ""),
    no_kitap: cleanOCRArtifacts(anggota.no_kitap || ""),
    nama_ayah: cleanOCRArtifacts(anggota.nama_ayah || "").toUpperCase(),
    nama_ibu: cleanOCRArtifacts(anggota.nama_ibu || "").toUpperCase(),
  }));

  // Infer nama_kepala_keluarga from anggota_keluarga if not set
  let namaKepalaKeluarga = data.nama_kepala_keluarga || "";
  if (!namaKepalaKeluarga && normalizedAnggota.length > 0) {
    const kepala = normalizedAnggota.find(
      (a) => a.status_hubungan_keluarga === "KEPALA KELUARGA"
    );
    namaKepalaKeluarga = kepala?.nama || normalizedAnggota[0]?.nama || "";
  }

  return {
    nomor_kk: cleanNomorKK(data.nomor_kk || ""),
    nama_kepala_keluarga: namaKepalaKeluarga,
    alamat: data.alamat || "",
    rt_rw: normalizeRtRw(data.rt_rw || ""),
    kelurahan_desa: (data.kelurahan_desa || "").toUpperCase(),
    kecamatan: (data.kecamatan || "").toUpperCase(),
    kabupaten_kota: (data.kabupaten_kota || "").toUpperCase(),
    provinsi: inferProvinsi(data.provinsi || "", data.kabupaten_kota || ""),
    kode_pos: cleanKodePos(data.kode_pos || ""),
    tanggal_dikeluarkan: normalizeDate(data.tanggal_dikeluarkan || ""),
    anggota_keluarga: normalizedAnggota.length > 0 ? normalizedAnggota : [emptyAnggota],
    debug_notes: data.debug_notes || {
      inferred_fields: [],
      uncertain_values: [],
      ocr_confidence: 0,
    },
  };
}

// Infer provinsi from kabupaten/kota if not provided
function inferProvinsi(provinsi: string, kabupatenKota: string): string {
  if (provinsi && provinsi.trim() !== "") {
    return provinsi.toUpperCase();
  }
  
  const kota = kabupatenKota.toUpperCase();
  
  // Map of cities/regencies to provinces
  const kotaToProvinsi: Record<string, string> = {
    // DKI Jakarta
    "JAKARTA PUSAT": "DKI JAKARTA",
    "JAKARTA UTARA": "DKI JAKARTA",
    "JAKARTA BARAT": "DKI JAKARTA",
    "JAKARTA SELATAN": "DKI JAKARTA",
    "JAKARTA TIMUR": "DKI JAKARTA",
    "KEPULAUAN SERIBU": "DKI JAKARTA",
    
    // Jawa Barat
    "BANDUNG": "JAWA BARAT",
    "KOTA BANDUNG": "JAWA BARAT",
    "KABUPATEN BANDUNG": "JAWA BARAT",
    "BANDUNG BARAT": "JAWA BARAT",
    "BOGOR": "JAWA BARAT",
    "KOTA BOGOR": "JAWA BARAT",
    "KABUPATEN BOGOR": "JAWA BARAT",
    "BEKASI": "JAWA BARAT",
    "KOTA BEKASI": "JAWA BARAT",
    "KABUPATEN BEKASI": "JAWA BARAT",
    "DEPOK": "JAWA BARAT",
    "KOTA DEPOK": "JAWA BARAT",
    "CIMAHI": "JAWA BARAT",
    "TASIKMALAYA": "JAWA BARAT",
    "SUKABUMI": "JAWA BARAT",
    "CIANJUR": "JAWA BARAT",
    "GARUT": "JAWA BARAT",
    "KARAWANG": "JAWA BARAT",
    "SUBANG": "JAWA BARAT",
    "PURWAKARTA": "JAWA BARAT",
    "CIREBON": "JAWA BARAT",
    "INDRAMAYU": "JAWA BARAT",
    "MAJALENGKA": "JAWA BARAT",
    "KUNINGAN": "JAWA BARAT",
    "SUMEDANG": "JAWA BARAT",
    "CIAMIS": "JAWA BARAT",
    "PANGANDARAN": "JAWA BARAT",
    "BANJAR": "JAWA BARAT",
    
    // Jawa Tengah
    "SEMARANG": "JAWA TENGAH",
    "KOTA SEMARANG": "JAWA TENGAH",
    "KABUPATEN SEMARANG": "JAWA TENGAH",
    "SOLO": "JAWA TENGAH",
    "SURAKARTA": "JAWA TENGAH",
    "KOTA SURAKARTA": "JAWA TENGAH",
    "MAGELANG": "JAWA TENGAH",
    "SALATIGA": "JAWA TENGAH",
    "PEKALONGAN": "JAWA TENGAH",
    "TEGAL": "JAWA TENGAH",
    "BREBES": "JAWA TENGAH",
    "CILACAP": "JAWA TENGAH",
    "BANYUMAS": "JAWA TENGAH",
    "PURBALINGGA": "JAWA TENGAH",
    "BANJARNEGARA": "JAWA TENGAH",
    "KEBUMEN": "JAWA TENGAH",
    "PURWOREJO": "JAWA TENGAH",
    "WONOSOBO": "JAWA TENGAH",
    "TEMANGGUNG": "JAWA TENGAH",
    "KENDAL": "JAWA TENGAH",
    "BATANG": "JAWA TENGAH",
    "PEMALANG": "JAWA TENGAH",
    "DEMAK": "JAWA TENGAH",
    "KUDUS": "JAWA TENGAH",
    "JEPARA": "JAWA TENGAH",
    "PATI": "JAWA TENGAH",
    "REMBANG": "JAWA TENGAH",
    "BLORA": "JAWA TENGAH",
    "GROBOGAN": "JAWA TENGAH",
    "SRAGEN": "JAWA TENGAH",
    "KARANGANYAR": "JAWA TENGAH",
    "WONOGIRI": "JAWA TENGAH",
    "SUKOHARJO": "JAWA TENGAH",
    "KLATEN": "JAWA TENGAH",
    "BOYOLALI": "JAWA TENGAH",
    
    // Jawa Timur
    "SURABAYA": "JAWA TIMUR",
    "KOTA SURABAYA": "JAWA TIMUR",
    "MALANG": "JAWA TIMUR",
    "KOTA MALANG": "JAWA TIMUR",
    "KABUPATEN MALANG": "JAWA TIMUR",
    "SIDOARJO": "JAWA TIMUR",
    "GRESIK": "JAWA TIMUR",
    "MOJOKERTO": "JAWA TIMUR",
    "PASURUAN": "JAWA TIMUR",
    "PROBOLINGGO": "JAWA TIMUR",
    "LUMAJANG": "JAWA TIMUR",
    "JEMBER": "JAWA TIMUR",
    "BANYUWANGI": "JAWA TIMUR",
    "BONDOWOSO": "JAWA TIMUR",
    "SITUBONDO": "JAWA TIMUR",
    "KEDIRI": "JAWA TIMUR",
    "BLITAR": "JAWA TIMUR",
    "TULUNGAGUNG": "JAWA TIMUR",
    "TRENGGALEK": "JAWA TIMUR",
    "PONOROGO": "JAWA TIMUR",
    "PACITAN": "JAWA TIMUR",
    "MADIUN": "JAWA TIMUR",
    "MAGETAN": "JAWA TIMUR",
    "NGAWI": "JAWA TIMUR",
    "BOJONEGORO": "JAWA TIMUR",
    "TUBAN": "JAWA TIMUR",
    "LAMONGAN": "JAWA TIMUR",
    "BANGKALAN": "JAWA TIMUR",
    "SAMPANG": "JAWA TIMUR",
    "PAMEKASAN": "JAWA TIMUR",
    "SUMENEP": "JAWA TIMUR",
    "NGANJUK": "JAWA TIMUR",
    "JOMBANG": "JAWA TIMUR",
    "BATU": "JAWA TIMUR",
    
    // Banten
    "TANGERANG": "BANTEN",
    "KOTA TANGERANG": "BANTEN",
    "KABUPATEN TANGERANG": "BANTEN",
    "TANGERANG SELATAN": "BANTEN",
    "SERANG": "BANTEN",
    "CILEGON": "BANTEN",
    "PANDEGLANG": "BANTEN",
    "LEBAK": "BANTEN",
    
    // DI Yogyakarta
    "YOGYAKARTA": "DI YOGYAKARTA",
    "KOTA YOGYAKARTA": "DI YOGYAKARTA",
    "SLEMAN": "DI YOGYAKARTA",
    "BANTUL": "DI YOGYAKARTA",
    "KULON PROGO": "DI YOGYAKARTA",
    "GUNUNGKIDUL": "DI YOGYAKARTA",
    
    // Bali
    "DENPASAR": "BALI",
    "BADUNG": "BALI",
    "GIANYAR": "BALI",
    "TABANAN": "BALI",
    "BULELENG": "BALI",
    "KARANGASEM": "BALI",
    "KLUNGKUNG": "BALI",
    "BANGLI": "BALI",
    "JEMBRANA": "BALI",
    
    // Sumatera Utara
    "MEDAN": "SUMATERA UTARA",
    "KOTA MEDAN": "SUMATERA UTARA",
    "DELI SERDANG": "SUMATERA UTARA",
    "BINJAI": "SUMATERA UTARA",
    "PEMATANGSIANTAR": "SUMATERA UTARA",
    
    // Sumatera Barat
    "PADANG": "SUMATERA BARAT",
    "KOTA PADANG": "SUMATERA BARAT",
    "BUKITTINGGI": "SUMATERA BARAT",
    
    // Riau
    "PEKANBARU": "RIAU",
    "KOTA PEKANBARU": "RIAU",
    "DUMAI": "RIAU",
    
    // Sumatera Selatan
    "PALEMBANG": "SUMATERA SELATAN",
    "KOTA PALEMBANG": "SUMATERA SELATAN",
    
    // Lampung
    "BANDAR LAMPUNG": "LAMPUNG",
    "KOTA BANDAR LAMPUNG": "LAMPUNG",
    
    // Kalimantan
    "BALIKPAPAN": "KALIMANTAN TIMUR",
    "SAMARINDA": "KALIMANTAN TIMUR",
    "PONTIANAK": "KALIMANTAN BARAT",
    "BANJARMASIN": "KALIMANTAN SELATAN",
    "PALANGKARAYA": "KALIMANTAN TENGAH",
    
    // Sulawesi
    "MAKASSAR": "SULAWESI SELATAN",
    "KOTA MAKASSAR": "SULAWESI SELATAN",
    "MANADO": "SULAWESI UTARA",
    "PALU": "SULAWESI TENGAH",
    "KENDARI": "SULAWESI TENGGARA",
    
    // Papua
    "JAYAPURA": "PAPUA",
    "KOTA JAYAPURA": "PAPUA",
  };
  
  // Direct match
  if (kotaToProvinsi[kota]) {
    return kotaToProvinsi[kota];
  }
  
  // Partial match
  for (const [kotaKey, prov] of Object.entries(kotaToProvinsi)) {
    if (kota.includes(kotaKey) || kotaKey.includes(kota)) {
      return prov;
    }
  }
  
  return "";
}

// Helper functions for normalization
function normalizeGender(gender: string): string {
  const g = gender.toLowerCase();
  if (g.includes("laki") || g === "l" || g === "pria") return "Laki-Laki";
  if (g.includes("perempuan") || g === "p" || g === "wanita") return "Perempuan";
  return gender;
}

function normalizeDate(date: string): string {
  if (!date) return "";
  
  // Clean OCR artifacts first
  let cleaned = cleanOCRArtifacts(date);
  
  // Already in yyyy-MM-dd format
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) return cleaned;
  
  // Convert dd-MM-yyyy or dd/MM/yyyy to yyyy-MM-dd
  const match1 = cleaned.match(/(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/);
  if (match1) {
    const [, day, month, year] = match1;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  
  // Convert dd-MM-yy to yyyy-MM-dd (assume 1900s for yy > 30, 2000s otherwise)
  const match2 = cleaned.match(/(\d{1,2})[-\/](\d{1,2})[-\/](\d{2})/);
  if (match2) {
    const [, day, month, yy] = match2;
    const year = parseInt(yy) > 30 ? `19${yy}` : `20${yy}`;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  
  // Indonesian month names
  const indonesianMonths: Record<string, string> = {
    "januari": "01", "jan": "01",
    "februari": "02", "feb": "02",
    "maret": "03", "mar": "03",
    "april": "04", "apr": "04",
    "mei": "05",
    "juni": "06", "jun": "06",
    "juli": "07", "jul": "07",
    "agustus": "08", "agu": "08", "ags": "08",
    "september": "09", "sep": "09", "sept": "09",
    "oktober": "10", "okt": "10",
    "november": "11", "nov": "11", "nop": "11",
    "desember": "12", "des": "12",
  };
  
  // Convert "dd Month yyyy" or "dd-Month-yyyy" format
  const monthPattern = Object.keys(indonesianMonths).join("|");
  const match3 = cleaned.toLowerCase().match(new RegExp(`(\\d{1,2})\\s*[-\\s]?\\s*(${monthPattern})\\s*[-\\s]?\\s*(\\d{4})`, "i"));
  if (match3) {
    const [, day, monthName, year] = match3;
    const month = indonesianMonths[monthName.toLowerCase()];
    if (month) {
      return `${year}-${month}-${day.padStart(2, "0")}`;
    }
  }
  
  return cleaned;
}

// Clean OCR artifacts from text
function cleanOCRArtifacts(text: string): string {
  if (!text) return "";
  
  let cleaned = text;
  
  // Remove common OCR artifacts
  cleaned = cleaned.replace(/\|/g, ""); // Pipe characters
  cleaned = cleaned.replace(/\\+/g, ""); // Backslashes
  cleaned = cleaned.replace(/[`´'']/g, "'"); // Normalize quotes
  cleaned = cleaned.replace(/[""]/g, '"'); // Normalize double quotes
  cleaned = cleaned.replace(/\s+/g, " "); // Multiple spaces to single
  cleaned = cleaned.replace(/^\s+|\s+$/g, ""); // Trim
  
  // Fix common OCR character confusions
  // Only apply to specific contexts to avoid breaking valid data
  
  return cleaned;
}

function normalizeRtRw(rtRw: string): string {
  if (!rtRw) return "";
  
  // Extract numbers and format as NNN/NNN
  const match = rtRw.match(/(\d{1,3})\s*[\/\\]\s*(\d{1,3})/);
  if (match) {
    return `${match[1].padStart(3, "0")}/${match[2].padStart(3, "0")}`;
  }
  
  return rtRw;
}

function cleanNomorKK(nomor: string): string {
  // Remove non-digit characters and ensure 16 digits
  const cleaned = nomor.replace(/\D/g, "");
  return cleaned.length === 16 ? cleaned : nomor;
}

function cleanKodePos(kodePos: string): string {
  // Remove non-digit characters and ensure 5 digits
  const cleaned = kodePos.replace(/\D/g, "");
  return cleaned.length === 5 ? cleaned : kodePos;
}

// Clean NIK - ensure 16 digits
function cleanNIK(nik: string): string {
  // Remove non-digit characters
  const cleaned = nik.replace(/\D/g, "");
  // Merge split NIK (e.g., "3201 2345 6789 0001" -> "3201234567890001")
  return cleaned.length === 16 ? cleaned : nik.replace(/\s+/g, "");
}

// Normalize agama to standard format
function normalizeAgama(agama: string): string {
  const a = agama.toUpperCase().trim();
  const agamaMap: Record<string, string> = {
    "ISLAM": "ISLAM",
    "KRISTEN": "KRISTEN",
    "KRISTEN PROTESTAN": "KRISTEN",
    "PROTESTAN": "KRISTEN",
    "KATOLIK": "KATOLIK",
    "KRISTEN KATOLIK": "KATOLIK",
    "HINDU": "HINDU",
    "BUDHA": "BUDHA",
    "BUDDHA": "BUDHA",
    "KONGHUCU": "KONGHUCU",
    "KHONGHUCU": "KONGHUCU",
  };
  return agamaMap[a] || a;
}

// Normalize pendidikan to standard format
function normalizePendidikan(pendidikan: string): string {
  const p = pendidikan.toUpperCase().trim();
  const pendidikanMap: Record<string, string> = {
    "TIDAK/BELUM SEKOLAH": "TIDAK/BELUM SEKOLAH",
    "TIDAK SEKOLAH": "TIDAK/BELUM SEKOLAH",
    "BELUM SEKOLAH": "TIDAK/BELUM SEKOLAH",
    "BELUM TAMAT SD/SEDERAJAT": "BELUM TAMAT SD/SEDERAJAT",
    "TAMAT SD/SEDERAJAT": "TAMAT SD/SEDERAJAT",
    "SD": "TAMAT SD/SEDERAJAT",
    "SLTP/SEDERAJAT": "SLTP/SEDERAJAT",
    "SMP": "SLTP/SEDERAJAT",
    "SLTA/SEDERAJAT": "SLTA/SEDERAJAT",
    "SMA": "SLTA/SEDERAJAT",
    "SMK": "SLTA/SEDERAJAT",
    "DIPLOMA I/II": "DIPLOMA I/II",
    "D1": "DIPLOMA I/II",
    "D2": "DIPLOMA I/II",
    "AKADEMI/DIPLOMA III/S.MUDA": "AKADEMI/DIPLOMA III/S.MUDA",
    "D3": "AKADEMI/DIPLOMA III/S.MUDA",
    "DIPLOMA IV/STRATA I": "DIPLOMA IV/STRATA I",
    "D4": "DIPLOMA IV/STRATA I",
    "S1": "DIPLOMA IV/STRATA I",
    "STRATA II": "STRATA II",
    "S2": "STRATA II",
    "STRATA III": "STRATA III",
    "S3": "STRATA III",
  };
  return pendidikanMap[p] || p;
}

// Normalize status perkawinan
function normalizeStatusPerkawinan(status: string): string {
  const s = status.toUpperCase().trim();
  const statusMap: Record<string, string> = {
    "BELUM KAWIN": "BELUM KAWIN",
    "BELUM MENIKAH": "BELUM KAWIN",
    "SINGLE": "BELUM KAWIN",
    "KAWIN": "KAWIN",
    "MENIKAH": "KAWIN",
    "MARRIED": "KAWIN",
    "CERAI HIDUP": "CERAI HIDUP",
    "CERAI": "CERAI HIDUP",
    "CERAI MATI": "CERAI MATI",
    "JANDA": "CERAI MATI",
    "DUDA": "CERAI MATI",
  };
  return statusMap[s] || s;
}

// Normalize status hubungan keluarga
function normalizeStatusHubungan(status: string): string {
  const s = status.toUpperCase().trim();
  const statusMap: Record<string, string> = {
    "KEPALA KELUARGA": "KEPALA KELUARGA",
    "KEPALA": "KEPALA KELUARGA",
    "KK": "KEPALA KELUARGA",
    "ISTRI": "ISTRI",
    "ISTERI": "ISTRI",
    "ANAK": "ANAK",
    "ANAK KANDUNG": "ANAK",
    "ANAK ANGKAT": "ANAK",
    "MENANTU": "MENANTU",
    "CUCU": "CUCU",
    "ORANG TUA": "ORANG TUA",
    "ORANGTUA": "ORANG TUA",
    "MERTUA": "MERTUA",
    "FAMILI LAIN": "FAMILI LAIN",
    "KELUARGA LAIN": "FAMILI LAIN",
    "PEMBANTU": "PEMBANTU",
    "LAINNYA": "LAINNYA",
  };
  return statusMap[s] || s;
}

// Normalize kewarganegaraan
function normalizeKewarganegaraan(kewarganegaraan: string): string {
  const k = kewarganegaraan.toUpperCase().trim();
  if (k === "" || k === "WNI" || k.includes("INDONESIA")) return "WNI";
  if (k === "WNA" || k.includes("ASING")) return "WNA";
  return k || "WNI";
}

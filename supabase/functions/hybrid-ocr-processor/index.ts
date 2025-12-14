import { corsHeaders } from "@shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 });
  }

  try {
    const { image_url, file_type, document_type_hint } = await req.json();

    if (!image_url) {
      throw new Error("image_url is required");
    }

    console.log(`Processing file with type: ${file_type}, hint: ${document_type_hint}`);
    console.log(`Image URL: ${image_url.substring(0, 100)}...`);

    let rawText = "";
    let ocrEngine = "";

    // Step 1: Detect file type and route to appropriate OCR engine
    const mimeType = (file_type || "image/jpeg").toLowerCase();
    
    console.log(`Detected MIME type: ${mimeType}`);
    
    // Check if it's a PDF
    const isPdf = mimeType === "application/pdf" || 
                  mimeType.includes("pdf") || 
                  image_url.toLowerCase().includes(".pdf");
    
    // Check if it's an image
    const isImage = mimeType.startsWith("image/") || 
                    ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif", "image/bmp"].includes(mimeType) ||
                    /\.(jpg|jpeg|png|webp|gif|bmp)$/i.test(image_url);

    console.log(`isPdf: ${isPdf}, isImage: ${isImage}`);

    if (isPdf) {
      // Use Tesseract OCR for PDF files
      ocrEngine = "tesseract";
      
      console.log("Using Tesseract OCR for PDF file");
      
      try {
        const ocrResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/supabase-functions-tesseract-ocr`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
          },
          body: JSON.stringify({ pdf_url: image_url }),
        });

        if (!ocrResponse.ok) {
          const errorText = await ocrResponse.text();
          console.error("Tesseract OCR failed:", errorText);
          // Try Google Vision as fallback for PDF
          console.log("Falling back to Google Vision for PDF...");
          ocrEngine = "google_vision_fallback";
        } else {
          const ocrData = await ocrResponse.json();
          rawText = ocrData.text || "";
          console.log(`Tesseract returned ${rawText.length} characters`);
        }
      } catch (e) {
        console.error("Tesseract OCR error:", e);
        ocrEngine = "google_vision_fallback";
      }
    }
    
    if (isImage || ocrEngine === "google_vision_fallback" || (!rawText && !isPdf)) {
      // Use Google Vision OCR for image files or as fallback
      if (ocrEngine !== "google_vision_fallback") {
        ocrEngine = "google_vision";
      }
      
      console.log("Using Google Vision OCR");
      console.log("Image URL for OCR:", image_url);
      
      try {
        const ocrResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/supabase-functions-vision-google-ocr`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
          },
          body: JSON.stringify({ 
            image_url: image_url,
            signedUrl: image_url  // Also pass as signedUrl for compatibility
          }),
        });

        console.log("Vision Google OCR response status:", ocrResponse.status);

        if (!ocrResponse.ok) {
          const errorText = await ocrResponse.text();
          console.error("Google Vision OCR failed:", errorText);
          
          // Try direct Google Vision API as last resort
          console.log("Falling back to direct Google Vision API...");
          rawText = await tryDirectGoogleVision(image_url);
          ocrEngine = "google_vision_direct";
        } else {
          const ocrData = await ocrResponse.json();
          console.log("Vision Google OCR response:", JSON.stringify(ocrData).substring(0, 500));
          rawText = ocrData.text || ocrData.extracted_text || "";
          console.log(`Google Vision returned ${rawText.length} characters`);
          
          if (!rawText && ocrData.error) {
            console.error("Vision Google OCR returned error:", ocrData.error);
            // Try direct Google Vision API
            rawText = await tryDirectGoogleVision(image_url);
            ocrEngine = "google_vision_direct";
          }
        }
      } catch (e) {
        console.error("Google Vision OCR error:", e);
        // Try direct Google Vision API
        rawText = await tryDirectGoogleVision(image_url);
        ocrEngine = "google_vision_direct";
      }
    }

    // If still no text, try direct Google Vision as absolute fallback
    if (!rawText || rawText.trim() === "") {
      console.log("No text from OCR engines, trying direct Google Vision API...");
      rawText = await tryDirectGoogleVision(image_url);
      ocrEngine = "google_vision_direct";
    }

    if (!rawText || rawText.trim() === "") {
      console.error("All OCR methods failed to extract text");
      return new Response(
        JSON.stringify({
          success: false,
          error: "OCR failed to extract any text from the document. Please ensure the image is clear and readable.",
          ocr_engine: ocrEngine || "none",
          jenis_dokumen: document_type_hint || "unknown",
          data: {},
          raw_text: "",
          clean_text: "",
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200, // Return 200 so frontend can handle gracefully
        }
      );
    }

    console.log(`OCR Engine: ${ocrEngine}, Raw text length: ${rawText.length}`);
    console.log(`Raw text preview: ${rawText.substring(0, 300)}...`);

    // Step 2: Use OpenAI directly for AI classification (Pica disabled)
    const openAiKey = Deno.env.get('OPEN_AI_KEY');

    let cleanText = rawText;
    let documentType = document_type_hint?.toUpperCase() || "UNKNOWN";
    let structuredData: Record<string, unknown> = {};

    // ========================================
    // UDFM ULTRA - UNIVERSAL DOCUMENT FIELD MAPPER
    // DOCUMENT TYPE CLASSIFICATION (v3)
    // ========================================
    const upperText = rawText.toUpperCase();
    
    // UDFM ULTRA: Detect document type from text content
    function detectDocumentType(text: string, hint?: string): string {
      const upper = text.toUpperCase();
      
      // Priority 1: Use hint if provided
      if (hint) {
        const hintUpper = hint.toUpperCase();
        if (["KTP", "KK", "IJAZAH", "NPWP", "SIM", "STNK", "PAJAK_KENDARAAN", "AWB", "INVOICE", "CV"].includes(hintUpper)) {
          return hintUpper;
        }
      }
      
      // Priority 2: Keyword-based detection
      // KK Detection
      if (upper.includes("KARTU KELUARGA") || upper.includes("NOMOR KK")) {
        return "KK";
      }
      
      // KTP Detection (must have NIK + personal info)
      if ((upper.includes("NIK") || upper.includes("NOMOR INDUK KEPENDUDUKAN")) && 
          (upper.includes("TEMPAT") || upper.includes("TGL LAHIR") || upper.includes("TANGGAL LAHIR"))) {
        return "KTP";
      }
      
      // IJAZAH Detection
      const ijazahKeywords = ["IJAZAH", "SEKOLAH MENENGAH", "NISN", "DIPLOMA", "SARJANA", "KELULUSAN", "SERTIFIKAT KELULUSAN"];
      if (ijazahKeywords.some(kw => upper.includes(kw))) {
        return "IJAZAH";
      }
      
      // NPWP Detection
      if (upper.includes("NPWP") || upper.includes("NOMOR POKOK WAJIB PAJAK")) {
        return "NPWP";
      }
      
      // SIM Detection
      if (upper.includes("SURAT IZIN MENGEMUDI") || (upper.includes("SIM") && upper.includes("GOLONGAN"))) {
        return "SIM";
      }
      
      // STNK Detection
      if (upper.includes("SURAT TANDA NOMOR KENDARAAN") || upper.includes("STNK")) {
        return "STNK";
      }
      
      // PAJAK KENDARAAN Detection
      if (upper.includes("PAJAK KENDARAAN BERMOTOR") || upper.includes("PKB") || upper.includes("SAMSAT")) {
        return "PAJAK_KENDARAAN";
      }
      
      // AWB Detection
      if (upper.includes("AIR WAYBILL") || upper.includes("AWB") || 
          (upper.includes("CONSIGNEE") && upper.includes("SHIPPER"))) {
        return "AWB";
      }
      
      // INVOICE Detection
      if (upper.includes("INVOICE") || upper.includes("FAKTUR") || 
          (upper.includes("BILL TO") && upper.includes("TOTAL"))) {
        return "INVOICE";
      }
      
      // CV Detection
      if (upper.includes("CURRICULUM VITAE") || upper.includes("RIWAYAT HIDUP") ||
          (upper.includes("PENGALAMAN KERJA") && upper.includes("PENDIDIKAN"))) {
        return "CV";
      }
      
      // BPJS Detection
      if (upper.includes("BPJS") || upper.includes("JAMINAN KESEHATAN")) {
        return "BPJS";
      }
      
      // AKTA LAHIR Detection
      if (upper.includes("AKTA KELAHIRAN") || upper.includes("KUTIPAN AKTA KELAHIRAN")) {
        return "AKTA_LAHIR";
      }
      
      // SURAT KETERANGAN Detection
      if (upper.includes("SURAT KETERANGAN") || upper.includes("SKCK")) {
        return "SURAT_KETERANGAN";
      }
      
      return "UNKNOWN";
    }
    
    // Detect document type using UDFM ULTRA classifier
    documentType = detectDocumentType(rawText, document_type_hint);
    console.log(`UDFM ULTRA: Detected document type = ${documentType}`);
    
    // Legacy compatibility flags
    const isIjazahDocument = documentType === "IJAZAH";
    const isKKDocument = documentType === "KK";
    
    // ========================================
    // IJAZAH DOCUMENT PROCESSING
    // ========================================
    if (isIjazahDocument) {
      console.log("Detected IJAZAH document, using IJAZAH Extractor...");
      documentType = "IJAZAH";
      
      if (openAiKey) {
        try {
          const ijazahResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openAiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [{
                role: 'system',
                content: `Extract structured data from Indonesian IJAZAH (diploma/certificate) document. Return JSON with these fields:
                
- nomor_ijazah: Certificate/diploma number
- nama: Full name of the graduate
- tempat_lahir: Place of birth
- tanggal_lahir: Date of birth (yyyy-MM-dd format)
- nama_sekolah: School/institution name
- jenjang: Education level (SD/SMP/SMA/SMK/D3/S1/S2/S3)
- jurusan: Major/department/program
- program_studi: Study program (for university)
- fakultas: Faculty (for university)
- tahun_lulus: Graduation year
- tanggal_lulus: Graduation date (yyyy-MM-dd format)
- nomor_peserta_ujian: Exam participant number (if available)
- nisn: National Student ID Number (if available)
- gelar: Academic degree (if available)
- ipk: GPA (if available)
- akreditasi: Accreditation status (if available)
- nomor_seri_ijazah: Serial number of certificate (if available)
- kepala_sekolah: Principal/Rector name (if available)
- tanggal_terbit: Issue date (yyyy-MM-dd format)

Use null for missing fields. Extract all available information.`
              }, {
                role: 'user',
                content: `OCR Text from IJAZAH document:\n${rawText}`
              }],
              temperature: 0,
              response_format: { type: "json_object" }
            }),
          });

          if (ijazahResponse.ok) {
            const ijazahData = await ijazahResponse.json();
            const content = ijazahData.choices?.[0]?.message?.content;
            if (content) {
              try {
                structuredData = JSON.parse(content);
                console.log(`IJAZAH Extractor extracted ${Object.keys(structuredData).length} fields`);
                console.log("IJAZAH data:", JSON.stringify(structuredData, null, 2));
              } catch (e) {
                console.error("Failed to parse IJAZAH OpenAI response:", e);
              }
            }
          }
        } catch (ijazahError) {
          console.error("IJAZAH Extractor error:", ijazahError);
        }
      }
      
      // Fallback: regex extraction for IJAZAH
      if (Object.keys(structuredData).length === 0) {
        console.log("Using regex fallback for IJAZAH extraction...");
        structuredData = extractIjazahWithRegex(rawText);
      }
      
      // Return IJAZAH result
      return new Response(
        JSON.stringify({
          success: true,
          ocr_engine: ocrEngine + "_ijazah_extractor",
          jenis_dokumen: "IJAZAH",
          data: structuredData,
          raw_text: rawText,
          clean_text: rawText,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }
    
    // ========================================
    // KK DOCUMENT PROCESSING
    // ========================================
    if (isKKDocument) {
      console.log("Detected KK document, using KK Full Extractor...");
      
      try {
        const kkResponse = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/supabase-functions-kk-full-extractor`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
            },
            body: JSON.stringify({ ocr_text: rawText }),
          }
        );

        if (kkResponse.ok) {
          const kkData = await kkResponse.json();
          if (kkData.success && kkData.data) {
            console.log("KK Full Extractor successful");
            return new Response(
              JSON.stringify({
                success: true,
                ocr_engine: ocrEngine + "_kk_extractor",
                jenis_dokumen: "KK",
                data: kkData.data,
                raw_text: rawText,
                clean_text: rawText,
              }),
              {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
              }
            );
          }
        }
        console.log("KK Full Extractor failed, falling back to generic extraction...");
      } catch (kkError) {
        console.error("KK Full Extractor error:", kkError);
      }
    }

    // ========================================
    // UDFM ULTRA: UNIVERSAL DOCUMENT EXTRACTION
    // Supports: KTP, KK, IJAZAH, NPWP, SIM, STNK, PAJAK_KENDARAAN, AWB, INVOICE, CV, BPJS, AKTA_LAHIR, etc.
    // ========================================
    if (openAiKey && Object.keys(structuredData).length === 0) {
      console.log(`UDFM ULTRA: Using OpenAI for ${documentType} extraction...`);
      
      // Build extraction prompt based on document type
      const extractionPrompts: Record<string, string> = {
        "KTP": `Extract from Indonesian KTP (ID Card):
- nik: 16-digit NIK number
- nama: Full name
- tempat_lahir: Place of birth
- tanggal_lahir: Date of birth (yyyy-MM-dd)
- jenis_kelamin: Gender (LAKI-LAKI/PEREMPUAN)
- alamat: Full address
- rt_rw: RT/RW
- kelurahan_desa: Village/Kelurahan
- kecamatan: District
- kabupaten_kota: City/Regency
- provinsi: Province
- agama: Religion
- status_perkawinan: Marital status
- pekerjaan: Occupation
- kewarganegaraan: Nationality
- berlaku_hingga: Valid until date
- golongan_darah: Blood type`,

        "KK": `Extract from Indonesian KK (Family Card):
- nomor_kk: 16-digit KK number
- nama_kepala_keluarga: Head of family name
- alamat: Full address
- rt_rw: RT/RW
- kelurahan_desa: Village/Kelurahan
- kecamatan: District
- kabupaten_kota: City/Regency
- provinsi: Province
- kode_pos: Postal code
- tanggal_dikeluarkan: Issue date
- anggota_keluarga: Array of family members with {nama, nik, jenis_kelamin, tempat_lahir, tanggal_lahir, agama, pendidikan, pekerjaan, status_perkawinan, hubungan_keluarga}`,

        "IJAZAH": `Extract from Indonesian IJAZAH (Diploma/Certificate):
- nomor_ijazah: Certificate number
- nama: Graduate's full name
- tempat_lahir: Place of birth
- tanggal_lahir: Date of birth (yyyy-MM-dd)
- nama_sekolah: School/institution name
- jenjang: Education level (SD/SMP/SMA/SMK/D3/S1/S2/S3)
- jurusan: Major/department
- program_studi: Study program
- fakultas: Faculty
- tahun_lulus: Graduation year
- tanggal_lulus: Graduation date (yyyy-MM-dd)
- nomor_peserta_ujian: Exam participant number
- nisn: National Student ID
- gelar: Academic degree
- ipk: GPA
- akreditasi: Accreditation
- nomor_seri_ijazah: Serial number
- kepala_sekolah: Principal/Rector name`,

        "NPWP": `Extract from Indonesian NPWP (Tax ID):
- nomor_npwp: NPWP number (15 digits with dots)
- nama: Taxpayer name
- alamat: Address
- kelurahan: Village
- kecamatan: District
- kota: City
- provinsi: Province
- tanggal_terdaftar: Registration date
- kpp: Tax office name`,

        "SIM": `Extract from Indonesian SIM (Driving License):
- nomor_sim: SIM number
- nama: Full name
- tempat_lahir: Place of birth
- tanggal_lahir: Date of birth (yyyy-MM-dd)
- alamat: Address
- golongan_sim: SIM class (A/B1/B2/C/D)
- berlaku_hingga: Valid until date
- tinggi_badan: Height
- golongan_darah: Blood type
- pekerjaan: Occupation`,

        "STNK": `Extract from Indonesian STNK (Vehicle Registration):
- nomor_polisi: License plate number
- nama_pemilik: Owner name
- alamat: Address
- merk: Vehicle brand
- tipe: Vehicle type
- jenis: Vehicle category
- model: Vehicle model
- tahun_pembuatan: Year of manufacture
- warna: Color
- nomor_rangka: Chassis number
- nomor_mesin: Engine number
- bahan_bakar: Fuel type
- isi_silinder: Engine capacity
- masa_berlaku: Valid until`,

        "PAJAK_KENDARAAN": `Extract from Indonesian PKB (Vehicle Tax):
- nomor_polisi: License plate
- nama_pemilik: Owner name
- alamat: Address
- merk: Vehicle brand
- tipe: Vehicle type
- tahun: Year
- warna: Color
- nomor_rangka: Chassis number
- nomor_mesin: Engine number
- pkb_pokok: Main tax amount
- swdkllj: Insurance fee
- total_bayar: Total payment
- tanggal_bayar: Payment date
- masa_berlaku: Valid until`,

        "AWB": `Extract from Air Waybill:
- awb_number: AWB number
- shipper_name: Shipper name
- shipper_address: Shipper address
- consignee_name: Consignee name
- consignee_address: Consignee address
- origin: Origin airport/city
- destination: Destination airport/city
- pieces: Number of pieces
- weight: Weight
- description: Goods description
- declared_value: Declared value
- flight_number: Flight number
- flight_date: Flight date`,

        "INVOICE": `Extract from Invoice/Faktur:
- nomor_invoice: Invoice number
- tanggal_invoice: Invoice date
- nama_penjual: Seller name
- alamat_penjual: Seller address
- npwp_penjual: Seller NPWP
- nama_pembeli: Buyer name
- alamat_pembeli: Buyer address
- npwp_pembeli: Buyer NPWP
- items: Array of {nama_barang, quantity, harga_satuan, jumlah}
- subtotal: Subtotal
- ppn: VAT amount
- total: Total amount
- tanggal_jatuh_tempo: Due date`,

        "CV": `Extract from Curriculum Vitae:
- nama: Full name
- tempat_lahir: Place of birth
- tanggal_lahir: Date of birth
- alamat: Address
- email: Email
- telepon: Phone number
- pendidikan: Array of {institusi, jurusan, tahun_lulus, gelar}
- pengalaman_kerja: Array of {perusahaan, posisi, tahun_mulai, tahun_selesai, deskripsi}
- keahlian: Array of skills
- bahasa: Array of languages
- sertifikasi: Array of certifications`,

        "BPJS": `Extract from BPJS Card:
- nomor_bpjs: BPJS number
- nama: Full name
- nik: NIK
- tanggal_lahir: Date of birth
- jenis_kelamin: Gender
- kelas: Class
- faskes_tingkat_1: Primary healthcare facility
- tanggal_berlaku: Valid from date`,

        "AKTA_LAHIR": `Extract from Birth Certificate:
- nomor_akta: Certificate number
- nama: Full name
- tempat_lahir: Place of birth
- tanggal_lahir: Date of birth
- jenis_kelamin: Gender
- nama_ayah: Father's name
- nama_ibu: Mother's name
- tanggal_terbit: Issue date
- tempat_terbit: Place of issue`,

        "UNKNOWN": `Extract all identifiable fields from this document. Common fields:
- nama: Name
- nomor: Any ID number
- tanggal: Any date
- alamat: Address
- Any other relevant fields found`
      };
      
      const extractionPrompt = extractionPrompts[documentType] || extractionPrompts["UNKNOWN"];
      
      try {
        const extractResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{
              role: 'system',
              content: `You are UDFM ULTRA - Universal Document Field Mapper. Extract structured data from Indonesian documents.

${extractionPrompt}

RULES:
1. Return valid JSON only
2. Use null for missing fields
3. Dates must be in yyyy-MM-dd format
4. Numbers should be strings to preserve formatting
5. Extract ALL available information
6. For arrays, include all items found`
            }, {
              role: 'user',
              content: `Document Type: ${documentType}\n\nOCR Text:\n${rawText}`
            }],
            temperature: 0,
            response_format: { type: "json_object" }
          }),
        });

        if (extractResponse.ok) {
          const extractData = await extractResponse.json();
          const content = extractData.choices?.[0]?.message?.content;
          if (content) {
            try {
              structuredData = JSON.parse(content);
              console.log(`UDFM ULTRA: Extracted ${Object.keys(structuredData).length} fields for ${documentType}`);
            } catch (e) {
              console.error("Failed to parse UDFM ULTRA response:", e);
            }
          }
        }
      } catch (openAiError) {
        console.error("UDFM ULTRA OpenAI error:", openAiError);
      }
    }

    // Final fallback: regex extraction for KK
    if (Object.keys(structuredData).length === 0 && (document_type_hint?.toUpperCase() === "KK" || documentType === "KK")) {
      console.log("Using regex fallback for KK extraction...");
      structuredData = extractKKWithRegex(rawText);
      documentType = "KK";
    }

    console.log("Extraction complete");
    console.log(`Final document type: ${documentType}`);
    console.log(`Final structured data keys: ${Object.keys(structuredData).join(", ")}`);

    // Return final output
    return new Response(
      JSON.stringify({
        success: true,
        ocr_engine: ocrEngine,
        jenis_dokumen: documentType,
        data: structuredData,
        raw_text: rawText,
        clean_text: cleanText,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Hybrid OCR Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Unknown error occurred",
        ocr_engine: "error",
        jenis_dokumen: "unknown",
        data: {},
        raw_text: "",
        clean_text: "",
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200, // Return 200 so frontend can handle gracefully
      }
    );
  }
});

// Direct Google Vision API call
async function tryDirectGoogleVision(imageUrl: string): Promise<string> {
  const googleApiKey = Deno.env.get("GOOGLE_VISION_API_KEY");
  
  if (!googleApiKey) {
    console.log("Google Vision API key not found");
    return "";
  }

  try {
    console.log("Fetching image for Google Vision...");
    
    // Fetch the image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      console.error(`Failed to fetch image: ${imageResponse.status}`);
      return "";
    }
    
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = btoa(
      new Uint8Array(imageBuffer).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ""
      )
    );

    console.log(`Image fetched, base64 length: ${base64Image.length}`);

    // Call Google Vision API
    const visionResponse = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${googleApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: [
            {
              image: { content: base64Image },
              features: [
                { type: "DOCUMENT_TEXT_DETECTION", maxResults: 1 }
              ],
            },
          ],
        }),
      }
    );

    if (!visionResponse.ok) {
      const errorText = await visionResponse.text();
      console.error("Google Vision API error:", errorText);
      return "";
    }

    const visionData = await visionResponse.json();
    const fullText = visionData.responses?.[0]?.fullTextAnnotation?.text || "";
    
    console.log(`Google Vision direct extracted ${fullText.length} characters`);
    return fullText;
  } catch (error) {
    console.error("Direct Google Vision error:", error);
    return "";
  }
}

// Regex fallback for KK extraction
function extractKKWithRegex(text: string): Record<string, string | null> {
  const data: Record<string, string | null> = {
    nomor_kk: null,
    nama_kepala_keluarga: null,
    alamat: null,
    rt_rw: null,
    kelurahan_desa: null,
    kecamatan: null,
    kabupaten_kota: null,
    provinsi: null,
    kode_pos: null,
  };

  // Extract nomor_kk (16 digits)
  const kkMatch = text.match(/(?:No\.?\s*(?:KK)?:?\s*)?(\d{16})/i);
  if (kkMatch) {
    data.nomor_kk = kkMatch[1];
  }

  // Extract RT/RW
  const rtRwMatch = text.match(/(?:RT\s*\/?\s*RW\s*:?\s*)?(\d{3})\s*\/\s*(\d{3})/i);
  if (rtRwMatch) {
    data.rt_rw = `${rtRwMatch[1]}/${rtRwMatch[2]}`;
  }

  // Extract kode pos (5 digits)
  const kodePosMatch = text.match(/\b(\d{5})\b/);
  if (kodePosMatch) {
    data.kode_pos = kodePosMatch[1];
  }

  // Common Jakarta areas
  const jakartaAreas = ["JAKARTA PUSAT", "JAKARTA SELATAN", "JAKARTA BARAT", "JAKARTA TIMUR", "JAKARTA UTARA"];
  for (const area of jakartaAreas) {
    if (text.toUpperCase().includes(area)) {
      data.kabupaten_kota = area;
      data.provinsi = "DKI JAKARTA";
      break;
    }
  }

  // Extract kelurahan/kecamatan patterns
  const kelurahanMatch = text.match(/(?:KEL(?:URAHAN)?\.?\s*:?\s*)([A-Z\s]+)/i);
  if (kelurahanMatch) {
    data.kelurahan_desa = kelurahanMatch[1].trim();
  }

  const kecamatanMatch = text.match(/(?:KEC(?:AMATAN)?\.?\s*:?\s*)([A-Z\s]+)/i);
  if (kecamatanMatch) {
    data.kecamatan = kecamatanMatch[1].trim();
  }

  // Try to extract nama kepala keluarga
  const namaMatch = text.match(/(?:Nama\s*Kepala\s*Keluarga\s*:?\s*)([A-Z\s]+)/i);
  if (namaMatch) {
    data.nama_kepala_keluarga = namaMatch[1].trim();
  }

  // Try to extract alamat
  const alamatMatch = text.match(/(?:Alamat\s*:?\s*)([^\n]+)/i);
  if (alamatMatch) {
    data.alamat = alamatMatch[1].trim();
  }

  return data;
}

// IJAZAH Regex Extraction Fallback
function extractIjazahWithRegex(text: string): Record<string, unknown> {
  const data: Record<string, unknown> = {
    nomor_ijazah: null,
    nama: null,
    tempat_lahir: null,
    tanggal_lahir: null,
    nama_sekolah: null,
    jenjang: null,
    jurusan: null,
    program_studi: null,
    fakultas: null,
    tahun_lulus: null,
    tanggal_lulus: null,
    nomor_peserta_ujian: null,
    nisn: null,
    gelar: null,
    ipk: null,
    akreditasi: null,
    nomor_seri_ijazah: null,
    kepala_sekolah: null,
    tanggal_terbit: null,
  };

  const upperText = text.toUpperCase();

  // Extract nomor ijazah
  const nomorIjazahMatch = text.match(/(?:NO(?:MOR)?\.?\s*IJAZAH\s*:?\s*)([A-Z0-9\-\/\.]+)/i);
  if (nomorIjazahMatch) {
    data.nomor_ijazah = nomorIjazahMatch[1].trim();
  }

  // Extract nama
  const namaMatch = text.match(/(?:NAMA\s*:?\s*)([A-Z\s\.]+)/i);
  if (namaMatch) {
    data.nama = namaMatch[1].trim();
  }

  // Extract tempat lahir
  const tempatLahirMatch = text.match(/(?:TEMPAT\s*(?:DAN\s*)?(?:TANGGAL\s*)?LAHIR\s*:?\s*)([A-Z\s]+)/i);
  if (tempatLahirMatch) {
    data.tempat_lahir = tempatLahirMatch[1].trim().split(/[,\/]/)[0].trim();
  }

  // Extract tanggal lahir
  const tanggalLahirMatch = text.match(/(\d{1,2})\s*(?:JANUARI|FEBRUARI|MARET|APRIL|MEI|JUNI|JULI|AGUSTUS|SEPTEMBER|OKTOBER|NOVEMBER|DESEMBER)\s*(\d{4})/i);
  if (tanggalLahirMatch) {
    const months: Record<string, string> = {
      'JANUARI': '01', 'FEBRUARI': '02', 'MARET': '03', 'APRIL': '04',
      'MEI': '05', 'JUNI': '06', 'JULI': '07', 'AGUSTUS': '08',
      'SEPTEMBER': '09', 'OKTOBER': '10', 'NOVEMBER': '11', 'DESEMBER': '12'
    };
    const monthMatch = text.match(/JANUARI|FEBRUARI|MARET|APRIL|MEI|JUNI|JULI|AGUSTUS|SEPTEMBER|OKTOBER|NOVEMBER|DESEMBER/i);
    if (monthMatch) {
      const month = months[monthMatch[0].toUpperCase()];
      const day = tanggalLahirMatch[1].padStart(2, '0');
      const year = tanggalLahirMatch[2];
      data.tanggal_lahir = `${year}-${month}-${day}`;
    }
  }

  // Extract nama sekolah
  const sekolahPatterns = [
    /(?:SMA|SMK|SMP|SD|SEKOLAH)\s*(?:NEGERI|SWASTA)?\s*\d*\s*([A-Z\s]+)/i,
    /(?:UNIVERSITAS|INSTITUT|POLITEKNIK|AKADEMI)\s*([A-Z\s]+)/i,
  ];
  for (const pattern of sekolahPatterns) {
    const match = text.match(pattern);
    if (match) {
      data.nama_sekolah = match[0].trim();
      break;
    }
  }

  // Extract jenjang
  if (upperText.includes("SMA") || upperText.includes("SEKOLAH MENENGAH ATAS")) {
    data.jenjang = "SMA";
  } else if (upperText.includes("SMK") || upperText.includes("SEKOLAH MENENGAH KEJURUAN")) {
    data.jenjang = "SMK";
  } else if (upperText.includes("SMP") || upperText.includes("SEKOLAH MENENGAH PERTAMA")) {
    data.jenjang = "SMP";
  } else if (upperText.includes("SD") || upperText.includes("SEKOLAH DASAR")) {
    data.jenjang = "SD";
  } else if (upperText.includes("SARJANA") || upperText.includes("S1")) {
    data.jenjang = "S1";
  } else if (upperText.includes("MAGISTER") || upperText.includes("S2")) {
    data.jenjang = "S2";
  } else if (upperText.includes("DOKTOR") || upperText.includes("S3")) {
    data.jenjang = "S3";
  } else if (upperText.includes("DIPLOMA") || upperText.includes("D3")) {
    data.jenjang = "D3";
  } else if (upperText.includes("D4")) {
    data.jenjang = "D4";
  }

  // Extract jurusan
  const jurusanMatch = text.match(/(?:JURUSAN|PROGRAM\s*STUDI|PRODI)\s*:?\s*([A-Z\s]+)/i);
  if (jurusanMatch) {
    data.jurusan = jurusanMatch[1].trim();
    data.program_studi = jurusanMatch[1].trim();
  }

  // Extract fakultas
  const fakultasMatch = text.match(/(?:FAKULTAS)\s*:?\s*([A-Z\s]+)/i);
  if (fakultasMatch) {
    data.fakultas = fakultasMatch[1].trim();
  }

  // Extract tahun lulus
  const tahunLulusMatch = text.match(/(?:TAHUN\s*(?:PELAJARAN|AJARAN|LULUS)?\s*:?\s*)(\d{4})/i);
  if (tahunLulusMatch) {
    data.tahun_lulus = tahunLulusMatch[1];
  } else {
    // Try to find any 4-digit year between 2000-2030
    const yearMatch = text.match(/\b(20[0-3]\d)\b/);
    if (yearMatch) {
      data.tahun_lulus = yearMatch[1];
    }
  }

  // Extract NISN
  const nisnMatch = text.match(/(?:NISN\s*:?\s*)(\d{10})/i);
  if (nisnMatch) {
    data.nisn = nisnMatch[1];
  }

  // Extract nomor peserta ujian
  const noPesertaMatch = text.match(/(?:NO(?:MOR)?\.?\s*PESERTA\s*(?:UJIAN)?\s*:?\s*)([A-Z0-9\-]+)/i);
  if (noPesertaMatch) {
    data.nomor_peserta_ujian = noPesertaMatch[1].trim();
  }

  // Extract gelar
  const gelarMatch = text.match(/(?:GELAR|DEGREE)\s*:?\s*([A-Z\.\s]+)/i);
  if (gelarMatch) {
    data.gelar = gelarMatch[1].trim();
  }

  // Extract IPK
  const ipkMatch = text.match(/(?:IPK|GPA|INDEKS\s*PRESTASI)\s*:?\s*([\d,\.]+)/i);
  if (ipkMatch) {
    data.ipk = ipkMatch[1].trim();
  }

  // Extract akreditasi
  const akreditasiMatch = text.match(/(?:AKREDITASI)\s*:?\s*([A-Z])/i);
  if (akreditasiMatch) {
    data.akreditasi = akreditasiMatch[1].trim();
  }

  // Extract kepala sekolah/rektor
  const kepalaMatch = text.match(/(?:KEPALA\s*SEKOLAH|REKTOR|DEKAN)\s*:?\s*([A-Z\s\.]+)/i);
  if (kepalaMatch) {
    data.kepala_sekolah = kepalaMatch[1].trim();
  }

  // Extract nomor seri ijazah
  const seriMatch = text.match(/(?:NO(?:MOR)?\.?\s*SERI\s*:?\s*)([A-Z0-9\-\/\.]+)/i);
  if (seriMatch) {
    data.nomor_seri_ijazah = seriMatch[1].trim();
  }

  return data;
}

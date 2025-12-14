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

    let rawText = "";
    let ocrEngine = "";

    // Step 1: Detect file type and route to appropriate OCR engine
    const mimeType = file_type || "image/jpeg";
    
    if (mimeType === "application/pdf") {
      // Use Tesseract OCR for PDF files
      ocrEngine = "tesseract";
      
      console.log("Using Tesseract OCR for PDF file");
      
      const ocrResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/supabase-functions-tesseract-ocr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
        },
        body: JSON.stringify({ pdf_url: image_url }),
      });

      if (!ocrResponse.ok) {
        throw new Error(`Tesseract OCR failed: ${await ocrResponse.text()}`);
      }

      const ocrData = await ocrResponse.json();
      rawText = ocrData.text || "";
      
    } else if (["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(mimeType)) {
      // Use Google Vision OCR for image files
      ocrEngine = "google_vision";
      
      console.log("Using Google Vision OCR for image file");
      
      const ocrResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/supabase-functions-vision-google-ocr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
        },
        body: JSON.stringify({ image_url }),
      });

      if (!ocrResponse.ok) {
        throw new Error(`Google Vision OCR failed: ${await ocrResponse.text()}`);
      }

      const ocrData = await ocrResponse.json();
      rawText = ocrData.text || "";
      
    } else {
      throw new Error(`Unsupported file type: ${mimeType}. Supported types: JPEG, PNG, WEBP, PDF`);
    }

    // Step 2: Clean and standardize text using OpenAI
    const cleanResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPEN_AI_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'system',
          content: 'You are an expert at cleaning and standardizing Indonesian document text. Remove noise, fix line breaks, standardize dates to yyyy-MM-dd format, and clean currency values to integers.'
        }, {
          role: 'user',
          content: `Clean and standardize this OCR text:\n\n${rawText}`
        }],
        temperature: 0.1,
      }),
    });

    const cleanData = await cleanResponse.json();
    const cleanedText = cleanData.choices[0].message.content;

    // Step 3: Identify document type
    const identifyResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPEN_AI_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'system',
          content: 'Identify the Indonesian document type from: KTP, KK, NPWP, SIM, STNK, IJAZAH, PAJAK_KENDARAAN. Return only the document type in uppercase.'
        }, {
          role: 'user',
          content: cleanedText
        }],
        temperature: 0,
      }),
    });

    const identifyData = await identifyResponse.json();
    const documentType = identifyData.choices[0].message.content.trim();

    // Step 4: Extract structured data based on document type
    const templates = {
      KTP: {
        nik: "string",
        nama: "string",
        tempat_lahir: "string",
        tanggal_lahir: "date",
        jenis_kelamin: "string",
        alamat: "string",
        rt_rw: "string",
        kelurahan_desa: "string",
        kecamatan: "string",
        agama: "string",
        status_perkawinan: "string",
        pekerjaan: "string",
        kewarganegaraan: "string",
        berlaku_hingga: "string",
        provinsi: "string",
        kabupaten_kota: "string",
        golongan_darah: "string"
      },
      KK: {
        nomor_kk: "string",
        nama_kepala_keluarga: "string",
        alamat: "string",
        rt_rw: "string",
        kelurahan_desa: "string",
        kecamatan: "string",
        kabupaten_kota: "string",
        provinsi: "string",
        kode_pos: "string",
        anggota_keluarga: "array"
      },
      NPWP: {
        npwp: "string",
        nama: "string",
        nik: "string",
        alamat: "string",
        kelurahan_desa: "string",
        kecamatan: "string",
        kabupaten_kota: "string",
        provinsi: "string",
        kode_pos: "string"
      },
      SIM: {
        nomor_sim: "string",
        nama: "string",
        tempat_lahir: "string",
        tanggal_lahir: "date",
        jenis_kelamin: "string",
        alamat: "string",
        pekerjaan: "string",
        golongan_darah: "string",
        jenis_sim: "string",
        berlaku_hingga: "date",
        tanggal_terbit: "date"
      },
      STNK: {
        nomor_registrasi: "string",
        nomor_rangka: "string",
        nomor_mesin: "string",
        nomor_polisi: "string",
        merk: "string",
        tipe: "string",
        jenis: "string",
        model: "string",
        tahun_pembuatan: "string",
        warna: "string",
        bahan_bakar: "string",
        nama_pemilik: "string",
        alamat_pemilik: "string",
        berlaku_hingga: "date"
      },
      IJAZAH: {
        nomor_ijazah: "string",
        nama: "string",
        tempat_lahir: "string",
        tanggal_lahir: "date",
        nama_sekolah: "string",
        jenjang: "string",
        jurusan: "string",
        tahun_lulus: "string",
        tanggal_lulus: "date",
        nomor_peserta_ujian: "string"
      },
      PAJAK_KENDARAAN: {
        nomor_polisi: "string",
        nomor_rangka: "string",
        nomor_mesin: "string",
        nama_pemilik: "string",
        alamat: "string",
        merk: "string",
        tipe: "string",
        tahun: "string",
        warna: "string",
        pokok_pkb: "number",
        denda_pkb: "number",
        swdkllj: "number",
        total_pajak: "number",
        berlaku_hingga: "date",
        tanggal_bayar: "date"
      }
    };

    const template = templates[documentType as keyof typeof templates] || {};

    const extractResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPEN_AI_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'system',
          content: `Extract data from Indonesian ${documentType} document. Return ONLY valid JSON matching this template: ${JSON.stringify(template)}. Use null for missing fields. Dates must be yyyy-MM-dd format. Numbers must be integers without currency symbols.`
        }, {
          role: 'user',
          content: cleanedText
        }],
        temperature: 0,
      }),
    });

    const extractData = await extractResponse.json();
    let structuredData = {};
    
    try {
      const content = extractData.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      structuredData = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch (e) {
      console.error("Failed to parse structured data:", e);
    }

    return new Response(
      JSON.stringify({
        success: true,
        ocr_engine: ocrEngine,
        jenis_dokumen: documentType,
        data: structuredData,
        raw_text: rawText,
        clean_text: cleanedText,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Universal OCR Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

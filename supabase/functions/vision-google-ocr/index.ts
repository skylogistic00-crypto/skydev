import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function convertDateToISO(dateStr: string): string | null {
  // Strict date parsing - only accept valid date formats with 4-digit year
  // dd/mm/yyyy or dd-mm-yyyy
  const ddmmyyyyMatch = dateStr.match(/\b([0-3]?\d)[\/-]([0-1]?\d)[\/-](\d{4})\b/);
  if (ddmmyyyyMatch) {
    const [, day, month, year] = ddmmyyyyMatch;
    const d = parseInt(day);
    const m = parseInt(month);
    const y = parseInt(year);
    
    // Validate date ranges
    if (d >= 1 && d <= 31 && m >= 1 && m <= 12 && y >= 1900 && y <= 2100) {
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }
  
  // yyyy-mm-dd or yyyy/mm/dd
  const yyyymmddMatch = dateStr.match(/\b(\d{4})[\/-]([0-1]?\d)[\/-]([0-3]?\d)\b/);
  if (yyyymmddMatch) {
    const [, year, month, day] = yyyymmddMatch;
    const d = parseInt(day);
    const m = parseInt(month);
    const y = parseInt(year);
    
    // Validate date ranges
    if (d >= 1 && d <= 31 && m >= 1 && m <= 12 && y >= 1900 && y <= 2100) {
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }
  
  return null;
}

interface AutofillData {
  nominal: number | null;
  tanggal: string | null;
  supplier: string | null;
  invoice: string | null;
  nama_karyawan: string | null;
  deskripsi: string | null;
}

interface SalarySlipData {
  is_salary_slip: boolean;
  employee_name: string | null;
  employee_number: string | null;
  bank_name: string | null;
  suggested_debit_account: string | null;
  suggested_credit_account: string | null;
}

interface KTPData {
  type: "KTP";
  nik: string;
  nama: string;
  tempat_tgl_lahir: string;
  jenis_kelamin: string;
  golongan_darah: string;
  alamat: string;
  rt_rw: string;
  kel_desa: string;
  kecamatan: string;
  agama: string;
  status_perkawinan: string;
  pekerjaan: string;
  kewarganegaraan: string;
  berlaku_hingga: string;
}

function extractFinancialData(text: string): AutofillData {
  const result: AutofillData = {
    nominal: null,
    tanggal: null,
    supplier: null,
    invoice: null,
    nama_karyawan: null,
    deskripsi: null,
  };

  // Extract nominal (currency amounts) - Find the HIGHEST value
  // Priority 1: Look for GAJI BERSIH / TAKE HOME PAY (for salary slips)
  const gajiBersihMatch = text.match(/(?:GAJI\s+BERSIH|TAKE\s+HOME\s+PAY)[:\s]*(?:Rp\.?\s*)?([0-9.,]+)/i);
  if (gajiBersihMatch) {
    const numStr = gajiBersihMatch[1].replace(/[^0-9]/g, '');
    const num = parseFloat(numStr);
    if (!isNaN(num) && num > 0) {
      result.nominal = num;
    }
  }
  
  // Priority 2: Look for HARGA JUAL (selling price)
  if (!result.nominal) {
    const hargaJualMatch = text.match(/HARGA\s+JUAL[:\s]*([\d.,]+)/i);
    if (hargaJualMatch) {
      const numStr = hargaJualMatch[1].replace(/[^\d]/g, '');
      const num = parseFloat(numStr);
      if (!isNaN(num) && num > 0) {
        result.nominal = num;
      }
    }
  }
  
  // If no HARGA JUAL found, extract all numbers and find the highest
  if (!result.nominal) {
    const nominalPatterns = [
      /(?:Rp\.?|IDR)\s*([\d.,]+)/gi,
      /(?:Total|Jumlah|Amount|Grand Total|Sub Total)[:\s]*([\d.,]+)/gi,
      /([\d.,]+)\s*(?:Rupiah|IDR)/gi,
      // Generic number pattern with thousand separators
      /\b([\d]{1,3}(?:[.,][\d]{3})+)\b/g,
    ];
    
    let allNominals: number[] = [];
    for (const pattern of nominalPatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const numStr = match[1] ? match[1].replace(/[^\d]/g, '') : match[0].replace(/[^\d]/g, '');
        const num = parseFloat(numStr);
        if (!isNaN(num) && num > 0) {
          allNominals.push(num);
        }
      }
    }
    
    // Set the highest nominal value
    if (allNominals.length > 0) {
      result.nominal = Math.max(...allNominals);
    }
  }

  // Extract date (tanggal) - STRICT PARSING ONLY
  // Only accept dates with 4-digit year to avoid false positives like "1/9-10"
  const datePatterns = [
    // dd/mm/yyyy or dd-mm-yyyy (with 4-digit year)
    /\b([0-3]?\d)[\/\-]([0-1]?\d)[\/\-](\d{4})\b/g,
    // yyyy-mm-dd or yyyy/mm/dd (with 4-digit year)
    /\b(\d{4})[\/\-]([0-1]?\d)[\/\-]([0-3]?\d)\b/g,
    // Date with month name and 4-digit year
    /\b(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\s+(\d{4})\b/gi,
  ];
  
  for (const pattern of datePatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const dateStr = match[0].trim();
      const converted = convertDateToISO(dateStr);
      if (converted) {
        result.tanggal = converted;
        break;
      }
    }
    if (result.tanggal) break;
  }

  // Extract supplier
  const supplierPatterns = [
    /(?:Supplier|Vendor|From|Dari|PT\.|CV\.)[:\s]*([A-Za-z\s\.]+)/gi,
    /(?:PT|CV|UD|Toko)\s+([A-Za-z\s]+)/gi,
  ];
  
  for (const pattern of supplierPatterns) {
    const match = text.match(pattern);
    if (match) {
      result.supplier = match[0].trim().substring(0, 100);
      break;
    }
  }

  // Extract invoice number
  const invoicePatterns = [
    /(?:Invoice|Inv|No\.?|Nomor|Faktur)[:\s#]*([A-Za-z0-9\-\/]+)/gi,
    /(?:Receipt|Kwitansi|Nota)[:\s#]*([A-Za-z0-9\-\/]+)/gi,
  ];
  
  for (const pattern of invoicePatterns) {
    const match = text.match(pattern);
    if (match) {
      result.invoice = match[0].replace(/(?:Invoice|Inv|No\.?|Nomor|Faktur|Receipt|Kwitansi|Nota)[:\s#]*/gi, '').trim();
      break;
    }
  }

  // Extract employee name (nama karyawan)
  const employeePatterns = [
    /(?:Nama|Name|Karyawan|Employee|Kasir|Cashier)[:\s]*([A-Za-z\s]+)/gi,
    /(?:Diterima oleh|Received by|Dibuat oleh|Created by)[:\s]*([A-Za-z\s]+)/gi,
  ];
  
  for (const pattern of employeePatterns) {
    const match = text.match(pattern);
    if (match) {
      result.nama_karyawan = match[0].replace(/(?:Nama|Name|Karyawan|Employee|Kasir|Cashier|Diterima oleh|Received by|Dibuat oleh|Created by)[:\s]*/gi, '').trim();
      break;
    }
  }

  // Extract description (deskripsi)
  const descPatterns = [
    /(?:Keterangan|Description|Deskripsi|Item|Barang)[:\s]*([^\n]+)/gi,
    /(?:Untuk|For)[:\s]*([^\n]+)/gi,
  ];
  
  for (const pattern of descPatterns) {
    const match = text.match(pattern);
    if (match) {
      result.deskripsi = match[0].replace(/(?:Keterangan|Description|Deskripsi|Item|Barang|Untuk|For)[:\s]*/gi, '').trim().substring(0, 255);
      break;
    }
  }

  if (!result.deskripsi && text.length > 0) {
    result.deskripsi = text.substring(0, 100).replace(/\n/g, ' ').trim();
  }

  return result;
}

function detectSalarySlip(text: string): SalarySlipData {
  const result: SalarySlipData = {
    is_salary_slip: false,
    employee_name: null,
    employee_number: null,
    bank_name: null,
    suggested_debit_account: null,
    suggested_credit_account: null,
  };

  // Check if document is a salary slip
  const salaryKeywords = [
    /SLIP\s+GAJI/i,
    /GAJI\s+KARYAWAN/i,
    /PAYROLL/i,
    /SALARY\s+SLIP/i,
    /GAJI\s+BERSIH/i,
    /TAKE\s+HOME\s+PAY/i,
    /PENDAPATAN/i,
    /POTONGAN/i,
  ];

  const isSalarySlip = salaryKeywords.some(pattern => pattern.test(text));
  
  if (!isSalarySlip) {
    return result;
  }

  result.is_salary_slip = true;
  result.suggested_debit_account = "6-1000"; // Beban Gaji & Karyawan

  // Extract employee name
  const namePatterns = [
    /(?:Nama|Name)[:\\s]*([A-Za-z\\s]+?)(?:\\n|Departemen|Department|Jabatan|Position)/i,
    /No\\.?\\s+Karyawan[:\\s]*[A-Z0-9]+[\\s\\n]+([A-Za-z\\s]+?)(?:\\n|Departemen)/i,
  ];

  for (const pattern of namePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      result.employee_name = match[1].trim();
      break;
    }
  }

  // Extract employee number
  const empNumberPatterns = [
    /(?:No\\.?\\s+Karyawan|Employee\\s+No|EMP)[:\\s]*([A-Z0-9]+)/i,
  ];

  for (const pattern of empNumberPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      result.employee_number = match[1].trim();
      break;
    }
  }

  // Extract bank name and map to account code
  const bankPatterns = [
    { pattern: /Bank[:\\s]*(Mandiri)/i, code: "1-1038" },
    { pattern: /Bank[:\\s]*(BCA)/i, code: "1-1200" },
    { pattern: /Bank[:\\s]*(BNI)/i, code: "1-1201" },
    { pattern: /Bank[:\\s]*(BRI)/i, code: "1-1202" },
  ];

  for (const { pattern, code } of bankPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      result.bank_name = match[1].trim();
      result.suggested_credit_account = code;
      break;
    }
  }

  return result;
}

function extractKTPData(text: string): KTPData {
  const result: KTPData = {
    type: "KTP",
    nik: "",
    nama: "",
    tempat_tgl_lahir: "",
    jenis_kelamin: "",
    golongan_darah: "",
    alamat: "",
    rt_rw: "",
    kel_desa: "",
    kecamatan: "",
    agama: "",
    status_perkawinan: "",
    pekerjaan: "",
    kewarganegaraan: "",
    berlaku_hingga: "",
  };

  const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);
  const upperText = text.toUpperCase();

  // Extract NIK (16 digits)
  const nikMatch = text.match(/\b(\d{16})\b/);
  if (nikMatch) {
    result.nik = nikMatch[1];
  }

  // Extract Nama (after NIK or "Nama" label)
  // Look for line after NIK that contains only letters and spaces
  const nikIndex = lines.findIndex(line => /\b\d{16}\b/.test(line));
  if (nikIndex >= 0 && nikIndex + 1 < lines.length) {
    const nextLine = lines[nikIndex + 1];
    // Check if it's a name (only letters, spaces, and common name chars)
    if (/^[A-Z\s\.]+$/.test(nextLine) && nextLine.length > 2 && !nextLine.includes("TEMPAT") && !nextLine.includes("LAHIR")) {
      result.nama = nextLine.trim();
    }
  }
  
  // Fallback: try pattern matching
  if (!result.nama) {
    const namaMatch = text.match(/(?:NAMA|NAME)[:\s]*([A-Z\s\.]+?)(?=\n|TEMPAT|TTL|LAHIR)/i);
    if (namaMatch && namaMatch[1].trim().length > 2) {
      result.nama = namaMatch[1].trim();
    }
  }

  // Extract Tempat/Tanggal Lahir
  // Look for pattern: CITY_NAME, DD-MM-YYYY
  const ttlMatch = text.match(/([A-Z\s]+),\s*(\d{2}[-\/]\d{2}[-\/]\d{4})/i);
  if (ttlMatch) {
    const dateISO = convertDateToISO(ttlMatch[2]);
    result.tempat_tgl_lahir = `${ttlMatch[1].trim()}, ${dateISO}`;
  }

  // Extract Jenis Kelamin
  if (upperText.includes("LAKI-LAKI")) {
    result.jenis_kelamin = "LAKI-LAKI";
  } else if (upperText.includes("PEREMPUAN")) {
    result.jenis_kelamin = "PEREMPUAN";
  }

  // Extract Golongan Darah
  // Look for single letter A, B, AB, O or with +/- after "Gol. Darah" or standalone
  const golDarahPatterns = [
    /(?:GOL\.?\s*DARAH|GOLONGAN\s*DARAH)[:\s]*([ABO]+[-+]?)/i,
    /\bGol\.\s*Darah\s*:\s*([ABO]+[-+]?)/i,
    /\b([ABO][-+]?)\b(?=\s*\n|\s*$)/  // Standalone blood type
  ];
  for (const pattern of golDarahPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      result.golongan_darah = match[1].trim();
      break;
    }
  }

  // Extract Alamat - look for line after "Alamat" label
  const alamatIndex = lines.findIndex(line => /^ALAMAT\s*:/i.test(line));
  if (alamatIndex >= 0) {
    // Get the content after "ALAMAT :"
    const alamatLine = lines[alamatIndex];
    const afterColon = alamatLine.split(/ALAMAT\s*:/i)[1];
    if (afterColon && afterColon.trim().length > 0) {
      result.alamat = afterColon.trim();
    } else if (alamatIndex + 1 < lines.length) {
      // Alamat might be on next line
      result.alamat = lines[alamatIndex + 1].trim();
    }
  }
  
  // Fallback alamat pattern
  if (!result.alamat) {
    const alamatMatch = text.match(/(?:ALAMAT)[:\s]*([^\n]+)/i);
    if (alamatMatch) {
      result.alamat = alamatMatch[1].trim();
    }
  }

  // Extract RT/RW
  const rtRwMatch = text.match(/(?:RT\/RW)[:\s]*(\d{3}\/\d{3})/i);
  if (rtRwMatch) {
    result.rt_rw = rtRwMatch[1];
  }

  // Extract Kel/Desa - look for line after "KEL/DESA" label
  const kelDesaIndex = lines.findIndex(line => /KEL\/DESA|KELURAHAN/i.test(line));
  if (kelDesaIndex >= 0) {
    const kelDesaLine = lines[kelDesaIndex];
    const afterLabel = kelDesaLine.split(/KEL\/DESA|KELURAHAN/i)[1];
    if (afterLabel && afterLabel.replace(/[:\s]/g, '').length > 0) {
      result.kel_desa = afterLabel.replace(/^[:\s]+/, '').trim();
    } else if (kelDesaIndex + 1 < lines.length) {
      // Might be on next line
      const nextLine = lines[kelDesaIndex + 1];
      if (!/KECAMATAN|AGAMA/i.test(nextLine)) {
        result.kel_desa = nextLine.trim();
      }
    }
  }

  // Extract Kecamatan - look for line after "KECAMATAN" label
  const kecamatanIndex = lines.findIndex(line => /^KECAMATAN/i.test(line));
  if (kecamatanIndex >= 0) {
    const kecamatanLine = lines[kecamatanIndex];
    const afterLabel = kecamatanLine.split(/KECAMATAN/i)[1];
    if (afterLabel && afterLabel.replace(/[:\s]/g, '').length > 0) {
      result.kecamatan = afterLabel.replace(/^[:\s]+/, '').trim();
    } else if (kecamatanIndex + 1 < lines.length) {
      // Might be on next line
      const nextLine = lines[kecamatanIndex + 1];
      if (!/AGAMA|ISLAM|KRISTEN/i.test(nextLine)) {
        result.kecamatan = nextLine.trim();
      }
    }
  }

  // Extract Agama
  const agamaList = ["ISLAM", "KRISTEN", "KATOLIK", "HINDU", "BUDDHA", "KONGHUCHU"];
  for (const agama of agamaList) {
    if (upperText.includes(agama)) {
      result.agama = agama;
      break;
    }
  }

  // Extract Status Perkawinan
  const statusList = ["BELUM KAWIN", "KAWIN", "CERAI HIDUP", "CERAI MATI"];
  for (const status of statusList) {
    if (upperText.includes(status)) {
      result.status_perkawinan = status;
      break;
    }
  }

  // Extract Pekerjaan
  const pekerjaanMatch = text.match(/(?:PEKERJAAN)[:\s]*([A-Z\s\/]+?)(?=\n|KEWARGANEGARAAN)/i);
  if (pekerjaanMatch) {
    result.pekerjaan = pekerjaanMatch[1].trim();
  }

  // Extract Kewarganegaraan
  if (upperText.includes("WNI")) {
    result.kewarganegaraan = "WNI";
  } else if (upperText.includes("WNA")) {
    result.kewarganegaraan = "WNA";
  }

  // Extract Berlaku Hingga
  if (upperText.includes("SEUMUR HIDUP")) {
    result.berlaku_hingga = "SEUMUR HIDUP";
  } else {
    const berlakuMatch = text.match(/(?:BERLAKU HINGGA)[:\s]*(\d{2}-\d{2}-\d{4})/i);
    if (berlakuMatch) {
      result.berlaku_hingga = convertDateToISO(berlakuMatch[1]);
    }
  }

  return result;
}

Deno.serve(async (req) => {
  // Handle CORS preflight - MUST return immediately with 200 OK
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS, status: 200 });
  }

  try {
    // Initialize Supabase client inside the handler
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const googleVisionApiKey = Deno.env.get("GOOGLE_VISION_API_KEY") || Deno.env.get("VITE_GOOGLE_VISION_API_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase credentials");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Supabase credentials not configured",
        }),
        {
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Log all available env vars for debugging (without values)
    console.log("Available env vars:", Object.keys(Deno.env.toObject()));
    console.log("GOOGLE_VISION_API_KEY present:", !!googleVisionApiKey);
    
    // Check API key first
    if (!googleVisionApiKey) {
      console.error("GOOGLE_VISION_API_KEY is not configured");
      return new Response(
        JSON.stringify({
          success: false,
          error: "GOOGLE_VISION_API_KEY is not configured. Please set it in your Supabase project environment variables.",
          hint: "Go to Supabase Dashboard > Project Settings > Edge Functions > Add GOOGLE_VISION_API_KEY",
          availableEnvVars: Object.keys(Deno.env.toObject()).filter(k => !k.includes("KEY") && !k.includes("SECRET"))
        }),
        {
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Parse request body with proper error handling
    const rawBody = await req.text();
    console.log("Raw request body length:", rawBody.length);
    
    if (!rawBody || rawBody.trim() === "") {
      console.error("Empty request body received");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Empty request body. Please provide file_base64 or signedUrl.",
        }),
        {
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    let requestBody;
    try {
      requestBody = JSON.parse(rawBody);
    } catch (parseErr) {
      console.error("Failed to parse request body:", parseErr);
      console.error("Raw body preview:", rawBody.substring(0, 100));
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid JSON in request body",
          details: parseErr.message,
        }),
        {
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    const { file_base64, signedUrl, image_url } = requestBody;
    
    // Support both signedUrl and image_url parameter names
    const imageUrl = signedUrl || image_url;

    if (!file_base64 && !imageUrl) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "No file_base64, signedUrl, or image_url provided",
        }),
        {
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    console.log("Received request:", file_base64 ? `file_base64 length: ${file_base64.length}` : `imageUrl: ${imageUrl}`);

    // Try direct base64 approach first (works for images and PDFs)
    let visionData: any;
    let extractedText = "";
    let fileUrl = signedUrl || "";
    let fileName = "";

    try {
      let imageContent: string;
      
      if (imageUrl) {
        // Fetch image from signed URL and convert to base64
        console.log("Fetching image from URL...");
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
          throw new Error(`Failed to fetch image from URL: ${imageResponse.status}`);
        }
        const imageBuffer = await imageResponse.arrayBuffer();
        const uint8Array = new Uint8Array(imageBuffer);
        let binaryString = "";
        for (let i = 0; i < uint8Array.length; i++) {
          binaryString += String.fromCharCode(uint8Array[i]);
        }
        imageContent = btoa(binaryString);
        console.log("Image fetched and converted to base64, length:", imageContent.length);
      } else {
        imageContent = file_base64;
        console.log("Using provided base64 content");
      }
      
      // Call Google Vision API with base64 content
      const visionResponse = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${googleVisionApiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            requests: [
              {
                image: {
                  content: imageContent,
                },
                features: [
                  {
                    type: "DOCUMENT_TEXT_DETECTION",
                    maxResults: 1,
                  },
                ],
              },
            ],
          }),
        }
      );

      if (!visionResponse.ok) {
        const errorText = await visionResponse.text();
        console.error("Vision API error:", errorText);
        throw new Error(`Google Vision API error: ${errorText}`);
      }

      visionData = await visionResponse.json();
      console.log("Vision API response received:", JSON.stringify(visionData).substring(0, 200));
      
      // Check for Vision API errors in response
      if (visionData.responses?.[0]?.error) {
        const visionErr = visionData.responses[0].error;
        console.error("Vision API returned error:", visionErr);
        throw new Error(`Google Vision API error: ${visionErr.message || JSON.stringify(visionErr)}`);
      }
      
      // Extract text
      extractedText = visionData.responses?.[0]?.fullTextAnnotation?.text || "";
      console.log("Extracted text length:", extractedText.length);

      // Upload file to storage for record keeping (only if using base64)
      if (file_base64) {
        const binaryString = atob(file_base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        fileName = `ocr-${Date.now()}.jpg`;
        const fileBuffer = bytes.buffer;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("ocr_uploads")
          .upload(fileName, fileBuffer, {
            contentType: "image/jpeg",
            upsert: false,
          });

        if (uploadError) {
          console.log("Upload to ocr_uploads failed, trying documents bucket");
          const { data: fallbackUpload, error: fallbackError } = await supabase.storage
            .from("documents")
            .upload(fileName, fileBuffer, {
              contentType: "image/jpeg",
              upsert: false,
            });
          
          if (!fallbackError) {
            const { data: urlData } = supabase.storage
              .from("documents")
              .getPublicUrl(fileName);
            fileUrl = urlData.publicUrl;
          }
        } else {
          const { data: urlData } = supabase.storage
            .from("ocr_uploads")
            .getPublicUrl(fileName);
          fileUrl = urlData.publicUrl;
        }
      } else if (signedUrl) {
        // Extract filename from signed URL
        const urlParts = signedUrl.split("/");
        fileName = urlParts[urlParts.length - 1].split("?")[0];
      }

    } catch (innerErr: any) {
      console.error("Direct base64 OCR failed:", innerErr.message);
      console.error("Full error:", innerErr);
      return new Response(
        JSON.stringify({
          success: false,
          error: innerErr.message || "OCR processing failed",
          details: innerErr.toString(),
        }),
        {
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // 5. Extract financial data for autofill
    const autofillData = extractFinancialData(extractedText);

    // 5b. Detect salary slip
    const salarySlipData = detectSalarySlip(extractedText);

    // 5c. Detect document type and extract KTP data if applicable
    let ktpData: KTPData | null = null;
    const upperText = extractedText.toUpperCase();
    const isKTP = (upperText.includes("PROVINSI") && 
                  (upperText.includes("KABUPATEN") || upperText.includes("KOTA"))) &&
                  /\b\d{16}\b/.test(extractedText); // Has 16-digit NIK
    
    if (isKTP) {
      ktpData = extractKTPData(extractedText);
    }

    // Parse toko (store name) from common Indonesian stores
    const tokoList = [
      "Indomaret",
      "Alfamart",
      "Hypermart",
      "Circle K",
      "Giant",
      "Carrefour",
      "Transmart",
      "Lotte Mart",
      "Ranch Market",
      "Superindo",
    ];
    const toko = tokoList.find((store) => new RegExp(store, "i").test(extractedText)) || null;

    // 6. Prepare data for insertion (filter out personal information fields)
    const dataToInsert: any = {
      file_url: fileUrl,
      file_path: fileName,
      extracted_text: extractedText,
      json_data: visionData,
      ocr_data: visionData,
      nominal: autofillData.nominal,
      tanggal: autofillData.tanggal,
      supplier: autofillData.supplier,
      nomor_nota: autofillData.invoice,
      toko: toko,
      nama_karyawan: autofillData.nama_karyawan,
      deskripsi: autofillData.deskripsi,
      autofill_status: 'completed',
    };

    // Filter out personal information fields (first_name, last_name, full_name, nama)
    const fieldsToExclude = ['first_name', 'last_name', 'full_name', 'nama'];
    
    // If KTP data exists, filter out personal fields
    if (ktpData) {
      const filteredKTPData = { ...ktpData };
      fieldsToExclude.forEach(field => {
        delete filteredKTPData[field as keyof KTPData];
      });
      dataToInsert.extracted_data = filteredKTPData;
    }

    // Save to ocr_results table with filtered data
    const { data: dbData, error: dbErr } = await supabase
      .from("ocr_results")
      .insert([dataToInsert])
      .select()
      .single();

    if (dbErr) {
      console.error("Database error:", dbErr);
      throw new Error(`Database error: ${dbErr.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        text: extractedText,
        nominal: autofillData.nominal || 0,
        tanggal: autofillData.tanggal || new Date().toISOString().split("T")[0],
        nomor_nota: autofillData.invoice || null,
        toko: toko || null,
        file_url: fileUrl,
        file_path: fileName,
        autofill: autofillData,
        ktp_data: ktpData,
        document_type: isKTP ? "KTP" : (salarySlipData.is_salary_slip ? "salary_slip" : "FINANCIAL"),
        employee_name: salarySlipData.employee_name,
        employee_number: salarySlipData.employee_number,
        suggested_debit_account: salarySlipData.suggested_debit_account,
        suggested_credit_account: salarySlipData.suggested_credit_account,
        json_data: visionData,
        db_record: dbData,
      }),
      {
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (err: any) {
    console.error("OCR Error:", err);
    console.error("Error stack:", err.stack);
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message || "An unexpected error occurred",
        details: err.toString(),
        stack: err.stack,
      }),
      {
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});

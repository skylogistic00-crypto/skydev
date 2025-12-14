import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from "@shared/cors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_KEY")!;
const googleVisionApiKey = Deno.env.get("GOOGLE_VISION_API_KEY");

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface AutofillData {
  nominal: number | null;
  tanggal: string | null;
  supplier: string | null;
  invoice: string | null;
  nama_karyawan: string | null;
  deskripsi: string | null;
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

  // Extract nominal (currency amounts)
  const nominalPatterns = [
    /(?:Rp\.?|IDR)\s*([\d.,]+)/gi,
    /(?:Total|Jumlah|Amount|Grand Total|Sub Total)[:\s]*([\d.,]+)/gi,
    /([\d.,]+)\s*(?:Rupiah|IDR)/gi,
  ];
  
  for (const pattern of nominalPatterns) {
    const match = text.match(pattern);
    if (match) {
      const numStr = match[0].replace(/[^\d]/g, '');
      const num = parseFloat(numStr);
      if (!isNaN(num) && num > 0) {
        result.nominal = num;
        break;
      }
    }
  }

  // Extract date (tanggal)
  const datePatterns = [
    /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/g,
    /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\s+(\d{2,4})/gi,
    /(?:Tanggal|Date|Tgl)[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/gi,
  ];
  
  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      result.tanggal = match[0].replace(/(?:Tanggal|Date|Tgl)[:\s]*/gi, '').trim();
      break;
    }
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

  // Extract description (deskripsi) - first meaningful line or item description
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

  // If no description found, use first 100 chars of text
  if (!result.deskripsi && text.length > 0) {
    result.deskripsi = text.substring(0, 100).replace(/\n/g, ' ').trim();
  }

  return result;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!googleVisionApiKey) {
      throw new Error("GOOGLE_VISION_API_KEY is not configured");
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      throw new Error("No file provided");
    }

    // 1. Upload compressed file to ocr_uploads bucket
    const fileName = `ocr-${Date.now()}-${file.name}`;
    const fileBuffer = await file.arrayBuffer();
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("ocr_uploads")
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // 2. Generate signed URL for the uploaded file
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from("ocr_uploads")
      .createSignedUrl(fileName, 3600); // 1 hour expiry

    if (signedUrlError || !signedUrlData?.signedUrl) {
      throw new Error(`Signed URL generation failed: ${signedUrlError?.message}`);
    }

    const signedUrl = signedUrlData.signedUrl;

    // 3. Call Google Vision API using imageUri mode (no size limit)
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
                source: {
                  imageUri: signedUrl,
                },
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
      throw new Error(`Google Vision API error: ${errorText}`);
    }

    const visionData = await visionResponse.json();
    
    // 4. Extract fullTextAnnotation.text
    const extractedText =
      visionData.responses?.[0]?.fullTextAnnotation?.text || "";

    // 5. Extract financial data for autofill
    const autofillData = extractFinancialData(extractedText);

    // 6. Prepare data for insertion (filter out personal information fields)
    const dataToInsert: any = {
      file_url: signedUrl,
      file_path: fileName,
      extracted_text: extractedText,
      json_data: visionData,
      ocr_data: visionData,
      nominal: autofillData.nominal,
      tanggal: autofillData.tanggal,
      supplier: autofillData.supplier,
      invoice: autofillData.invoice,
      nama_karyawan: autofillData.nama_karyawan,
      deskripsi: autofillData.deskripsi,
      autofill_status: 'completed',
    };

    // Filter out personal information fields (first_name, last_name, full_name, nama)
    const fieldsToExclude = ['first_name', 'last_name', 'full_name', 'nama'];
    
    // Remove excluded fields from dataToInsert if they exist
    fieldsToExclude.forEach(field => {
      delete dataToInsert[field];
    });

    // Save to ocr_results table with filtered data
    const { data: dbData, error: dbError } = await supabase
      .from("ocr_results")
      .insert([dataToInsert])
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      throw new Error(`Database error: ${dbError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        file_url: signedUrl,
        file_path: fileName,
        extracted_text: extractedText,
        autofill: autofillData,
        json_data: visionData,
        db_record: dbData,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("OCR Pipeline Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});

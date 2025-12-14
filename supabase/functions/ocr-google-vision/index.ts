import { corsHeaders } from "@shared/cors.ts";

interface OCRResult {
  nominal: number;
  tanggal: string;
  deskripsi: string;
  extractedText: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { file_base64 } = await req.json();

    if (!file_base64) {
      return new Response(
        JSON.stringify({ error: "file_base64 is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Call Google Vision API
    const visionApiKey = Deno.env.get("VITE_GOOGLE_VISION_API_KEY");
    if (!visionApiKey) {
      throw new Error("Google Vision API key not configured");
    }

    const visionResponse = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${visionApiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requests: [
            {
              image: {
                content: file_base64,
              },
              features: [
                {
                  type: "TEXT_DETECTION",
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
    const textAnnotations = visionData.responses?.[0]?.textAnnotations;

    if (!textAnnotations || textAnnotations.length === 0) {
      return new Response(
        JSON.stringify({
          error: "No text detected in image",
          nominal: 0,
          tanggal: "",
          deskripsi: "",
          extractedText: "",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get full text
    const fullText = textAnnotations[0].description || "";

    // Parse the text to extract data
    const result = parseOCRText(fullText);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("OCR Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function parseOCRText(text: string): OCRResult {
  const result: OCRResult = {
    nominal: 0,
    tanggal: "",
    deskripsi: "",
    extractedText: text,
  };

  // Extract nominal (currency amount)
  // Patterns: Rp 100.000, IDR 100000, Total: 100.000, etc.
  const nominalPatterns = [
    /(?:total|jumlah|amount|bayar|grand\s*total|harga\s*jual)[:\s]*(?:rp\.?|idr)?\s*([\d.,]+)/i,
    /(?:rp\.?|idr)\s*([\d.,]+)/i,
    /(\d{1,3}(?:[.,]\d{3})+)/g,
  ];

  let maxNominal = 0;
  for (const pattern of nominalPatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const numStr = match[1] || match[0];
      const cleanNum = numStr.replace(/[.,]/g, "");
      const num = parseInt(cleanNum, 10);
      if (!isNaN(num) && num > maxNominal) {
        maxNominal = num;
      }
    }
  }
  result.nominal = maxNominal;

  // Extract date
  // Patterns: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, etc.
  const datePatterns = [
    /(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{4})/,
    /(\d{4})[\/\-\.](\d{2})[\/\-\.](\d{2})/,
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      if (match[0].startsWith("20")) {
        // YYYY-MM-DD format
        result.tanggal = `${match[1]}-${match[2]}-${match[3]}`;
      } else {
        // DD/MM/YYYY format - convert to YYYY-MM-DD
        const dd = match[1].padStart(2, "0");
        const mm = match[2].padStart(2, "0");
        const yyyy = match[3];
        result.tanggal = `${yyyy}-${mm}-${dd}`;
      }
      break;
    }
  }

  // Extract description
  // Try to get merchant name or first meaningful line
  const lines = text.split("\n").filter((line) => line.trim().length > 0);
  
  // Look for merchant/store name (usually in first few lines, all caps or title case)
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i].trim();
    // Skip lines that are just numbers or dates
    if (/^\d+$/.test(line) || /^\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4}$/.test(line)) {
      continue;
    }
    // Look for lines with 2+ words in caps or title case
    if (line.length > 3 && /[A-Z]/.test(line)) {
      result.deskripsi = line;
      break;
    }
  }

  // If no description found, use first non-empty line
  if (!result.deskripsi && lines.length > 0) {
    result.deskripsi = lines[0];
  }

  return result;
}

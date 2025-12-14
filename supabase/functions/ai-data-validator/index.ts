import { corsHeaders } from "@shared/cors.ts";

interface ValidationResult {
  success: boolean;
  jenis_dokumen: string;
  data: Record<string, any>;
  fields_to_create: Array<{
    name: string;
    label: string;
    type: string;
    required: boolean;
  }>;
  columns_to_create: Array<{
    name: string;
    sql_type: string;
  }>;
  notes: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  try {
    const { clean_text, raw_text, jenis_dokumen } = await req.json();

    const textToProcess = clean_text || raw_text;

    if (!textToProcess) {
      return new Response(
        JSON.stringify({ error: "clean_text or raw_text is required", success: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const openaiApiKey = Deno.env.get("OPEN_AI_KEY");

    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured", success: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const systemPrompt = `Kamu adalah AI validasi dan pembersihan data untuk Tempo Labs. Tugas utamamu:

1. MEMBERSIHKAN TEKS:
   - Hapus karakter aneh atau noise dari OCR
   - Perbaiki typo yang jelas
   - Normalisasi spasi dan kapitalisasi

2. MEMPERBAIKI TANGGAL:
   - Format standar: DD-MM-YYYY
   - Perbaiki tanggal yang tidak valid
   - Jika tidak yakin, gunakan null

3. MENYUSUN FORMAT ALAMAT:
   - Pisahkan RT/RW, Kelurahan, Kecamatan, Kota, Provinsi
   - Normalisasi singkatan (Jl. -> Jalan, Gg. -> Gang)
   - Kapitalisasi yang benar

4. MENORMALISASI ANGKA:
   - Hapus separator ribuan yang salah
   - Format mata uang: tanpa Rp, gunakan angka saja
   - NIK/NPWP: pertahankan format asli

5. ATURAN PENTING:
   - JANGAN mengarang data yang tidak ada
   - Gunakan null jika tidak yakin
   - JANGAN mengubah struktur yang sudah benar
   - Jaga konsistensi field

OUTPUT FORMAT (JSON ONLY):
{
  "success": true,
  "jenis_dokumen": "KTP/KK/NPWP/SIM/STNK/IJAZAH/PKB/AIR_WAYBILL/Invoice/Passport/Manifest/Lainnya",
  "data": {
    // Data yang sudah dibersihkan dan divalidasi
  },
  "fields_to_create": [
    // Field baru yang perlu dibuat di form
    { "name": "field_name", "label": "Field Label", "type": "text|number|date|boolean", "required": false }
  ],
  "columns_to_create": [
    // Kolom baru yang perlu dibuat di Supabase
    { "name": "column_name", "sql_type": "TEXT|NUMERIC|DATE|BOOLEAN" }
  ],
  "notes": "Catatan tentang data yang tidak bisa divalidasi atau perlu perhatian"
}`;

    const userPrompt = `Validasi dan bersihkan data OCR berikut:

${jenis_dokumen ? `JENIS DOKUMEN: ${jenis_dokumen}` : ""}

TEKS OCR:
${textToProcess}

Berikan output JSON yang sudah dibersihkan dan divalidasi.`;

    console.log("Calling OpenAI for data validation...");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.2,
        max_completion_tokens: 2000,
        n: 1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Pica API error:", errorText);
      throw new Error(`Pica API error: ${response.statusText}`);
    }

    const responseData = await response.json();
    const assistantContent = responseData.choices?.[0]?.message?.content || "{}";

    console.log("AI Response received, parsing...");

    let validationResult: ValidationResult;
    try {
      const jsonMatch = assistantContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        validationResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      validationResult = {
        success: false,
        jenis_dokumen: jenis_dokumen || "Lainnya",
        data: {},
        fields_to_create: [],
        columns_to_create: [],
        notes: "Gagal memproses respons AI",
      };
    }

    // Ensure all required fields exist
    validationResult = {
      success: validationResult.success ?? true,
      jenis_dokumen: validationResult.jenis_dokumen || jenis_dokumen || "Lainnya",
      data: validationResult.data || {},
      fields_to_create: validationResult.fields_to_create || [],
      columns_to_create: validationResult.columns_to_create || [],
      notes: validationResult.notes || "",
    };

    console.log("Validation complete:", validationResult.jenis_dokumen);

    return new Response(
      JSON.stringify(validationResult),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Data validation error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        jenis_dokumen: "Lainnya",
        data: {},
        fields_to_create: [],
        columns_to_create: [],
        notes: "Error during validation",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

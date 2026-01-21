import { corsHeaders } from "@shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

interface InvoiceExtractRequest {
  bank_mutation_id: string;
  ocr_text?: string;
  document_type?: "invoice" | "tax_invoice";
  faktur_pajak_url?: string;
}

interface InvoiceExtractResult {
  invoice_number: string | null;
  invoice_date: string | null;
  dpp: number | null;
  total: number | null;
  ppn: number | null;
  ocr_result: string;
  confidence_score: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: {
            ...(req.headers.get("Authorization")
              ? { Authorization: req.headers.get("Authorization")! }
              : {}),
          },
        },
      }
    );

    const {
      bank_mutation_id,
      ocr_text,
      document_type = "invoice",
      faktur_pajak_url,
    }: InvoiceExtractRequest = await req.json();

    if (!bank_mutation_id) {
      return new Response(
        JSON.stringify({ success: false, error: "bank_mutation_id is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    if (document_type === "invoice" && !ocr_text) {
      return new Response(
        JSON.stringify({ success: false, error: "ocr_text is required for invoice" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    if (document_type === "tax_invoice" && !faktur_pajak_url) {
      return new Response(
        JSON.stringify({ success: false, error: "faktur_pajak_url is required for tax_invoice" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const { data: mutation, error: fetchError } = await supabaseClient
      .from("bank_mutations")
      .select("id,debit,credit,invoice_url")
      .eq("id", bank_mutation_id)
      .single();

    if (fetchError || !mutation) {
      throw new Error("Bank mutation not found");
    }

    const bankAmount = Number(mutation.debit ?? mutation.credit ?? 0);

    const openaiApiKey = Deno.env.get("OPEN_AI_KEY") ?? Deno.env.get("VITE_OPEN_AI_KEY");
    if (!openaiApiKey) {
      throw new Error("OPEN_AI_KEY not configured");
    }

    const systemPrompt = `You are a Document Extraction Engine.

Document type: ${document_type}

You receive:
1) OCR text from the document
2) A bank transaction amount = ${bankAmount}

Your job: extract the requested fields for user confirmation.

Return ONLY valid JSON in this exact schema:
{
  "invoice_number": null,
  "invoice_date": null,
  "dpp": null,
  "total": null,
  "ppn": null,
  "ocr_result": "",
  "confidence_score": 0
}

Rules:
- invoice_number/invoice_date: fill when present; else null.
- total: if missing, use ${bankAmount}.
- dpp and ppn: only set if explicitly present in OCR text. Otherwise null.
- confidence_score: 0..1 estimate.
- ocr_result: short summary.`;

    let resolvedOcrText = ocr_text;

    if (document_type === "tax_invoice") {
      const resp = await fetch(faktur_pajak_url!, { method: "GET" });
      if (!resp.ok) {
        throw new Error(`Failed to fetch tax invoice file: ${resp.status} ${resp.statusText}`);
      }
      const arrayBuffer = await resp.arrayBuffer();
      const bytes = Array.from(new Uint8Array(arrayBuffer));

      const visionKey = Deno.env.get("GOOGLE_VISION_API_KEY") ?? Deno.env.get("VITE_GOOGLE_VISION_API_KEY");
      if (!visionKey) throw new Error("GOOGLE_VISION_API_KEY not configured");

      const visionResp = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${visionKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requests: [
              {
                image: { content: btoa(String.fromCharCode(...bytes)) },
                features: [{ type: "TEXT_DETECTION" }],
              },
            ],
          }),
        }
      );

      const visionText = await visionResp.text();
      if (!visionResp.ok) {
        throw new Error(`Google Vision API error: ${visionResp.status} ${visionResp.statusText} | ${visionText}`);
      }

      let visionData: any;
      try {
        visionData = JSON.parse(visionText);
      } catch {
        throw new Error(`Google Vision returned non-JSON: ${visionText}`);
      }

      const detected = visionData?.responses?.[0]?.fullTextAnnotation?.text;
      if (typeof detected !== "string" || !detected.trim()) {
        throw new Error("Google Vision OCR returned empty text");
      }

      resolvedOcrText = detected;
    }

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `OCR Text:\n\n${resolvedOcrText}` },
        ],
        temperature: 0.1,
        response_format: { type: "json_object" },
      }),
    });

    const openaiResponseText = await openaiResponse.text();
    if (!openaiResponse.ok) {
      throw new Error(
        `OpenAI API error: ${openaiResponse.status} ${openaiResponse.statusText} | ${openaiResponseText}`
      );
    }

    let openaiData: any;
    try {
      openaiData = JSON.parse(openaiResponseText);
    } catch {
      throw new Error(`OpenAI returned non-JSON: ${openaiResponseText}`);
    }

    const content = openaiData?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      throw new Error(
        `OpenAI response missing choices[0].message.content. Response: ${openaiResponseText}`
      );
    }

    let extracted: InvoiceExtractResult;
    try {
      extracted = JSON.parse(content);
    } catch {
      throw new Error(`OpenAI message.content is not valid JSON. content=${JSON.stringify(content)}`);
    }

    const normalized: InvoiceExtractResult = {
      invoice_number: typeof extracted?.invoice_number === "string" && extracted.invoice_number.trim()
        ? extracted.invoice_number.trim()
        : null,
      invoice_date: typeof extracted?.invoice_date === "string" && extracted.invoice_date.trim()
        ? extracted.invoice_date.trim()
        : null,
      dpp: extracted?.dpp === null || extracted?.dpp === undefined ? null : Number(extracted.dpp) || null,
      total: extracted?.total === null || extracted?.total === undefined
        ? bankAmount
        : Number(extracted.total) || bankAmount,
      ppn: extracted?.ppn === null || extracted?.ppn === undefined ? null : Number(extracted.ppn) || null,
      ocr_result: typeof extracted?.ocr_result === "string" ? extracted.ocr_result : "",
      confidence_score: Math.max(0, Math.min(1, Number(extracted?.confidence_score ?? 0) || 0)),
    };

    return new Response(
      JSON.stringify({
        success: true,
        data: normalized,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "string"
          ? error
          : (() => {
              try {
                return JSON.stringify(error);
              } catch {
                return "Unknown error";
              }
            })();

    console.error("Error in ai-invoice-extractor:", error);

    return new Response(
      JSON.stringify({ success: false, error: message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "@shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";


interface TaxExtractionRequest {
  bank_mutation_id: string;
  ocr_text: string;
}

interface TaxExtractionResult {
  invoice_id: string;
  invoice_type: "TAX" | "NON_TAX";
  dpp_amount: number;
  ppn_amount: number;
  pph_amount: number;
  gross_amount: number;
}

serve(async (req) => {
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

    const { bank_mutation_id, ocr_text }: TaxExtractionRequest = await req.json();

    if (!bank_mutation_id || !ocr_text) {
      throw new Error("bank_mutation_id and ocr_text are required");
    }

    // Fetch the bank mutation record
    const { data: mutation, error: fetchError } = await supabaseClient
      .from("bank_mutations")
      .select("*")
      .eq("id", bank_mutation_id)
      .single();

    if (fetchError || !mutation) {
      throw new Error("Bank mutation not found");
    }

    const openaiApiKey = Deno.env.get("OPEN_AI_KEY") ?? Deno.env.get("VITE_OPEN_AI_KEY");
    if (!openaiApiKey) {
      throw new Error("OPEN_AI_KEY not configured");
    }

    // CoreTax Engine prompt (as requested)
    const bankAmount = Number(mutation.debit ?? mutation.credit ?? 0);
    const systemPrompt = `You are CoreTax Engine.

You receive:
1) OCR text of an invoice, tax invoice (Faktur Pajak), or receipt
2) A bank transaction with amount = ${bankAmount}

Your job is to extract TAX values using Indonesian fiscal rules.
You must NEVER depend on layout or invoice format.
You must reason using tax logic only.

Your output must ALWAYS be valid JSON in this exact schema:

{
  "invoice_id": "",
  "invoice_type": "TAX" | "NON_TAX",
  "dpp_amount": 0,
  "ppn_amount": 0,
  "pph_amount": 0,
  "gross_amount": 0
}

RULES:
- Invoice type = TAX if OCR contains Faktur Pajak / PPN / VAT / Coretax
- Gross = largest value among Total / Grand Total / Jumlah / Tagihan
- If none found → Gross = ${bankAmount}
- If TAX:
    - PPN = explicit value if exists
    - else PPN = gross × 0.11
- DPP = gross − PPN
- If NON_TAX:
    - PPN = 0
    - DPP = gross
- If BANK_AMOUNT < gross → PPh = gross − BANK_AMOUNT
- Never guess values
- Output JSON only`;

    // Call OpenAI API
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
          { role: "user", content: `OCR Text:\n\n${ocr_text}` },
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

    let extractedData: TaxExtractionResult;
    try {
      extractedData = JSON.parse(content);
    } catch {
      throw new Error(
        `OpenAI message.content is not valid JSON. content=${JSON.stringify(content)}`
      );
    }

    // Normalize & validate numeric fields defensively
    extractedData = {
      invoice_id: typeof extractedData?.invoice_id === "string" ? extractedData.invoice_id : "",
      invoice_type: extractedData?.invoice_type === "TAX" || extractedData?.invoice_type === "NON_TAX"
        ? extractedData.invoice_type
        : "NON_TAX",
      dpp_amount: Number(extractedData?.dpp_amount ?? 0) || 0,
      ppn_amount: Number(extractedData?.ppn_amount ?? 0) || 0,
      pph_amount: Number(extractedData?.pph_amount ?? 0) || 0,
      gross_amount: Number(extractedData?.gross_amount ?? 0) || 0,
    };

    // If gross_amount is missing, fall back to bank amount (per prompt rules)
    if (!extractedData.gross_amount || extractedData.gross_amount <= 0) {
      extractedData.gross_amount = bankAmount;
    }

    // Calculate PPh if needed (bank_mutation.amount < gross_amount)
    const mutationAmount = mutation.debit || mutation.credit || 0;
    if (mutationAmount < extractedData.gross_amount) {
      extractedData.pph_amount = extractedData.gross_amount - mutationAmount;
    }

    // Update bank_mutations with extracted tax data
    const { error: updateError } = await supabaseClient
      .from("bank_mutations")
      .update({
        invoice_id: extractedData.invoice_id || null,
        invoice_number: extractedData.invoice_id || null,
        invoice_type: extractedData.invoice_type || null,
        dpp_amount: extractedData.dpp_amount,
        ppn_amount: extractedData.ppn_amount,
        pph_amount: extractedData.pph_amount,
        gross_amount: extractedData.gross_amount,
        tax_extraction_status: "extracted",
        tax_extraction_timestamp: new Date().toISOString(),
        tax_extraction_confidence: 0.85, // Default confidence
      })
      .eq("id", bank_mutation_id);

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Tax data extracted successfully",
        data: extractedData,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
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

    console.error("Error in tax-extraction-ai:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

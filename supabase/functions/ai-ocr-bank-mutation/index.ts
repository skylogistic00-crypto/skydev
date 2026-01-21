import { corsHeaders } from "./_shared/cors.ts";
import { createSupabaseClient } from "@shared/supabase-client.ts";

type ReqBody = {
  // Save mode (direct persist)
  bank_mutation_id?: string;

  // Common
  image_url?: string;
  bucket?: string;
  filePath?: string;
  ocrText?: string;
  extracted?: {
    bukti_url?: string;
    dpp_amount?: number | null;
    vat_amount?: number | null;
    stamp_amount?: number | null;
    transaction_type?: "SALES" | "EXPENSE" | null;
    revenue_account_code?: string | null;
    expense_account_code?: string | null;
    vat_output_account_code?: string | null;
    vat_input_account_code?: string | null;
  };

  // Fallback mode (no persist, returns candidates)
  fallback?: {
    date?: string | null;
    amount?: number | null;
    description?: string | null;
  };

  // Backward compatibility
  rowId?: string;
  publicUrl?: string;
};

Deno.serve(async (req) => {
  // CORS preflight must return HTTP 200
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  // Basic request logging (visible in Supabase function logs)
  console.log("ai-ocr-bank-mutation", {
    method: req.method,
    hasAuth: Boolean(req.headers.get("authorization")),
  });

  try {
    const supabase = createSupabaseClient(req);

    const rawBodyText = await req.text();
    let rawBody: ReqBody;
    try {
      rawBody = rawBodyText ? (JSON.parse(rawBodyText) as ReqBody) : ({} as ReqBody);
    } catch (e) {
      console.error("Invalid JSON body", { rawBodyText });
      return new Response(
        JSON.stringify({ success: false, error: "Invalid JSON body" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const bankMutationId = rawBody.bank_mutation_id ?? rawBody.rowId ?? null;
    const imageUrl = rawBody.image_url ?? rawBody.extracted?.bukti_url ?? rawBody.publicUrl ?? null;
    const bucket = rawBody.bucket ?? "mutation-evidence";
    const filePath = rawBody.filePath ?? "";
    const ocrText = rawBody.ocrText ?? "";

    console.log("OCR REQUEST", {
      bankMutationId,
      hasImage: Boolean(imageUrl),
      hasText: Boolean(ocrText),
    });

    // Mode A: Fallback (no bank_mutation_id) => return candidates only
    if (!bankMutationId) {
      const f = rawBody.fallback ?? {};
      const targetAmount = typeof f.amount === "number" ? f.amount : null;

      let q = supabase
        .from("bank_mutations")
        .select("id,date,description,debit,credit")
        .is("approval_status", null)
        .order("created_at", { ascending: false })
        .limit(200);

      if (f.date) {
        q = q.eq("date", f.date);
      }

      const { data, error } = await q;
      if (error) {
        return new Response(
          JSON.stringify({ success: false, error: error.message }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }

      const rows = (data ?? []) as Array<{
        id: string;
        date: string | null;
        description: string | null;
        debit: number | null;
        credit: number | null;
      }>;

      const candidates = rows
        .map((r) => {
          const amount = Number(r.debit ?? r.credit ?? 0);
          const scoreParts: number[] = [];

          if (targetAmount !== null) {
            const diff = Math.abs(amount - targetAmount);
            if (diff === 0) scoreParts.push(60);
            else if (diff <= 1000) scoreParts.push(45);
            else if (diff <= 5000) scoreParts.push(30);
          }

          if (f.date && r.date && f.date === r.date) scoreParts.push(25);

          if (f.description && r.description) {
            const norm = (s: string) =>
              s
                .toLowerCase()
                .replace(/[^a-z0-9\s]/g, " ")
                .replace(/\s+/g, " ")
                .trim();
            const qWords = new Set(norm(f.description).split(" ").filter(Boolean));
            const rWords = new Set(norm(r.description).split(" ").filter(Boolean));
            let overlap = 0;
            qWords.forEach((w) => {
              if (rWords.has(w)) overlap += 1;
            });
            scoreParts.push(Math.min(15, overlap * 3));
          }

          const score = scoreParts.reduce((a, b) => a + b, 0);
          return { row: r, score };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      return new Response(
        JSON.stringify({ success: true, matched: null, candidates }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Mode B: Direct save (requires required contract fields)
    const missing: string[] = [];
    if (!imageUrl) missing.push("image_url");
    if (!filePath) missing.push("filePath");
    if (!ocrText) missing.push("ocrText");

    if (missing.length) {
      return new Response(
        JSON.stringify({ success: false, error: `Missing required fields: ${missing.join(", ")}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const extracted = rawBody.extracted ?? {};

    const updatePayload: Record<string, unknown> = {
      bukti_url: imageUrl,
      invoice_storage_bucket: bucket,
      invoice_file_path: filePath,
      ocr_text: ocrText,
      dpp_amount: extracted.dpp_amount ?? null,
      vat_amount: extracted.vat_amount ?? null,
      stamp_amount: extracted.stamp_amount ?? null,
      revenue_account_code: extracted.revenue_account_code ?? null,
      expense_account_code: extracted.expense_account_code ?? null,
      vat_output_account_code: extracted.vat_output_account_code ?? null,
      vat_input_account_code: extracted.vat_input_account_code ?? null,
    };

    if (extracted.transaction_type !== undefined && extracted.transaction_type !== null) {
      updatePayload.transaction_type = extracted.transaction_type;
    }

    const { data: updated, error: updateError } = await supabase
      .from("bank_mutations")
      .update(updatePayload)
      .eq("id", bankMutationId)
      .select("id")
      .maybeSingle();

    if (updateError) {
      console.error("[OCR][DB] UPDATE FAILED", {
        bankMutationId,
        message: updateError.message,
        code: (updateError as any).code,
        details: (updateError as any).details,
        hint: (updateError as any).hint,
      });
      return new Response(
        JSON.stringify({ success: false, error: updateError.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    if (!updated?.id) {
      console.error("[OCR][DB] UPDATE OK but row not found", { bankMutationId });
      return new Response(
        JSON.stringify({ success: false, error: `bank_mutations not updated (id not found): ${bankMutationId}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    console.log("OCR SAVED TO", updated.id);

    return new Response(
      JSON.stringify({ success: true, matched: { type: "bank_mutation_id", id: updated.id, updated: true } }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ success: false, error: (e as Error).message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

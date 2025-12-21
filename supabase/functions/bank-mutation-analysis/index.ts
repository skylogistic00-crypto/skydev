import { corsHeaders } from "@shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const openaiKey = Deno.env.get("OPENAI_API_KEY") || Deno.env.get("OPEN_AI_KEY") || "";

interface BankMutation {
  id: string;
  tanggal: string;
  keterangan: string;
  debit: number;
  kredit: number;
  saldo: number;
}

interface AnalysisResult {
  mutation_id: string;
  source: string;
  debit_account_code: string;
  credit_account_code: string;
  confidence: number;
  is_ambiguous: boolean;
  reasoning?: string;
}

// Ambiguous keywords that require manual review
const AMBIGUOUS_KEYWORDS = [
  "kasbon", "reimburse", "panjar", "talangan", "advance", "pinjam",
  "ganti", "reimb", "penggantian", "uang muka"
];

function isAmbiguous(keterangan: string): boolean {
  const lower = keterangan.toLowerCase();
  return AMBIGUOUS_KEYWORDS.some(keyword => lower.includes(keyword));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const body = await req.json();
    const { mutation_id, mutation_ids } = body;

    if (!mutation_id && !mutation_ids) {
      return new Response(
        JSON.stringify({ error: "mutation_id atau mutation_ids harus diisi" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Fetch mutations
    let query = supabase
      .from("bank_mutations_staging")
      .select("*");
    
    if (mutation_id) {
      query = query.eq("id", mutation_id);
    } else if (mutation_ids && Array.isArray(mutation_ids)) {
      query = query.in("id", mutation_ids);
    }

    const { data: mutations, error: mutError } = await query;

    if (mutError || !mutations || mutations.length === 0) {
      return new Response(
        JSON.stringify({ error: "Mutasi tidak ditemukan" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    // Fetch all COA accounts
    const { data: coaAccounts, error: coaError } = await supabase
      .from("chart_of_accounts")
      .select("account_code, account_name, account_type, normal_balance")
      .eq("is_active", true)
      .eq("is_postable", true)
      .order("account_code");

    if (coaError || !coaAccounts) {
      return new Response(
        JSON.stringify({ error: "Gagal mengambil data COA" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Build COA list for AI
    const coaList = coaAccounts.map(acc => 
      `${acc.account_code} - ${acc.account_name} (${acc.account_type}, Normal: ${acc.normal_balance})`
    ).join("\n");

    const results: AnalysisResult[] = [];

    for (const mutation of mutations as BankMutation[]) {
      const isDebit = mutation.debit > 0;
      const amount = isDebit ? mutation.debit : mutation.kredit;
      const ambiguous = isAmbiguous(mutation.keterangan);

      const prompt = `Anda adalah BANK MUTATION ANALYSIS ENGINE.

ATURAN KERAS:
1. Category HARUS diambil dari chart_of_accounts berdasarkan debit_account_code
2. JANGAN membuat invoice, kasbon, atau transaksi bisnis baru
3. JANGAN mengisi payment_type atau category secara langsung
4. Output HANYA JSON

KEYWORD AMBIGU (is_ambiguous=true, confidence<60):
- kasbon, reimburse, panjar, talangan, advance, pinjam, ganti

DATA MUTASI BANK:
Tanggal: ${mutation.tanggal}
Keterangan: "${mutation.keterangan}"
${isDebit ? `Debit: Rp ${amount.toLocaleString("id-ID")}` : `Kredit: Rp ${amount.toLocaleString("id-ID")}`}
Saldo: Rp ${mutation.saldo.toLocaleString("id-ID")}

CHART OF ACCOUNTS TERSEDIA:
${coaList}

LOGIKA MAPPING:
- Jika DEBIT (uang masuk ke bank): 
  Debit: Bank/Kas (1-1xxx)
  Credit: Pendapatan/Piutang/Modal (4-xxxx, 1-2xxx, 3-xxxx)

- Jika KREDIT (uang keluar dari bank):
  Debit: Beban/Aset/Hutang (6-xxxx, 1-5xxx, 2-xxxx)
  Credit: Bank/Kas (1-1xxx)

DETEKSI KEYWORD AMBIGUOUS: ${ambiguous ? "YA - is_ambiguous=true, confidence<60" : "TIDAK"}

OUTPUT JSON:
{
  "source": "AI_ANALYSIS",
  "debit_account_code": "kode-akun",
  "credit_account_code": "kode-akun",
  "confidence": angka 0-100,
  "is_ambiguous": ${ambiguous},
  "reasoning": "penjelasan singkat"
}

Pastikan account_code valid dari daftar COA di atas.`;

      const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openaiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { 
              role: "system", 
              content: "Anda adalah Bank Mutation Analysis Engine. Output HANYA JSON yang valid. JANGAN membuat transaksi baru atau mengisi payment_type/category. Category diambil dari chart_of_accounts berdasarkan debit_account_code."
            },
            { role: "user", content: prompt }
          ],
          temperature: 0.2,
          max_tokens: 600,
        }),
      });

      if (!openaiResponse.ok) {
        console.error("OpenAI error:", await openaiResponse.text());
        continue;
      }

      const openaiData = await openaiResponse.json();
      const aiContent = openaiData.choices?.[0]?.message?.content;

      if (!aiContent) {
        continue;
      }

      let analysis;
      try {
        const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("No JSON found");
        }
      } catch (parseError) {
        console.error("Parse error:", parseError, "Content:", aiContent);
        continue;
      }

      // Force ambiguous rules
      if (ambiguous && analysis.confidence >= 60) {
        analysis.confidence = 55;
        analysis.is_ambiguous = true;
      }

      results.push({
        mutation_id: mutation.id,
        source: analysis.source || "AI_ANALYSIS",
        debit_account_code: analysis.debit_account_code,
        credit_account_code: analysis.credit_account_code,
        confidence: analysis.confidence,
        is_ambiguous: analysis.is_ambiguous,
        reasoning: analysis.reasoning,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        count: results.length,
        results: results
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

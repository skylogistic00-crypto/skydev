import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface MutationRow {
  id: string;
  description: string;
  debit: number;
  credit: number;
}

interface COAAccount {
  id: string;
  account_code: string;
  account_name: string;
  account_type: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openaiKey = Deno.env.get("OPEN_AI_KEY");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { upload_id, mutations } = await req.json();

    if (!upload_id || !mutations || mutations.length === 0) {
      return new Response(
        JSON.stringify({ error: "upload_id dan mutations wajib diisi" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get COA accounts
    const { data: coaAccounts, error: coaError } = await supabase
      .from("chart_of_accounts")
      .select("id, account_code, account_name, account_type")
      .order("account_code");

    if (coaError) {
      throw new Error("Gagal memuat data COA");
    }

    // Map mutations to accounts using keyword matching
    const mappedMutations = mutations.map((mutation: MutationRow) => {
      const suggestedAccount = suggestAccount(mutation.description, coaAccounts, mutation.debit > 0);
      const suggestedPos = suggestPos(mutation.description, mutation.debit > 0);
      const suggestedPP = suggestPP(mutation.description);
      
      return {
        id: mutation.id,
        suggested_account_id: suggestedAccount?.id || null,
        suggested_account_code: suggestedAccount?.account_code || null,
        suggested_account_name: suggestedAccount?.account_name || null,
        suggested_pos: suggestedPos,
        suggested_pp: suggestedPP,
        suggested_sub_akun: null,
        suggested_pic: null,
        confidence: suggestedAccount ? 0.7 : 0,
      };
    });

    // If OpenAI key is available, use AI for better mapping
    if (openaiKey) {
      try {
        const aiMappings = await mapWithAI(mutations, coaAccounts, openaiKey);
        if (aiMappings) {
          for (let i = 0; i < mappedMutations.length; i++) {
            if (aiMappings[i]) {
              mappedMutations[i] = {
                ...mappedMutations[i],
                ...aiMappings[i],
                confidence: 0.9,
              };
            }
          }
        }
      } catch (aiError) {
        console.error("AI mapping error:", aiError);
      }
    }

    // Check existing mapping_status before updating
    // ATURAN: AI TIDAK BOLEH override data dengan mapping_status = 'corrected'
    for (const mapping of mappedMutations) {
      if (mapping.suggested_account_id) {
        // Check if mutation has been corrected
        const { data: existingMutation } = await supabase
          .from("bank_mutations")
          .select("mapping_status")
          .eq("id", mapping.id)
          .single();
        
        // Skip if already corrected by user
        if (existingMutation?.mapping_status === "corrected") {
          continue;
        }
        
        await supabase
          .from("bank_mutations")
          .update({
            akun: mapping.suggested_account_code,
            suggested_account_id: mapping.suggested_account_id,
            mapping_status: "auto",
          })
          .eq("id", mapping.id);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        mappings: mappedMutations,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function suggestAccount(description: string, accounts: COAAccount[], isDebit: boolean): COAAccount | null {
  const desc = description.toLowerCase();

  // Keyword mappings
  const keywordMappings: { keywords: string[]; accountPattern: string }[] = [
    { keywords: ["gaji", "salary", "payroll"], accountPattern: "6-1" },
    { keywords: ["listrik", "pln", "electricity"], accountPattern: "6-2" },
    { keywords: ["telepon", "telkom", "internet"], accountPattern: "6-2" },
    { keywords: ["air", "pdam"], accountPattern: "6-2" },
    { keywords: ["sewa", "rent"], accountPattern: "6-3" },
    { keywords: ["asuransi", "insurance"], accountPattern: "6-4" },
    { keywords: ["pajak", "tax", "pph", "ppn"], accountPattern: "2-1" },
    { keywords: ["bunga", "interest"], accountPattern: "7-1" },
    { keywords: ["admin", "administrasi"], accountPattern: "6-5" },
    { keywords: ["transport", "bensin", "bbm", "fuel"], accountPattern: "6-6" },
    { keywords: ["makan", "konsumsi", "meal"], accountPattern: "6-7" },
    { keywords: ["atk", "alat tulis", "stationery"], accountPattern: "6-8" },
    { keywords: ["penjualan", "sales", "pendapatan"], accountPattern: "4-1" },
    { keywords: ["pembelian", "purchase", "beli"], accountPattern: "5-1" },
    { keywords: ["piutang", "receivable"], accountPattern: "1-13" },
    { keywords: ["hutang", "payable", "utang"], accountPattern: "2-1" },
  ];

  for (const mapping of keywordMappings) {
    if (mapping.keywords.some((keyword) => desc.includes(keyword))) {
      const matchedAccount = accounts.find((acc) =>
        acc.account_code.startsWith(mapping.accountPattern)
      );
      if (matchedAccount) return matchedAccount;
    }
  }

  // Default: if debit, suggest expense account; if credit, suggest income account
  if (isDebit) {
    return accounts.find((acc) => acc.account_code.startsWith("6-")) || null;
  } else {
    return accounts.find((acc) => acc.account_code.startsWith("4-")) || null;
  }
}

function suggestPos(description: string, isDebit: boolean): string {
  const desc = description.toLowerCase();
  
  // Keyword to POS mapping
  if (desc.includes("penjualan") || desc.includes("sales") || desc.includes("pendapatan")) {
    return "4"; // Pendapatan
  }
  if (desc.includes("pembelian") || desc.includes("purchase") || desc.includes("hpp")) {
    return "5"; // HPP
  }
  if (desc.includes("gaji") || desc.includes("listrik") || desc.includes("sewa") || 
      desc.includes("transport") || desc.includes("admin") || desc.includes("beban")) {
    return "6"; // Beban Operasional
  }
  if (desc.includes("bunga") || desc.includes("lain")) {
    return "7"; // Pendapatan/Beban Lain
  }
  
  // Default based on debit/credit
  return isDebit ? "6" : "4";
}

function suggestPP(description: string): string {
  const desc = description.toLowerCase();
  
  // Default PP mapping - can be customized
  if (desc.includes("cabang") || desc.includes("branch")) {
    if (desc.includes("1") || desc.includes("satu")) return "PP02";
    if (desc.includes("2") || desc.includes("dua")) return "PP03";
  }
  
  return "PP01"; // Default to Pusat
}

async function mapWithAI(
  mutations: MutationRow[],
  accounts: COAAccount[],
  apiKey: string
): Promise<any[] | null> {
  try {
    const accountList = accounts
      .slice(0, 50)
      .map((a) => `${a.account_code}: ${a.account_name}`)
      .join("\n");

    const mutationList = mutations
      .slice(0, 20)
      .map((m, i) => `${i + 1}. ${m.description} (${m.debit > 0 ? "Debit" : "Kredit"}: ${m.debit || m.credit})`)
      .join("\n");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `Kamu adalah asisten akuntansi. Tugasmu adalah memetakan transaksi bank ke akun COA yang tepat.
            
Daftar Akun COA:
${accountList}

Berikan response dalam format JSON array dengan struktur:
[{"index": 0, "account_code": "6-1001", "account_name": "Beban Gaji"}]`,
          },
          {
            role: "user",
            content: `Petakan transaksi berikut ke akun COA yang tepat:
${mutationList}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error("OpenAI API error");
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (content) {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const mappings = JSON.parse(jsonMatch[0]);
        return mappings.map((m: any) => {
          const account = accounts.find((a) => a.account_code === m.account_code);
          return {
            suggested_account_id: account?.id || null,
            suggested_account_code: m.account_code,
            suggested_account_name: m.account_name || account?.account_name,
          };
        });
      }
    }

    return null;
  } catch (error) {
    console.error("AI mapping error:", error);
    return null;
  }
}

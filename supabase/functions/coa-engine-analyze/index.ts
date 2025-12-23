import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_KEY") || "";
const openaiKey = Deno.env.get("OPENAI_API_KEY") || Deno.env.get("OPEN_AI_KEY") || "";

interface COAAccount {
  id: string;
  account_code: string;
  account_name: string;
  account_type: string;
  parent_code?: string;
  is_postable?: boolean;
}

// Blacklist patterns - NEVER create COA based on these
const BLACKLIST_PATTERNS = [
  /^[A-Z]{1,3}\s*\d{1,4}\s*[A-Z]{0,3}$/i, // Vehicle plates: B 1234 ABC
  /^\d{4,}$/,                               // Serial numbers
  /^SN[\-:]?\d+$/i,                         // Serial number format
  /^IMEI[\-:]?\d+$/i,                       // IMEI numbers
  /^SKU[\-:]?\d+$/i,                        // SKU codes
];

// Financial category mappings for smart categorization
const FINANCIAL_CATEGORIES: Record<string, { parent: string; account_type: string; keywords: string[] }> = {
  "Gaji": { parent: "6-1000", account_type: "Beban", keywords: ["gaji", "salary", "upah", "payroll"] },
  "THR": { parent: "6-1000", account_type: "Beban", keywords: ["thr", "tunjangan hari raya", "bonus tahunan"] },
  "Bonus": { parent: "6-1000", account_type: "Beban", keywords: ["bonus", "insentif", "komisi"] },
  "Listrik": { parent: "6-2000", account_type: "Beban", keywords: ["listrik", "pln", "electricity"] },
  "Air": { parent: "6-2000", account_type: "Beban", keywords: ["pdam", "air", "water"] },
  "Telepon": { parent: "6-2000", account_type: "Beban", keywords: ["telepon", "telpon", "phone", "internet"] },
  "Sewa": { parent: "6-2000", account_type: "Beban", keywords: ["sewa", "rent", "kontrak"] },
  "Transportasi": { parent: "6-2000", account_type: "Beban", keywords: ["transport", "bensin", "solar", "parkir", "tol"] },
  "Makan": { parent: "6-2000", account_type: "Beban", keywords: ["makan", "meal", "catering", "snack"] },
  "ATK": { parent: "6-2000", account_type: "Beban", keywords: ["atk", "alat tulis", "stationery", "kertas", "tinta"] },
  "Pemeliharaan": { parent: "6-2000", account_type: "Beban", keywords: ["maintenance", "perbaikan", "service", "repair"] },
  "Asuransi": { parent: "6-2000", account_type: "Beban", keywords: ["asuransi", "insurance", "premi"] },
  "Pajak": { parent: "6-3000", account_type: "Beban", keywords: ["pajak", "pph", "ppn", "tax"] },
  "Penyusutan": { parent: "6-4000", account_type: "Beban", keywords: ["penyusutan", "depresiasi", "depreciation"] },
  "Penjualan": { parent: "4-0000", account_type: "Pendapatan", keywords: ["penjualan", "sales", "revenue", "pendapatan jual"] },
  "Jasa": { parent: "4-0000", account_type: "Pendapatan", keywords: ["jasa", "service", "fee", "konsultasi"] },
  "Bunga Bank": { parent: "4-2000", account_type: "Pendapatan", keywords: ["bunga", "interest", "jasa giro"] },
  "HPP": { parent: "5-0000", account_type: "HPP", keywords: ["hpp", "harga pokok", "cogs", "cost of goods"] },
  "Piutang": { parent: "1-2000", account_type: "Aset", keywords: ["piutang", "receivable", "tagihan"] },
  "Hutang": { parent: "2-1000", account_type: "Kewajiban", keywords: ["hutang", "utang", "payable", "pinjaman"] },
  "Kas": { parent: "1-1000", account_type: "Aset", keywords: ["kas", "cash", "tunai", "petty cash"] },
  "Bank": { parent: "1-1000", account_type: "Aset", keywords: ["bank", "rekening", "bca", "bri", "mandiri", "bni"] },
  "Persediaan": { parent: "1-3000", account_type: "Aset", keywords: ["persediaan", "inventory", "stok", "stock"] },
  "Modal": { parent: "3-0000", account_type: "Ekuitas", keywords: ["modal", "capital", "ekuitas", "setoran"] },
  // ASSET Categories - for fixed assets
  "Kendaraan": { parent: "1-5000", account_type: "Aset", keywords: ["kendaraan", "mobil", "motor", "truck", "vehicle"] },
  "Peralatan": { parent: "1-5000", account_type: "Aset", keywords: ["peralatan", "equipment", "mesin", "komputer", "laptop"] },
  "Bangunan": { parent: "1-5000", account_type: "Aset", keywords: ["bangunan", "gedung", "building", "kantor"] },
  "Tanah": { parent: "1-5000", account_type: "Aset", keywords: ["tanah", "land", "lahan"] },
};

// Vehicle detection keywords
const VEHICLE_KEYWORDS = ["mobil", "motor", "kendaraan", "truck", "vehicle", "avanza", "innova", "honda", "toyota", "suzuki", "daihatsu", "mitsubishi"];

// Detect if description contains vehicle/asset with specific identifier
function extractVehicleMetadata(description: string): { brand?: string; model?: string; plate_number?: string } | null {
  const lowerDesc = description.toLowerCase();
  const hasVehicleKeyword = VEHICLE_KEYWORDS.some(kw => lowerDesc.includes(kw));
  
  if (!hasVehicleKeyword) return null;
  
  // Extract plate number pattern: B 1234 ABC
  const plateMatch = description.match(/([A-Z]{1,2})\s*(\d{1,4})\s*([A-Z]{0,3})/i);
  
  // Extract brand/model
  let brand = "";
  let model = "";
  const brandKeywords = ["toyota", "honda", "suzuki", "daihatsu", "mitsubishi", "nissan", "hyundai", "kia"];
  for (const b of brandKeywords) {
    if (lowerDesc.includes(b)) {
      brand = b.charAt(0).toUpperCase() + b.slice(1);
      break;
    }
  }
  
  const modelKeywords = ["avanza", "innova", "xenia", "ertiga", "pajero", "fortuner", "brio", "jazz", "hr-v", "cr-v"];
  for (const m of modelKeywords) {
    if (lowerDesc.includes(m)) {
      model = m.charAt(0).toUpperCase() + m.slice(1);
      break;
    }
  }
  
  return {
    brand: brand || undefined,
    model: model || undefined,
    plate_number: plateMatch ? `${plateMatch[1]} ${plateMatch[2]} ${plateMatch[3]}`.trim() : undefined
  };
}

function isBlacklistedDescription(desc: string): boolean {
  const normalized = desc.trim().toUpperCase();
  return BLACKLIST_PATTERNS.some(pattern => pattern.test(normalized));
}

function extractFinancialCategory(description: string): string | null {
  const lowerDesc = description.toLowerCase();
  for (const [category, config] of Object.entries(FINANCIAL_CATEGORIES)) {
    if (config.keywords.some(kw => lowerDesc.includes(kw))) {
      return category;
    }
  }
  return null;
}

function findMatchingCOA(description: string, coaAccounts: COAAccount[]): COAAccount | null {
  const lowerDesc = description.toLowerCase();
  
  // Direct match by account name
  const directMatch = coaAccounts.find(acc => 
    acc.is_postable !== false && 
    lowerDesc.includes(acc.account_name.toLowerCase())
  );
  if (directMatch) return directMatch;
  
  // Match by financial category
  const category = extractFinancialCategory(description);
  if (category && FINANCIAL_CATEGORIES[category]) {
    const parentCode = FINANCIAL_CATEGORIES[category].parent;
    const categoryMatch = coaAccounts.find(acc => 
      acc.is_postable !== false &&
      acc.account_code.startsWith(parentCode.split("-")[0]) &&
      acc.account_name.toLowerCase().includes(category.toLowerCase())
    );
    if (categoryMatch) return categoryMatch;
  }
  
  return null;
}

function getNextAccountCode(parentCode: string, coaAccounts: COAAccount[]): string {
  const prefix = parentCode.split("-")[0];
  const existingCodes = coaAccounts
    .filter(acc => acc.account_code.startsWith(prefix + "-"))
    .map(acc => {
      const parts = acc.account_code.split("-");
      return parts[1] ? parseInt(parts[1]) : 0;
    })
    .filter(num => !isNaN(num))
    .sort((a, b) => b - a);
  
  const nextNumber = (existingCodes[0] || parseInt(parentCode.split("-")[1] || "0")) + 100;
  return `${prefix}-${nextNumber.toString().padStart(4, "0")}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  try {
    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
      return new Response(
        JSON.stringify({ error: "Server configuration error - missing Supabase credentials" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
    
    if (!openaiKey) {
      console.error("Missing OPENAI_API_KEY or OPEN_AI_KEY");
      return new Response(
        JSON.stringify({ error: "Server configuration error - missing OpenAI API key" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
    
    const { description } = body;

    if (!description || typeof description !== "string") {
      return new Response(
        JSON.stringify({ error: "Deskripsi transaksi harus diisi" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Rule: Never create COA from blacklisted patterns
    if (isBlacklistedDescription(description)) {
      return new Response(
        JSON.stringify({ 
          error: "Deskripsi tidak valid untuk COA",
          reasoning: "COA tidak boleh dibuat berdasarkan nama produk, nomor plat kendaraan, atau nomor seri. Gunakan kategori finansial."
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Fetch all COA accounts
    const { data: coaAccounts, error: coaError } = await supabase
      .from("chart_of_accounts")
      .select("id, account_code, account_name, account_type, parent_code, is_postable")
      .eq("is_active", true)
      .order("account_code");

    if (coaError) {
      console.error("COA fetch error:", coaError);
      return new Response(
        JSON.stringify({ error: "Gagal mengambil data COA" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Try to find existing matching COA first (REUSE LOGIC)
    const existingMatch = findMatchingCOA(description, coaAccounts || []);
    const financialCategory = extractFinancialCategory(description);
    
    // Check for vehicle/asset metadata
    const vehicleMetadata = extractVehicleMetadata(description);
    const isAssetWithVehicle = vehicleMetadata && (vehicleMetadata.plate_number || vehicleMetadata.brand);
    
    // Build COA list for AI
    const coaList = (coaAccounts || []).map((acc: COAAccount) => 
      `${acc.account_code} - ${acc.account_name} (${acc.account_type})`
    ).join("\n");

    // Smart AI Prompt with strict rules
    const prompt = `Anda adalah asisten akuntansi Indonesia profesional. Analisis deskripsi transaksi berikut.

ATURAN WAJIB:
1. COA adalah KATEGORI FINANSIAL, bukan item atau aset spesifik
2. JANGAN PERNAH buat COA berdasarkan: nama produk, nomor plat kendaraan, nomor seri, merk barang
3. PRIORITASKAN menggunakan akun COA yang SUDAH ADA
4. Hanya sarankan akun BARU jika kategori finansial benar-benar belum ada
5. Jika confidence < 0.7, WAJIB set action_taken = "needs_review"

CONTOH BENAR:
- "Bensin mobil B1234ABC" → Gunakan "Beban Transportasi" yang sudah ada
- "Beli laptop Dell XPS 15" → Gunakan "Peralatan Kantor" yang sudah ada
- "Gaji karyawan bulan Mei" → Gunakan "Beban Gaji" yang sudah ada

CONTOH SALAH (JANGAN LAKUKAN):
- "Bensin mobil B1234ABC" → JANGAN buat akun "Bensin Mobil B1234ABC"
- "Beli laptop Dell XPS 15" → JANGAN buat akun "Laptop Dell XPS 15"

Deskripsi Transaksi: "${description}"

Daftar COA yang tersedia:
${coaList}

${existingMatch ? `\n🔍 REKOMENDASI: Akun "${existingMatch.account_name}" (${existingMatch.account_code}) sudah tersedia dan cocok.` : ""}
${financialCategory ? `\n📁 KATEGORI TERDETEKSI: ${financialCategory}` : ""}

Berikan respons dalam format JSON:
{
  "intent": "deskripsi intent transaksi dalam bahasa Indonesia",
  "financial_category": "kategori finansial (misal: Beban Gaji, Beban Utilitas, Pendapatan Jasa, dll)",
  "intent_code": "kode intent (SALARY, EXPENSE, REVENUE, PURCHASE, dll)",
  "selected_account_code": "kode akun COA yang dipilih (dari daftar yang ada atau baru)",
  "suggested_account_name": "nama akun",
  "action_taken": "reused | auto_created | needs_review",
  "confidence": angka 0-1,
  "reasoning": "penjelasan singkat",
  "parent_account": "kode parent jika membuat akun baru"
}

PENTING: 
- Jika ada akun cocok, gunakan action_taken = "reused"
- Jika harus buat baru DAN confidence >= 0.7, gunakan action_taken = "auto_created"
- Jika ragu atau confidence < 0.7, gunakan action_taken = "needs_review"`;

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Anda adalah asisten akuntansi Indonesia profesional. COA adalah kategori finansial, BUKAN item spesifik. Prioritaskan REUSE akun yang ada. Selalu respons dalam format JSON yang valid." },
          { role: "user", content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 600,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error("OpenAI error:", errorText);
      return new Response(
        JSON.stringify({ error: "Gagal menganalisis dengan AI" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const openaiData = await openaiResponse.json();
    const aiContent = openaiData.choices?.[0]?.message?.content;

    if (!aiContent) {
      return new Response(
        JSON.stringify({ error: "Tidak ada respons dari AI" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Parse AI response
    let analysis;
    try {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Parse error:", parseError, "Content:", aiContent);
      return new Response(
        JSON.stringify({ error: "Gagal parsing respons AI" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // SMART LOGIC: Override action_taken based on confidence
    let actionTaken = analysis.action_taken || "needs_review";
    const confidence = parseFloat(analysis.confidence) || 0;
    
    // Rule: If confidence < 0.7, force needs_review
    if (confidence < 0.7) {
      actionTaken = "needs_review";
    }
    
    // Rule: If we found an existing match, force reused
    if (existingMatch && actionTaken !== "needs_review") {
      actionTaken = "reused";
      analysis.selected_account_code = existingMatch.account_code;
      analysis.suggested_account_name = existingMatch.account_name;
    }
    
    // Rule: If auto_created, calculate the next account code
    let suggestedAccountCode = analysis.selected_account_code || analysis.suggested_account_code;
    if (actionTaken === "auto_created" && analysis.parent_account) {
      suggestedAccountCode = getNextAccountCode(analysis.parent_account, coaAccounts || []);
    }

    // Save suggestion to database
    const { data: suggestion, error: insertError } = await supabase
      .from("coa_suggestions")
      .insert({
        description,
        intent: analysis.intent || description,
        intent_code: analysis.intent_code,
        parent_account: analysis.parent_account,
        suggested_account_name: analysis.suggested_account_name,
        suggested_account_code: suggestedAccountCode,
        confidence: confidence,
        reasoning: analysis.reasoning,
        status: actionTaken === "needs_review" ? "needs_review" : "pending",
        financial_category: analysis.financial_category || financialCategory,
        action_taken: actionTaken,
        selected_account_code: suggestedAccountCode,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
    }

    // ASSET + VEHICLE handling: Always REUSE COA, return vehicle metadata
    if (isAssetWithVehicle && analysis.intent_code === "ASSET") {
      // Find existing Kendaraan COA
      const vehicleCOA = (coaAccounts || []).find((acc: COAAccount) => 
        acc.account_name.toLowerCase().includes("kendaraan") && acc.is_postable !== false
      );
      
      if (vehicleCOA) {
        actionTaken = "reused";
        suggestedAccountCode = vehicleCOA.account_code;
        analysis.suggested_account_name = vehicleCOA.account_name;
      }
    }

    // Return result with new contract
    const result = {
      id: suggestion?.id,
      intent: analysis.intent || description,
      intent_code: analysis.intent_code,
      financial_category: analysis.financial_category || financialCategory,
      selected_account_code: suggestedAccountCode,
      suggested_account_name: analysis.suggested_account_name,
      suggested_account_code: suggestedAccountCode,
      parent_account: analysis.parent_account,
      action_taken: actionTaken,
      confidence: confidence,
      reasoning: analysis.reasoning,
      status: actionTaken === "needs_review" ? "needs_review" : "pending",
      // Include vehicle metadata if detected
      ...(isAssetWithVehicle && {
        asset_category: "Vehicle",
        vehicle_metadata: vehicleMetadata,
      }),
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

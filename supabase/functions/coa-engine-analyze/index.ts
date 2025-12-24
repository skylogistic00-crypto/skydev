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
  
  // Sort by length to prioritize longer (more specific) matches
  const sortedAccounts = [...coaAccounts].sort((a, b) => 
    b.account_name.length - a.account_name.length
  );
  
  // Only match if there's a very specific match
  const directMatch = sortedAccounts.find(acc => {
    if (acc.is_postable === false) return false;
    
    const accNameLower = acc.account_name.toLowerCase();
    
    // EXACT match only - no partial matching
    // This prevents "Bank" from matching "Bank Syariah Indonesia"
    return lowerDesc === accNameLower;
  });
  
  return directMatch || null;
}

function getNextAccountCode(parentCode: string, coaAccounts: COAAccount[]): string {
  const [prefix, parentNumStr] = parentCode.split("-");
  const parentNumber = parseInt(parentNumStr || "0");
  
  // Find all DIRECT child accounts under this parent
  // For parent 1-1000, we want 1-1001, 1-1002, etc (range 1001-1999)
  // NOT 1-2000, 1-3000 (those are different parent categories)
  
  const maxRangeEnd = Math.floor(parentNumber / 1000) * 1000 + 999;
  
  const existingCodes = coaAccounts
    .filter(acc => {
      const [accPrefix, accNumStr] = acc.account_code.split("-");
      const accNum = parseInt(accNumStr || "0");
      
      // Same prefix AND within the same thousand range as parent
      return accPrefix === prefix && 
             accNum > parentNumber && 
             accNum <= maxRangeEnd;
    })
    .map(acc => parseInt(acc.account_code.split("-")[1] || "0"))
    .sort((a, b) => b - a);
  
  // Next number should be close to parent, increment by 1
  const nextNumber = existingCodes.length > 0 ? existingCodes[0] + 1 : parentNumber + 1;
  
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

    // Smart AI Prompt with intelligent account name extraction
    const prompt = `Anda adalah asisten akuntansi Indonesia profesional. Analisis deskripsi transaksi berikut.

ATURAN UTAMA:
1. Jika ada akun COA yang PERSIS SAMA dengan deskripsi, gunakan akun tersebut (action_taken = "reused")
2. Jika TIDAK ADA akun yang persis sama, BUAT AKUN BARU dengan nama berdasarkan deskripsi transaksi (action_taken = "auto_created")
3. Ekstrak nama akun yang SPESIFIK dari deskripsi transaksi untuk akun baru

ATURAN PENAMAAN AKUN BARU:
- Hilangkan kata-kata umum seperti "Rekening", "Transfer", "dari", "ke" dari nama akun
- Nama akun harus jelas dan spesifik
- Contoh: "Rekening Bank Syariah Indonesia" → "Bank Syariah Indonesia"
- Contoh: "Pembukaan rekening Bank Mandiri" → "Bank Mandiri"
- Contoh: "Tabungan BRI Cabang Jakarta" → "Bank BRI Cabang Jakarta"
- Contoh: "Gaji Karyawan" → gunakan "Beban Gaji" jika sudah ada, atau "Beban Gaji" jika baru

ATURAN PARENT ACCOUNT:
- WAJIB tentukan parent_account yang TEPAT berdasarkan jenis akun
- Bank/Rekening → parent: "1-1000" (Kas dan Bank)
- Kas/Tunai → parent: "1-1000" (Kas dan Bank)
- Piutang → parent: "1-2000" (Piutang Usaha)
- Persediaan → parent: "1-3000" (Persediaan)
- Aset Tetap → parent: "1-5000" (Aset Tetap)
- Hutang → parent: "2-1000" (Hutang Usaha)
- Modal → parent: "3-0000" (Modal)
- Pendapatan → parent: "4-0000" (Pendapatan Usaha)
- HPP → parent: "5-0000" (Harga Pokok Penjualan)
- Beban Gaji → parent: "6-1000" (Beban Gaji & Tunjangan)
- Beban Operasional → parent: "6-2000" (Beban Operasional)

Deskripsi Transaksi: "${description}"

Daftar COA yang tersedia:
${coaList}

${existingMatch ? `\n🔍 MATCH PERSIS DITEMUKAN: Akun "${existingMatch.account_name}" (${existingMatch.account_code}) persis sama dengan deskripsi. Gunakan ini.` : ""}
${financialCategory ? `\n📁 KATEGORI TERDETEKSI: ${financialCategory}` : ""}

Berikan respons dalam format JSON:
{
  "intent": "deskripsi intent transaksi dalam bahasa Indonesia",
  "financial_category": "kategori finansial",
  "intent_code": "kode intent (BANK_ACCOUNT, CASH_ACCOUNT, EXPENSE, REVENUE, ASSET, dll)",
  "selected_account_code": "${existingMatch ? existingMatch.account_code : 'BARU (akan digenerate otomatis)'}",
  "suggested_account_name": "${existingMatch ? existingMatch.account_name : 'NAMA SPESIFIK dari deskripsi'}",
  "action_taken": "${existingMatch ? 'reused' : 'auto_created'}",
  "confidence": angka 0-1,
  "reasoning": "penjelasan singkat",
  "parent_account": "${existingMatch && existingMatch.parent_code ? existingMatch.parent_code : 'WAJIB isi dengan parent code yang tepat (contoh: 1-1000 untuk Bank, 1-2000 untuk Piutang, 6-1000 untuk Beban Gaji)'}"
}

PENTING: 
- Jika existingMatch ditemukan, WAJIB gunakan action_taken = "reused" dan gunakan data dari existingMatch
- Jika TIDAK ada existingMatch, suggested_account_name WAJIB diambil dari deskripsi transaksi (bukan nama generik)
- parent_account WAJIB diisi dengan kode yang tepat sesuai jenis akun (lihat aturan parent account di atas)`;

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Anda adalah asisten akuntansi Indonesia profesional. Jika ada akun COA yang persis sama dengan deskripsi, gunakan akun tersebut (reused). Jika tidak ada, buat akun baru dengan nama spesifik dari deskripsi (bukan nama generik seperti 'Bank' atau 'Kas' saja). Selalu respons dalam format JSON yang valid." },
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

    // SMART LOGIC: Override action_taken based on existingMatch and confidence
    let actionTaken = analysis.action_taken || "needs_review";
    const confidence = parseFloat(analysis.confidence) || 0;
    
    // Rule: If confidence < 0.7, force needs_review
    if (confidence < 0.7) {
      actionTaken = "needs_review";
    }
    
    // Rule: If we found an exact match, force reused
    if (existingMatch && actionTaken !== "needs_review") {
      actionTaken = "reused";
      analysis.selected_account_code = existingMatch.account_code;
      analysis.suggested_account_name = existingMatch.account_name;
      if (existingMatch.parent_code) {
        analysis.parent_account = existingMatch.parent_code;
      }
    }
    // Rule: If NO exact match found, force auto_created
    else if (!existingMatch && actionTaken !== "needs_review") {
      actionTaken = "auto_created";
      // Use AI's suggested_account_name from the description
      // Do NOT override with generic names
    }
    
    // Rule: If auto_created, calculate the next account code
    let suggestedAccountCode = analysis.selected_account_code || analysis.suggested_account_code;
    if (actionTaken === "auto_created" && analysis.parent_account) {
      suggestedAccountCode = getNextAccountCode(analysis.parent_account, coaAccounts || []);
    }
    
    // CRITICAL FIX: If account code is selected but parent_account is missing, fetch it from DB
    if (suggestedAccountCode && !analysis.parent_account) {
      const selectedCOA = (coaAccounts || []).find((acc: COAAccount) => 
        acc.account_code === suggestedAccountCode
      );
      if (selectedCOA && selectedCOA.parent_code) {
        analysis.parent_account = selectedCOA.parent_code;
      }
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
        // CRITICAL FIX: Set parent_account from existing COA
        if (vehicleCOA.parent_code) {
          analysis.parent_account = vehicleCOA.parent_code;
        }
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

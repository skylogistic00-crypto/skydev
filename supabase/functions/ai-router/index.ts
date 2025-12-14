import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json"
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      status: 204, 
      headers: CORS 
    });
  }

  try {
    const { prompt, role } = await req.json().catch(() => ({}));

    if (!prompt) {
      return new Response(JSON.stringify({ error: "Prompt required" }), {
        status: 400,
        headers: CORS
      });
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") || Deno.env.get("OPEN_AI_KEY");
    if (!OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: "Missing OPENAI_API_KEY" }), {
        status: 500,
        headers: CORS
      });
    }

    // Get Supabase client for database queries
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get allowed tables from ai_allowed_tables
    const { data: allowedTables } = await supabase
      .from("ai_allowed_tables")
      .select("table_name, allowed_columns");

    const tableInfo = allowedTables?.map(t => {
      const columns = Array.isArray(t.allowed_columns) 
        ? t.allowed_columns.join(", ") 
        : (typeof t.allowed_columns === 'string' ? t.allowed_columns : '*');
      return `- ${t.table_name}: ${columns}`;
    }).join("\n") || "No tables available";

    // Get current date info for time-based queries
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const firstDayOfMonth = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
    const lastDayOfMonth = new Date(currentYear, currentMonth, 0).toISOString().split('T')[0];

    const systemPrompt = `You are a SQL generator for Supabase Postgres database.
Available tables and columns:
${tableInfo}

IMPORTANT column mappings:
- kas_transaksi: use "nominal" for amount/value (NOT "jumlah")
- kas_transaksi: use "payment_type" for transaction type ('Penerimaan Kas' or 'Pengeluaran Kas')
- kas_transaksi: use "tanggal" for date filtering
- cash_disbursement: use "amount" for amount (NOT "jumlah")
- cash_and_bank_receipts: use "jumlah" for amount
- stock: use "quantity" for stock quantity, "item_name" for item name, "warehouse_id" for warehouse
- stock: for "stok gudang" or "stock gudang", query from stock table
- warehouses: use "name" for warehouse name, "code" for warehouse code
- warehouses: for "jumlah gudang" or "berapa gudang", use: SELECT COUNT(*) as count FROM warehouses

TIME CONTEXT (use for "bulan ini", "this month", etc):
- Current date: ${now.toISOString().split('T')[0]}
- First day of current month: ${firstDayOfMonth}
- Last day of current month: ${lastDayOfMonth}

Rules:
1. Only generate SELECT queries
2. ONLY use the exact column names listed above - do NOT guess column names
3. Return ONLY the SQL query, no explanations
4. Use proper PostgreSQL syntax
5. Always limit results to 100 rows max (except for COUNT queries)
6. For kas_transaksi totals, use SUM(nominal) not SUM(jumlah)
7. When user says "bulan ini" or "this month", filter: tanggal >= '${firstDayOfMonth}' AND tanggal <= '${lastDayOfMonth}'
8. COALESCE SUM results to 0 to avoid null: COALESCE(SUM(nominal), 0)
9. For "stok gudang" or "berapa stok", use: SELECT item_name, quantity, unit FROM stock LIMIT 100
10. For "jumlah gudang" or "berapa gudang", use: SELECT COUNT(*) as count FROM warehouses
11. For COUNT queries, always use "as count" alias for the result column`;

    // Call OpenAI API directly
    const ai = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ]
      })
    });

    const json = await ai.json();

    if (!ai.ok) {
      console.error("OpenAI API error:", json);
      return new Response(JSON.stringify({ error: json.error?.message || "OpenAI API error" }), {
        status: ai.status,
        headers: CORS
      });
    }

    let sql = json.choices?.[0]?.message?.content || "";
    
    // Clean up SQL (remove markdown code blocks, backticks, and trailing semicolons)
    sql = sql.replace(/```sql\n?/gi, "").replace(/```\n?/gi, "").replace(/`/g, "").trim();
    // Remove trailing semicolon - Postgres RPC doesn't need it
    if (sql.endsWith(";")) {
      sql = sql.slice(0, -1);
    }

    // Role-based access control
    if (role !== "super_admin") {
      const modifyingOperations = /\b(insert|update|delete|drop|truncate|alter|create)\b/i;
      if (modifyingOperations.test(sql)) {
        return new Response(JSON.stringify({
          error: "You are not allowed to modify data. Only super_admin can perform INSERT/UPDATE/DELETE operations.",
          sql
        }), {
          status: 403,
          headers: CORS
        });
      }
    }

    // Execute the SQL query
    console.log("=== AI QUERY DEBUG ===");
    console.log("User prompt:", prompt);
    console.log("Generated SQL:", sql);
    
    const { data: queryResult, error: queryError } = await supabase.rpc("execute_sql", {
      query: sql
    });

    console.log("Query result:", JSON.stringify(queryResult, null, 2));
    console.log("Query error:", queryError);
    console.log("=== END DEBUG ===");

    if (queryError) {
      console.error("SQL execution error:", queryError);
      return new Response(JSON.stringify({ 
        sql, 
        error: queryError.message,
        explanation: "Query generated but failed to execute",
        debug: {
          prompt,
          generatedSQL: sql
        }
      }), {
        headers: CORS
      });
    }

    // Check if user wants numeric-only answer or uses gaul language
    const numericOnlyKeywords = [
      "angka saja", "hanya angka", "berikan angka", "jawab angka",
      "numeric only", "only number", "langsung angka", "direct angka",
      "singkat saja", "langsung saja", "tidak usah panjang", "jangan panjang",
      "brp", "berapa saja"
    ];
    
    // Detect gaul/slang patterns that expect short answers
    const gaulPatterns = [
      /bro\s+(kas|saldo|total|pengeluaran|pemasukan)/i,
      /cu\s+(kas|saldo|total|pengeluaran|pemasukan)/i,
      /lapkeu/i,
      /saldo\s*(skrg|sekarang)?\s*brp/i,
      /brp\s*(sih|ya|dong)?$/i
    ];
    const isGaulShortQuery = gaulPatterns.some(pattern => pattern.test(prompt));
    
    const wantsNumericOnly = numericOnlyKeywords.some(keyword => 
      prompt.toLowerCase().includes(keyword)
    ) || isGaulShortQuery;

    // If numeric-only requested, return direct result
    if (wantsNumericOnly) {
      // Extract numeric value from result
      let directAnswer = "";
      if (Array.isArray(queryResult) && queryResult.length > 0) {
        const firstRow = queryResult[0];
        const values = Object.values(firstRow);
        // Get numeric values
        const numericValues = values.filter(v => typeof v === 'number' || !isNaN(Number(v)));
        if (numericValues.length > 0) {
          directAnswer = numericValues.map(v => Number(v).toLocaleString('id-ID')).join(", ");
        } else {
          directAnswer = values.join(", ");
        }
      }
      
      return new Response(JSON.stringify({ 
        result: queryResult,
        explanation: directAnswer || "0",
        directAnswer: true
      }), {
        headers: CORS
      });
    }

    // Generate explanation for normal requests using Indonesian financial AI rules
    const financialKeywords = [
      "pengeluaran", "pemasukan", "kas", "saldo", "cash", "laporan", "keuangan",
      "laba", "rugi", "rekap", "transaksi", "biaya", "pendapatan", "tagihan",
      "invoice", "bayar", "keuntungan", "profit", "total", "jumlah", "brp", "berapa"
    ];
    const isFinancialQuery = financialKeywords.some(kw => prompt.toLowerCase().includes(kw));

    // Extract numeric result directly
    let numericAnswer = "0";
    if (Array.isArray(queryResult) && queryResult.length > 0) {
      const firstRow = queryResult[0];
      const values = Object.values(firstRow);
      const numericValues = values.filter(v => v !== null && (typeof v === 'number' || !isNaN(Number(v))));
      if (numericValues.length > 0) {
        numericAnswer = numericValues.map(v => {
          const num = Number(v);
          return num.toLocaleString('id-ID');
        }).join(", ");
      }
    }

    // For financial queries, return short answer directly
    if (isFinancialQuery) {
      // Format simple response
      let shortAnswer = numericAnswer;
      if (numericAnswer === "0" || numericAnswer === "") {
        shortAnswer = "Tidak ada data";
      } else {
        // Add "Rp" prefix for monetary values
        shortAnswer = `Rp ${numericAnswer}`;
      }
      
      return new Response(JSON.stringify({ 
        result: queryResult,
        explanation: shortAnswer
      }), {
        headers: CORS
      });
    }

    const explanationPrompt = `Jelaskan hasil query ini dalam Bahasa Indonesia singkat (maksimal 1 kalimat):
Result: ${JSON.stringify(queryResult).substring(0, 300)}
JANGAN tampilkan SQL atau kode. Hanya jawaban singkat.`;

    const explanationResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: explanationPrompt }],
        temperature: 0.7
      })
    });

    const explanationJson = await explanationResponse.json();
    const explanation = explanationJson.choices?.[0]?.message?.content || "Data berhasil diambil.";

    return new Response(JSON.stringify({ 
      result: queryResult,
      explanation 
    }), {
      headers: CORS
    });

  } catch (error) {
    console.error("AI Router error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: CORS
    });
  }
});

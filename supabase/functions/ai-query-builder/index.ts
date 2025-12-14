import { corsHeaders } from "@shared/cors.ts";

const FORBIDDEN_KEYWORDS = [
  "update",
  "delete",
  "drop",
  "truncate",
  "alter",
  "insert",
  "create",
  "grant",
  "revoke",
];

function validateQuery(query: string): { valid: boolean; error?: string } {
  const lowerQuery = query.toLowerCase().trim();

  // Must start with SELECT
  if (!lowerQuery.startsWith("select")) {
    return { valid: false, error: "Only SELECT queries are allowed" };
  }

  // Check for forbidden keywords
  for (const keyword of FORBIDDEN_KEYWORDS) {
    const regex = new RegExp(`\\b${keyword}\\b`, "i");
    if (regex.test(lowerQuery)) {
      return {
        valid: false,
        error: `Forbidden keyword detected: ${keyword.toUpperCase()}`,
      };
    }
  }

  // Ensure LIMIT exists for safety
  if (!lowerQuery.includes("limit")) {
    return {
      valid: false,
      error: "Query must include LIMIT clause for safety",
    };
  }

  return { valid: true };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  try {
    const { prompt, direct_query } = await req.json();

    // Get user role from auth token
    const authHeader = req.headers.get("Authorization");
    let userRole = null;
    
    if (authHeader) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_KEY")!;
      
      try {
        const userResponse = await fetch(`${supabaseUrl}/rest/v1/users?select=role`, {
          headers: {
            "Content-Type": "application/json",
            apikey: supabaseKey,
            Authorization: authHeader,
          },
        });
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          userRole = userData?.[0]?.role;
        }
      } catch (e) {
        console.error("Failed to fetch user role:", e);
      }
    }

    const OPENAI_KEY = Deno.env.get("OPEN_AI_KEY");

    // If direct_query is provided, execute it directly
    if (direct_query) {
      // Role-based access control for direct queries
      if (userRole !== "super_admin") {
        const modifyingOperations = /\b(insert|update|delete|drop|truncate|alter|create)\b/i;
        if (modifyingOperations.test(direct_query)) {
          return new Response(
            JSON.stringify({
              error: "You are not allowed to modify data. Only super_admin can perform INSERT/UPDATE/DELETE operations.",
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 403,
            }
          );
        }
      }

      const validation = validateQuery(direct_query);
      if (!validation.valid) {
        return new Response(
          JSON.stringify({ error: validation.error }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
          }
        );
      }

      // Execute query via Supabase
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_KEY")!;

      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/execute_sql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ query_text: direct_query }),
      });

      const data = await response.json();
      return new Response(JSON.stringify({ data, query: direct_query }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Generate SQL from natural language using OpenAI
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "prompt or direct_query is required" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    const systemPrompt = `You are a SQL query generator for a business application with these tables:
- users (id, email, name, role, entity_id, is_active, created_at)
- kas_transaksi (id, tanggal, jenis, kategori, jumlah, keterangan, status, created_at)
- sales_transactions (id, transaction_date, customer_id, total_amount, status, created_at)
- purchase_transactions (id, transaction_date, supplier_id, total_amount, status, created_at)
- stock (id, item_name, brand, quantity, unit_price, warehouse_id, created_at)
- journal_entries (id, entry_date, description, total_amount, status, created_at)
- general_ledger (id, account_code, account_name, debit, credit, balance, period)
- employees (id, name, position_id, department_id, salary, status, hire_date)
- customers (id, name, email, phone, address, created_at)
- suppliers (id, name, email, phone, address, is_pkp, created_at)

Rules:
1. ONLY generate SELECT queries
2. ALWAYS include LIMIT (max 100)
3. Use appropriate JOINs when needed
4. Use date functions for date filtering
5. Return ONLY the SQL query, no explanation

User request: ${prompt}`;

    let sqlQuery = "";

    // Use direct OpenAI API
    if (OPENAI_KEY) {
      const openaiResponse = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENAI_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: prompt },
            ],
            max_tokens: 500,
            temperature: 0.1,
          }),
        }
      );

      if (openaiResponse.ok) {
        const openaiData = await openaiResponse.json();
        sqlQuery = openaiData.choices?.[0]?.message?.content?.trim() || "";
      }
    }

    if (!sqlQuery) {
      return new Response(
        JSON.stringify({ error: "Failed to generate SQL query" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    // Clean SQL query (remove markdown code blocks if present)
    sqlQuery = sqlQuery.replace(/```sql\n?/gi, "").replace(/```\n?/gi, "").trim();

    // Role-based access control for data modification
    if (userRole !== "super_admin") {
      const modifyingOperations = /\b(insert|update|delete|drop|truncate|alter|create)\b/i;
      if (modifyingOperations.test(sqlQuery)) {
        return new Response(
          JSON.stringify({
            error: "You are not allowed to modify data. Only super_admin can perform INSERT/UPDATE/DELETE operations.",
            generated_query: sqlQuery,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 403,
          }
        );
      }
    }

    // Validate generated query
    const validation = validateQuery(sqlQuery);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({
          error: validation.error,
          generated_query: sqlQuery,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    return new Response(
      JSON.stringify({
        query: sqlQuery,
        message: "Query generated successfully. Use direct_query to execute.",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("AI Query Builder error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

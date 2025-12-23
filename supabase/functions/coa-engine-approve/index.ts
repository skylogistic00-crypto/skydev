import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

// Helper function to determine account type based on intent code
// Must match check constraint: 'Aset', 'Kewajiban', 'Ekuitas', 'Pendapatan', 'Beban Pokok Penjualan', 'Beban Operasional', 'Pendapatan & Beban Lain-lain'
function getAccountType(intentCode: string): string {
  const mapping: Record<string, string> = {
    "SALARY": "Beban Operasional",
    "EXPENSE": "Beban Operasional",
    "REVENUE": "Pendapatan",
    "ASSET": "Aset",
    "LIABILITY": "Kewajiban",
    "EQUITY": "Ekuitas",
    "PAYABLE": "Kewajiban",
    "RECEIVABLE": "Aset",
    "INVENTORY": "Aset",
    "FIXED_ASSET": "Aset",
    "DEPRECIATION": "Beban Operasional",
    "COST_OF_GOODS": "Beban Pokok Penjualan",
    "TAX": "Beban Operasional",
    "OTHER_INCOME": "Pendapatan & Beban Lain-lain",
    "OTHER_EXPENSE": "Pendapatan & Beban Lain-lain",
    "THR": "Beban Operasional",
    "LOAN": "Kewajiban",
    "LOAN_PAYMENT": "Kewajiban",
    "LOAN_RECEIVED": "Kewajiban",
    "HUTANG": "Kewajiban",
    "PINJAMAN": "Kewajiban",
    "DEBT": "Kewajiban",
  };
  return mapping[intentCode] || "Beban Operasional";
}

// Helper function to determine normal balance based on account type
function getNormalBalance(accountType: string): string {
  const debitTypes = ["Aset", "Beban Pokok Penjualan", "Beban Operasional"];
  const creditTypes = ["Kewajiban", "Ekuitas", "Pendapatan"];
  
  if (debitTypes.includes(accountType)) return "Debit";
  if (creditTypes.includes(accountType)) return "Kredit";
  
  // For "Pendapatan & Beban Lain-lain", determine by account code
  // 4-xxxx = Pendapatan (Credit), 6-xxxx or 5-xxxx = Beban (Debit)
  if (accountType === "Pendapatan & Beban Lain-lain") {
    return "Kredit"; // Default to Credit for mixed accounts
  }
  
  return "Kredit"; // Default to Credit for other types
}

// Helper function to get level based on parent account
function getAccountLevel(parentCode: string | null): number {
  // Always set level to 3 for COA Engine created accounts
  return 3;
}

// Helper function to determine trans_type based on account_code
function getTransType(accountCode: string): string | null {
  if (accountCode.startsWith("1-")) return "asset";
  if (accountCode.startsWith("2-")) return "liability";
  if (accountCode.startsWith("3-")) return "equity";
  if (accountCode.startsWith("4-")) return "revenue";
  if (accountCode.startsWith("5-") || accountCode.startsWith("6-")) return "expense";
  return null;
}

// Helper function to determine flow_type based on account_code
function getFlowType(accountCode: string): string | null {
  // Kas accounts (1-11xx)
  if (accountCode.startsWith("1-11")) return "cash";
  // Bank accounts (1-12xx)
  if (accountCode.startsWith("1-12")) return "bank";
  return null;
}

// Helper function to determine usage_role based on account_code and account_name
function getUsageRole(accountCode: string, accountName: string): string | null {
  // Revenue accounts
  if (accountCode.startsWith("4-1")) return "pendapatan_jasa";
  if (accountCode.startsWith("4-2")) return "pendapatan_barang";
  if (accountCode.startsWith("4-9")) return "other";
  
  // Expense accounts
  if (accountCode.startsWith("5-")) return "hpp";
  if (accountCode.startsWith("6-1")) return "beban_operasional";
  if (accountCode.startsWith("6-2")) return "beban_kendaraan";
  if (accountCode.startsWith("6-9")) return "beban_lain";
  
  // Asset accounts
  if (accountCode.startsWith("1-14")) return "inventory";
  if (accountCode.startsWith("1-13")) return "piutang";
  if (accountCode.startsWith("1-11")) return "cash";
  if (accountCode.startsWith("1-12")) return "cash_and_bank";
  
  // Liability accounts
  if (accountCode.startsWith("2-")) return "hutang";
  
  return "other";
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_KEY") || "";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  try {
    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
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
    
    const { id } = body;

    if (!id) {
      return new Response(
        JSON.stringify({ error: "Missing suggestion ID" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Get user ID from auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    // Get suggestion details first
    const { data: suggestion, error: fetchError } = await supabase
      .from("coa_suggestions")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !suggestion) {
      console.error("Fetch error:", fetchError);
      return new Response(
        JSON.stringify({ error: "Suggestion not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    // Update suggestion status
    const { data: updated, error: updateError } = await supabase
      .from("coa_suggestions")
      .update({
        status: "approved",
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Update error:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to approve suggestion" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Auto-increment account code if it already exists
    let finalAccountCode = suggestion.suggested_account_code;
    let codeIncrement = 1;
    
    while (true) {
      const { data: existingAccount } = await supabase
        .from("chart_of_accounts")
        .select("id, account_code")
        .eq("account_code", finalAccountCode)
        .maybeSingle();

      if (!existingAccount) {
        // Code is available
        break;
      }

      console.log("Account code exists:", finalAccountCode, "- incrementing...");
      
      // Parse the code format: 6-1300
      const parts = suggestion.suggested_account_code.split("-");
      if (parts.length === 2) {
        const prefix = parts[0];
        const baseNumber = parseInt(parts[1]);
        const newNumber = baseNumber + codeIncrement;
        finalAccountCode = `${prefix}-${newNumber.toString().padStart(parts[1].length, '0')}`;
      } else {
        // Fallback: append number
        finalAccountCode = `${suggestion.suggested_account_code}-${codeIncrement}`;
      }
      
      codeIncrement++;
      
      // Safety: max 100 iterations
      if (codeIncrement > 100) {
        return new Response(JSON.stringify({
          ...updated,
          chart_of_accounts_created: false,
          warning: `Could not find available account code after 100 attempts`
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    }

    console.log("Final account code:", finalAccountCode);

    // Insert into chart_of_accounts
    const accountType = getAccountType(suggestion.intent_code);
    const insertData = {
      account_code: finalAccountCode,
      account_name: suggestion.suggested_account_name,
      account_type: accountType,
      parent_code: suggestion.parent_account || null,
      level: 3, // Always set level to 3 for COA Engine created accounts
      is_header: false,
      normal_balance: getNormalBalance(accountType),
      is_active: true,
      is_postable: true,
      description: suggestion.description || suggestion.suggested_account_name,
      trans_type: getTransType(finalAccountCode),
      flow_type: getFlowType(finalAccountCode),
      usage_role: getUsageRole(finalAccountCode, suggestion.suggested_account_name),
    };
    
    console.log("Insert data:", insertData);
    
    const { data: newAccount, error: insertError } = await supabase
      .from("chart_of_accounts")
      .insert(insertData)
      .select()
      .single();
    
    console.log("Insert result:", { newAccount, insertError });

    if (insertError) {
      console.error("Insert to chart_of_accounts error:", insertError);
      // Don't fail completely, the approval was successful
      return new Response(
        JSON.stringify({ 
          ...updated, 
          warning: "Approved but failed to create account: " + insertError.message,
          chart_of_accounts_created: false 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    return new Response(JSON.stringify({
      ...updated,
      chart_of_accounts_created: true,
      new_account: newAccount,
      code_incremented: finalAccountCode !== suggestion.suggested_account_code,
      final_account_code: finalAccountCode
    }), {
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

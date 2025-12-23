import { corsHeaders } from "@shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface DepreciationRequest {
  asset_id?: string;
  period_year: number;
  period_month: number;
  auto_post?: boolean;
}

interface Asset {
  id: string;
  asset_name: string;
  asset_category: string;
  acquisition_date: string;
  acquisition_cost: number;
  salvage_value: number;
  useful_life_years: number;
  depreciation_method: string;
  depreciation_start_date: string | null;
  total_depreciation: number;
  current_book_value: number;
  coa_account_code: string;
  status: string;
}

interface DepreciationResult {
  asset_id: string;
  asset_name: string;
  depreciation_amount: number;
  accumulated_depreciation: number;
  book_value: number;
  journal_entry_id?: string;
  status: string;
}

// Calculate straight-line depreciation
function calculateStraightLineDepreciation(
  acquisitionCost: number,
  salvageValue: number,
  usefulLifeYears: number
): number {
  const depreciableAmount = acquisitionCost - salvageValue;
  const monthlyDepreciation = depreciableAmount / (usefulLifeYears * 12);
  return Math.round(monthlyDepreciation * 100) / 100;
}

// Get depreciation expense account based on asset category
function getDepreciationExpenseAccount(category: string): string {
  const categoryLower = category.toLowerCase();
  if (categoryLower.includes("vehicle") || categoryLower.includes("kendaraan")) {
    return "6-4100";
  }
  if (categoryLower.includes("building") || categoryLower.includes("bangunan")) {
    return "6-4300";
  }
  return "6-4200"; // Default: Equipment/Peralatan
}

// Get accumulated depreciation account based on asset category
function getAccumulatedDepreciationAccount(category: string): string {
  const categoryLower = category.toLowerCase();
  if (categoryLower.includes("vehicle") || categoryLower.includes("kendaraan")) {
    return "1-5900";
  }
  if (categoryLower.includes("building") || categoryLower.includes("bangunan")) {
    return "1-5920";
  }
  return "1-5910"; // Default: Equipment/Peralatan
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const body: DepreciationRequest = await req.json();

    const {
      asset_id,
      period_year,
      period_month,
      auto_post = false,
    } = body;

    if (!period_year || !period_month) {
      return new Response(
        JSON.stringify({ error: "period_year dan period_month harus diisi" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const { data: authData } = await supabase.auth.getUser(
      req.headers.get("Authorization")?.split("Bearer ")[1] || ""
    );
    const user_id = authData?.user?.id;

    // Build query for assets
    let assetsQuery = supabase
      .from("assets")
      .select("*")
      .eq("status", "active")
      .gt("useful_life_years", 0);

    if (asset_id) {
      assetsQuery = assetsQuery.eq("id", asset_id);
    }

    const { data: assets, error: assetsError } = await assetsQuery;

    if (assetsError) {
      console.error("Assets fetch error:", assetsError);
      return new Response(
        JSON.stringify({ error: "Gagal mengambil data aset", details: assetsError.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    if (!assets || assets.length === 0) {
      return new Response(
        JSON.stringify({ error: "Tidak ada aset aktif yang ditemukan" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    const results: DepreciationResult[] = [];
    const periodDate = new Date(period_year, period_month - 1, 1);
    const periodDateStr = `${period_year}-${String(period_month).padStart(2, "0")}-01`;

    for (const asset of assets as Asset[]) {
      // Check if depreciation already exists for this period
      const { data: existingDep } = await supabase
        .from("asset_depreciation")
        .select("id")
        .eq("asset_id", asset.id)
        .eq("period_year", period_year)
        .eq("period_month", period_month)
        .single();

      if (existingDep) {
        continue; // Skip already processed
      }

      // Calculate depreciation based on method
      let depreciationAmount = 0;
      if (asset.depreciation_method === "straight_line" || !asset.depreciation_method) {
        depreciationAmount = calculateStraightLineDepreciation(
          asset.acquisition_cost,
          asset.salvage_value || 0,
          asset.useful_life_years
        );
      }

      // Check if asset is still depreciable
      const totalDepreciation = asset.total_depreciation || 0;
      const maxDepreciation = asset.acquisition_cost - (asset.salvage_value || 0);
      
      if (totalDepreciation >= maxDepreciation) {
        continue; // Asset fully depreciated
      }

      // Adjust if remaining depreciation is less than monthly amount
      if (totalDepreciation + depreciationAmount > maxDepreciation) {
        depreciationAmount = maxDepreciation - totalDepreciation;
      }

      const newAccumulatedDepreciation = totalDepreciation + depreciationAmount;
      const newBookValue = asset.acquisition_cost - newAccumulatedDepreciation;

      // Get COA accounts
      const expenseAccountCode = getDepreciationExpenseAccount(asset.asset_category);
      const accumAccountCode = getAccumulatedDepreciationAccount(asset.asset_category);

      // Fetch account details
      const { data: expenseAccount } = await supabase
        .from("chart_of_accounts")
        .select("id, account_code, account_name")
        .eq("account_code", expenseAccountCode)
        .single();

      const { data: accumAccount } = await supabase
        .from("chart_of_accounts")
        .select("id, account_code, account_name")
        .eq("account_code", accumAccountCode)
        .single();

      if (!expenseAccount || !accumAccount) {
        console.error(`Missing COA accounts for ${asset.asset_category}`);
        continue;
      }

      let journalEntryId = null;

      if (auto_post) {
        // Create journal entry header
        const journalDescription = `Penyusutan ${asset.asset_name} - ${period_month}/${period_year}`;
        
        const { data: journalEntry, error: journalError } = await supabase
          .from("journal_entries")
          .insert({
            transaction_date: periodDateStr,
            description: journalDescription,
            reference_type: "depreciation",
            reference_id: asset.id,
            total_debit: depreciationAmount,
            total_credit: depreciationAmount,
            status: "posted",
            created_by: user_id,
          })
          .select()
          .single();

        if (journalError) {
          console.error("Journal entry error:", journalError);
          continue;
        }

        journalEntryId = journalEntry.id;

        // Create journal entry lines (Double Entry)
        const journalLines = [
          {
            journal_entry_id: journalEntry.id,
            account_id: expenseAccount.id,
            account_code: expenseAccount.account_code,
            account_name: expenseAccount.account_name,
            debit: depreciationAmount,
            credit: 0,
            description: `Beban penyusutan ${asset.asset_name}`,
          },
          {
            journal_entry_id: journalEntry.id,
            account_id: accumAccount.id,
            account_code: accumAccount.account_code,
            account_name: accumAccount.account_name,
            debit: 0,
            credit: depreciationAmount,
            description: `Akumulasi penyusutan ${asset.asset_name}`,
          },
        ];

        await supabase.from("journal_entry_lines").insert(journalLines);

        // Insert to general_ledger
        const glEntries = journalLines.map((line) => ({
          transaction_date: periodDateStr,
          account_id: line.account_id,
          account_code: line.account_code,
          account_name: line.account_name,
          description: journalDescription,
          debit: line.debit,
          credit: line.credit,
          balance: line.debit - line.credit,
          reference_type: "depreciation",
          reference_id: asset.id,
          journal_entry_id: journalEntry.id,
          created_by: user_id,
        }));

        await supabase.from("general_ledger").insert(glEntries);
      }

      // Insert depreciation record
      const { error: depError } = await supabase
        .from("asset_depreciation")
        .insert({
          asset_id: asset.id,
          period: periodDateStr,
          period_year,
          period_month,
          depreciation_amount: depreciationAmount,
          accumulated_depreciation: newAccumulatedDepreciation,
          book_value: newBookValue,
          depreciation_method: asset.depreciation_method || "straight_line",
          journal_entry_id: journalEntryId,
          status: auto_post ? "posted" : "draft",
          created_by: user_id,
        });

      if (depError) {
        console.error("Depreciation insert error:", depError);
        continue;
      }

      // Update asset record
      await supabase
        .from("assets")
        .update({
          total_depreciation: newAccumulatedDepreciation,
          current_book_value: newBookValue,
          updated_at: new Date().toISOString(),
        })
        .eq("id", asset.id);

      results.push({
        asset_id: asset.id,
        asset_name: asset.asset_name,
        depreciation_amount: depreciationAmount,
        accumulated_depreciation: newAccumulatedDepreciation,
        book_value: newBookValue,
        journal_entry_id: journalEntryId || undefined,
        status: auto_post ? "posted" : "draft",
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Penyusutan berhasil dihitung untuk ${results.length} aset`,
        period: `${period_month}/${period_year}`,
        auto_posted: auto_post,
        data: results,
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

import { corsHeaders } from "@shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface AssetPurchaseRequest {
  asset_name: string;
  asset_category: string;
  acquisition_date: string;
  acquisition_cost: number;
  useful_life_years?: number;
  coa_account_code: string;
  payment_account_code: string;
  description?: string;
  location?: string;
  serial_number?: string;
  vehicle_data?: {
    brand: string;
    model?: string;
    plate_number: string;
    year_made?: number;
    color?: string;
    engine_number?: string;
    chassis_number?: string;
    fuel_type?: string;
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const body: AssetPurchaseRequest = await req.json();

    const {
      asset_name,
      asset_category,
      acquisition_date,
      acquisition_cost,
      useful_life_years = 5,
      coa_account_code,
      payment_account_code,
      description,
      location,
      serial_number,
      vehicle_data,
    } = body;

    if (!asset_name || !asset_category || !acquisition_date || !acquisition_cost || !coa_account_code || !payment_account_code) {
      return new Response(
        JSON.stringify({ 
          error: "asset_name, asset_category, acquisition_date, acquisition_cost, coa_account_code, dan payment_account_code harus diisi" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const { data: authData } = await supabase.auth.getUser(
      req.headers.get("Authorization")?.split("Bearer ")[1] || ""
    );
    const user_id = authData?.user?.id;

    // Get asset COA account
    const { data: assetAccount, error: assetAccError } = await supabase
      .from("chart_of_accounts")
      .select("id, account_code, account_name, account_type")
      .eq("account_code", coa_account_code)
      .single();

    if (assetAccError || !assetAccount) {
      return new Response(
        JSON.stringify({ error: `Akun aset ${coa_account_code} tidak ditemukan` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    // Get payment account (Cash/Bank)
    const { data: paymentAccount, error: paymentAccError } = await supabase
      .from("chart_of_accounts")
      .select("id, account_code, account_name, account_type")
      .eq("account_code", payment_account_code)
      .single();

    if (paymentAccError || !paymentAccount) {
      return new Response(
        JSON.stringify({ error: `Akun pembayaran ${payment_account_code} tidak ditemukan` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    // 1. Insert into assets table
    const { data: newAsset, error: assetError } = await supabase
      .from("assets")
      .insert({
        asset_name,
        asset_category,
        acquisition_date,
        acquisition_cost,
        useful_life_years,
        coa_account_code,
        description: description || `Pembelian ${asset_name}`,
        location,
        serial_number,
        status: "active",
        created_by: user_id,
      })
      .select()
      .single();

    if (assetError) {
      console.error("Asset insert error:", assetError);
      return new Response(
        JSON.stringify({ error: "Gagal menyimpan data aset", details: assetError.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // 2. If vehicle data, insert into vehicles table
    let vehicleRecord = null;
    if (vehicle_data && asset_category.toLowerCase() === "vehicle") {
      const { data: newVehicle, error: vehicleError } = await supabase
        .from("vehicles")
        .insert({
          asset_id: newAsset.id,
          brand: vehicle_data.brand,
          model: vehicle_data.model,
          plate_number: vehicle_data.plate_number,
          year_made: vehicle_data.year_made,
          color: vehicle_data.color,
          engine_number: vehicle_data.engine_number,
          chassis_number: vehicle_data.chassis_number,
          fuel_type: vehicle_data.fuel_type,
        })
        .select()
        .single();

      if (vehicleError) {
        console.error("Vehicle insert error:", vehicleError);
      } else {
        vehicleRecord = newVehicle;
      }
    }

    // 3. Create journal entry header
    const journalDescription = `Pembelian Aset: ${asset_name}`;
    const { data: journalEntry, error: journalError } = await supabase
      .from("journal_entries")
      .insert({
        transaction_date: acquisition_date,
        description: journalDescription,
        reference_type: "asset_purchase",
        reference_id: newAsset.id,
        total_debit: acquisition_cost,
        total_credit: acquisition_cost,
        status: "posted",
        created_by: user_id,
      })
      .select()
      .single();

    if (journalError) {
      console.error("Journal entry error:", journalError);
      return new Response(
        JSON.stringify({ error: "Gagal membuat jurnal entry", details: journalError.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // 4. Create journal entry lines (Double Entry)
    const journalLines = [
      {
        journal_entry_id: journalEntry.id,
        account_id: assetAccount.id,
        account_code: assetAccount.account_code,
        account_name: assetAccount.account_name,
        debit: acquisition_cost,
        credit: 0,
        description: `Pembelian ${asset_name}`,
      },
      {
        journal_entry_id: journalEntry.id,
        account_id: paymentAccount.id,
        account_code: paymentAccount.account_code,
        account_name: paymentAccount.account_name,
        debit: 0,
        credit: acquisition_cost,
        description: `Pembayaran untuk ${asset_name}`,
      },
    ];

    const { error: linesError } = await supabase
      .from("journal_entry_lines")
      .insert(journalLines);

    if (linesError) {
      console.error("Journal lines error:", linesError);
    }

    // 5. Insert to general_ledger
    const glEntries = journalLines.map((line) => ({
      transaction_date: acquisition_date,
      account_id: line.account_id,
      account_code: line.account_code,
      account_name: line.account_name,
      description: journalDescription,
      debit: line.debit,
      credit: line.credit,
      balance: line.debit - line.credit,
      reference_type: "asset_purchase",
      reference_id: newAsset.id,
      journal_entry_id: journalEntry.id,
      created_by: user_id,
    }));

    const { error: glError } = await supabase.from("general_ledger").insert(glEntries);

    if (glError) {
      console.error("General ledger error:", glError);
    }

    // Return success with all data
    return new Response(
      JSON.stringify({
        success: true,
        message: "Pembelian aset berhasil dicatat",
        data: {
          asset: newAsset,
          vehicle: vehicleRecord,
          journal_entry: {
            id: journalEntry.id,
            transaction_date: acquisition_date,
            description: journalDescription,
            total_debit: acquisition_cost,
            total_credit: acquisition_cost,
            status: "posted",
          },
          journal_lines: journalLines.map((line) => ({
            account_code: line.account_code,
            account_name: line.account_name,
            debit: line.debit,
            credit: line.credit,
          })),
        },
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

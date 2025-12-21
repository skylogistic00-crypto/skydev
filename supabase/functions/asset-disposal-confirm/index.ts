import { corsHeaders } from "@shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { asset_id, disposal_date, disposal_amount } = await req.json();

    if (!asset_id || !disposal_date || disposal_amount === undefined) {
      return new Response(
        JSON.stringify({ error: "asset_id, disposal_date, dan disposal_amount harus diisi" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Get asset data
    const { data: asset, error: assetError } = await supabase
      .from("fixed_assets")
      .select("*")
      .eq("id", asset_id)
      .eq("status", "active")
      .single();

    if (assetError || !asset) {
      return new Response(
        JSON.stringify({ error: "Asset tidak ditemukan atau sudah di-dispose" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    // Calculate book value
    const book_value = asset.acquisition_cost - asset.accumulated_depreciation;

    // Calculate gain or loss
    const gain_or_loss = disposal_amount - book_value;

    // Update asset status to disposed
    const { error: updateError } = await supabase
      .from("fixed_assets")
      .update({
        status: "disposed",
        disposal_date,
        disposal_amount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", asset_id);

    if (updateError) {
      return new Response(
        JSON.stringify({ error: "Gagal mengupdate status asset" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Create journal entries for disposal
    const { data: authData } = await supabase.auth.getUser(
      req.headers.get("Authorization")?.split("Bearer ")[1] || ""
    );
    const user_id = authData?.user?.id;

    // Journal Entry 1: Debit Cash/Bank (disposal amount)
    // Journal Entry 2: Debit Accumulated Depreciation
    // Journal Entry 3: Credit Asset (acquisition cost)
    // Journal Entry 4: Debit/Credit Gain or Loss

    const journal_entries = [];

    // 1. Cash/Bank received (Debit)
    if (disposal_amount > 0) {
      journal_entries.push({
        tanggal: disposal_date,
        keterangan: `Disposal Asset: ${asset.asset_name}`,
        account_code: "1110", // Assuming Cash account
        debit: disposal_amount,
        credit: 0,
        created_by: user_id,
      });
    }

    // 2. Accumulated Depreciation (Debit)
    journal_entries.push({
      tanggal: disposal_date,
      keterangan: `Disposal Asset: ${asset.asset_name} - Accumulated Depreciation`,
      account_code: asset.account_code?.replace(/^1/, "1.2") || "1201", // Convert asset account to accumulated depreciation
      debit: asset.accumulated_depreciation,
      credit: 0,
      created_by: user_id,
    });

    // 3. Asset Account (Credit)
    journal_entries.push({
      tanggal: disposal_date,
      keterangan: `Disposal Asset: ${asset.asset_name} - Asset Cost`,
      account_code: asset.account_code || "1200",
      debit: 0,
      credit: asset.acquisition_cost,
      created_by: user_id,
    });

    // 4. Gain or Loss on Disposal
    if (gain_or_loss !== 0) {
      if (gain_or_loss > 0) {
        // Gain (Credit)
        journal_entries.push({
          tanggal: disposal_date,
          keterangan: `Disposal Asset: ${asset.asset_name} - Gain on Disposal`,
          account_code: "8100", // Other Income
          debit: 0,
          credit: Math.abs(gain_or_loss),
          created_by: user_id,
        });
      } else {
        // Loss (Debit)
        journal_entries.push({
          tanggal: disposal_date,
          keterangan: `Disposal Asset: ${asset.asset_name} - Loss on Disposal`,
          account_code: "7900", // Other Expense
          debit: Math.abs(gain_or_loss),
          credit: 0,
          created_by: user_id,
        });
      }
    }

    // Insert journal entries
    const { error: journalError } = await supabase
      .from("general_ledger")
      .insert(journal_entries);

    if (journalError) {
      console.error("Journal error:", journalError);
      // Rollback asset status if journal fails
      await supabase
        .from("fixed_assets")
        .update({ status: "active", disposal_date: null, disposal_amount: null })
        .eq("id", asset_id);

      return new Response(
        JSON.stringify({ error: "Gagal membuat jurnal disposal" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    return new Response(
      JSON.stringify({
        message: "Asset berhasil di-dispose",
        asset_id,
        disposal_date,
        disposal_amount,
        gain_or_loss,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

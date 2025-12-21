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
    let gain_or_loss_type: "gain" | "loss" | "neutral";

    if (gain_or_loss > 0) {
      gain_or_loss_type = "gain";
    } else if (gain_or_loss < 0) {
      gain_or_loss_type = "loss";
    } else {
      gain_or_loss_type = "neutral";
    }

    const preview = {
      asset_id: asset.id,
      asset_name: asset.asset_name,
      account_code: asset.account_code,
      book_value,
      disposal_amount,
      gain_or_loss,
      gain_or_loss_type,
    };

    return new Response(JSON.stringify({ preview }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

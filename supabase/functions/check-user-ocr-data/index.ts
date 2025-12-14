import { corsHeaders } from "@shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function getSupabaseClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  try {
    const { action, user_id, email } = await req.json();
    const supabase = getSupabaseClient();

    let result;

    switch (action) {
      case "check_all_users_with_ocr":
        // Get all users with KTP or KK data
        const { data: ocrUsers, error: ocrError } = await supabase
          .from("users")
          .select("id, email, full_name, nik, nomor_kk, nama, nama_kepala_keluarga, anggota_keluarga, tempat_lahir, tanggal_lahir, jenis_kelamin, agama, pekerjaan, rt_rw, kelurahan_desa, kecamatan, kabupaten_kota, provinsi, created_at")
          .or("nik.not.is.null,nomor_kk.not.is.null")
          .order("created_at", { ascending: false })
          .limit(20);
        
        if (ocrError) throw ocrError;
        result = ocrUsers;
        break;

      case "check_user_by_id":
        if (!user_id) {
          return new Response(
            JSON.stringify({ error: "user_id is required" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
          );
        }
        const { data: userById, error: userByIdError } = await supabase
          .from("users")
          .select("*")
          .eq("id", user_id)
          .single();
        
        if (userByIdError) throw userByIdError;
        result = userById;
        break;

      case "check_user_by_email":
        if (!email) {
          return new Response(
            JSON.stringify({ error: "email is required" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
          );
        }
        const { data: userByEmail, error: userByEmailError } = await supabase
          .from("users")
          .select("*")
          .eq("email", email)
          .single();
        
        if (userByEmailError) throw userByEmailError;
        result = userByEmail;
        break;

      case "check_recent_signups":
        // Get last 10 signups
        const { data: recentUsers, error: recentError } = await supabase
          .from("users")
          .select("id, email, full_name, entity_type, role, nik, nomor_kk, created_at")
          .order("created_at", { ascending: false })
          .limit(10);
        
        if (recentError) throw recentError;
        result = recentUsers;
        break;

      case "check_table_columns":
        // Check what columns exist in users table using RPC
        const { data: columns, error: columnsError } = await supabase.rpc("get_table_columns", {
          p_table_name: "users",
          p_column_names: ["nik", "nomor_kk", "nama", "nama_kepala_keluarga", "anggota_keluarga", "debug_notes"]
        });
        
        if (columnsError) {
          // Fallback: just return a message
          result = { message: "Column check requires RPC function. Please check database directly." };
        } else {
          result = columns;
        }
        break;

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action. Use: check_all_users_with_ocr, check_user_by_id, check_user_by_email, check_recent_signups, check_table_columns" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        action,
        data: result 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

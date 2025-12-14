import { corsHeaders } from "@shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { action, userId, query } = await req.json();

    console.log("=== DEBUG OCR DATA REQUEST ===");
    console.log("Action:", action);
    console.log("UserId:", userId);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let result: any = {};

    if (action === "check_columns") {
      // Check if OCR columns exist in users table
      const { data, error } = await supabase
        .from('users')
        .select('nik, nomor_kk, nama, nama_kepala_keluarga, anggota_keluarga, tempat_lahir, tanggal_lahir, jenis_kelamin, agama, status_perkawinan, pekerjaan, rt_rw, kelurahan_desa, kecamatan, kabupaten_kota, provinsi')
        .limit(1);
      
      if (error) {
        console.error("Column check error:", error);
        result = { 
          columns_exist: false, 
          error: error.message,
          hint: "Some OCR columns may not exist in users table. Run migration 20240378_add_ocr_fields_to_users.sql"
        };
      } else {
        result = { 
          columns_exist: true, 
          sample_columns: data ? Object.keys(data[0] || {}) : [],
          message: "All OCR columns exist in users table"
        };
      }
    } 
    else if (action === "get_user_ocr_data" && userId) {
      // Get OCR data for specific user
      const { data, error } = await supabase
        .from('users')
        .select('id, email, full_name, nik, nomor_kk, nama, nama_kepala_keluarga, anggota_keluarga, tempat_lahir, tanggal_lahir, jenis_kelamin, agama, status_perkawinan, pekerjaan, rt_rw, kelurahan_desa, kecamatan, kabupaten_kota, provinsi, kode_pos, tanggal_dikeluarkan, debug_notes, created_at')
        .eq('id', userId)
        .single();
      
      if (error) {
        result = { error: error.message };
      } else {
        result = { user: data };
      }
    }
    else if (action === "get_all_users_with_ocr") {
      // Get all users that have OCR data
      const { data, error } = await supabase
        .from('users')
        .select('id, email, full_name, nik, nomor_kk, nama, nama_kepala_keluarga, anggota_keluarga, created_at')
        .or('nik.not.is.null,nomor_kk.not.is.null')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) {
        result = { error: error.message };
      } else {
        result = { 
          users: data,
          count: data?.length || 0,
          message: data?.length ? `Found ${data.length} users with OCR data` : "No users with OCR data found"
        };
      }
    }
    else if (action === "get_recent_users") {
      // Get recent users to check if OCR data was saved
      const { data, error } = await supabase
        .from('users')
        .select('id, email, full_name, nik, nomor_kk, nama, nama_kepala_keluarga, anggota_keluarga, tempat_lahir, tanggal_lahir, created_at')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) {
        result = { error: error.message };
      } else {
        result = { 
          users: data,
          count: data?.length || 0
        };
      }
    }
    else if (action === "run_query" && query) {
      // Run custom SQL query directly via Supabase
      try {
        const { data, error } = await supabase.rpc('execute_sql', { query_text: query });
        
        if (error) {
          result = { error: `SQL query failed: ${error.message}` };
        } else {
          result = { data };
        }
      } catch (err) {
        result = { error: `SQL execution error: ${err.message}` };
      }
    }
    else {
      result = { 
        error: "Invalid action",
        available_actions: ["check_columns", "get_user_ocr_data", "get_all_users_with_ocr", "get_recent_users", "run_query"]
      };
    }

    console.log("Result:", JSON.stringify(result, null, 2));

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

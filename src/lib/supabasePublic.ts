import { createClient } from "@supabase/supabase-js";

export const supabasePublic = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false, // ⛔ Jangan simpan session di localStorage
      autoRefreshToken: false, // ⛔ Jangan refresh token otomatis
      detectSessionInUrl: false, // ⛔ Jangan baca token dari URL
    },
  },
);

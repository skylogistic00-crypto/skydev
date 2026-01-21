import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// Create a Supabase client for Edge Functions.
// - Uses SERVICE key by default (server-side)
// - If an Authorization header exists, forwards it so RLS/auth can apply.
export function createSupabaseClient(req: Request) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseServiceKey =
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SERVICE_KEY") ?? "";

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      "Missing required env vars for Supabase Edge Function client: SUPABASE_URL and SUPABASE_SERVICE_KEY"
    );
  }

  const authHeader = req.headers.get("authorization") ?? "";

  return createClient(supabaseUrl, supabaseServiceKey, {
    global: {
      headers: authHeader ? { Authorization: authHeader } : {},
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Backwards-compatible aliases used across existing functions
// Backwards-compatible aliases used across existing functions
// NOTE: Avoid shadowing the imported `createClient` from supabase-js.
export const createClientFromRequest = (req: Request) => createSupabaseClient(req);

export const createSupabaseAdminClient = () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey =
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SERVICE_KEY")!;

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

export const createSupabaseAnonClient = () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  return createClient(supabaseUrl, supabaseAnonKey);
};

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

// Fall back to public Supabase URL and anon key when VITE_ vars are missing
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || (window as any).ENV_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || (window as any).ENV_SUPABASE_ANON_KEY;

// In Tempo, we rely on runtime-provided env vars instead of build-time VITE_ vars.
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables are missing; Supabase client will not be initialized');
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient<Database>(supabaseUrl, supabaseAnonKey)
  : (null as any);

export type UserRole = 'admin' | 'editor' | 'viewer';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
  created_at: string;
}
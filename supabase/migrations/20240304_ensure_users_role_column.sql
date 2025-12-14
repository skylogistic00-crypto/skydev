-- Ensure role column exists in users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'viewer';

-- Refresh schema cache by updating table comment
COMMENT ON TABLE public.users IS 'User profiles with role information - updated 2025-01-25';

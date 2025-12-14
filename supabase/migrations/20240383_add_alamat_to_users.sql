-- Add alamat column to users table for KTP address data
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS alamat TEXT;

-- Refresh schema cache
COMMENT ON TABLE public.users IS 'Users table with OCR fields - updated 2024-12-04';

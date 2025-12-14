-- Add OCR extracted fields to users table for KTP and KK documents

-- KTP Fields
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS nik TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS nama TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS tempat_lahir TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS tanggal_lahir DATE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS jenis_kelamin TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS agama TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS status_perkawinan TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS pekerjaan TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS kewarganegaraan TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS berlaku_hingga TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS golongan_darah TEXT;

-- KK Fields
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS nomor_kk TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS nama_kepala_keluarga TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS rt_rw TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS kelurahan_desa TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS kecamatan TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS kabupaten_kota TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS provinsi TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS kode_pos TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS tanggal_dikeluarkan DATE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS anggota_keluarga JSONB;

-- Debug notes from OCR
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS debug_notes JSONB;

-- Additional document fields
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS ktp_number TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS ktp_address TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS religion TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS ethnicity TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS education TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS license_number TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS license_expiry_date DATE;

-- Document URLs
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS upload_ijasah TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS ktp_document_url TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS selfie_url TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS family_card_url TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS sim_url TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS skck_url TEXT;

-- Create index for common search fields
CREATE INDEX IF NOT EXISTS idx_users_nik ON public.users(nik);
CREATE INDEX IF NOT EXISTS idx_users_nomor_kk ON public.users(nomor_kk);

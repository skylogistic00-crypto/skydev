-- Add document URL columns to employees table to match users table

ALTER TABLE employees ADD COLUMN IF NOT EXISTS ktp_document_url TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS selfie_url TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS upload_ijasah TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS family_card_url TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS sim_url TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS skck_url TEXT;

-- Also add other employee-specific fields if not exists
ALTER TABLE employees ADD COLUMN IF NOT EXISTS ktp_number TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS ktp_address TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS religion TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS ethnicity TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS education TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS license_number TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS license_expiry_date DATE;

-- Ensure all columns exist in kas_transaksi table
ALTER TABLE kas_transaksi 
ADD COLUMN IF NOT EXISTS service_category TEXT,
ADD COLUMN IF NOT EXISTS service_type TEXT,
ADD COLUMN IF NOT EXISTS bukti TEXT,
ADD COLUMN IF NOT EXISTS bukti_url TEXT;

-- Update bukti_url from bukti if needed
UPDATE kas_transaksi SET bukti_url = bukti WHERE bukti_url IS NULL AND bukti IS NOT NULL;

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON kas_transaksi;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON kas_transaksi;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON kas_transaksi;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON kas_transaksi;

-- Enable RLS
ALTER TABLE kas_transaksi ENABLE ROW LEVEL SECURITY;

-- Create comprehensive RLS policies
CREATE POLICY "Enable all access for authenticated users" 
ON kas_transaksi 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_kas_transaksi_payment_type ON kas_transaksi(payment_type);
CREATE INDEX IF NOT EXISTS idx_kas_transaksi_tanggal ON kas_transaksi(tanggal);
CREATE INDEX IF NOT EXISTS idx_kas_transaksi_document_number ON kas_transaksi(document_number);

-- Add comments
COMMENT ON COLUMN kas_transaksi.bukti_url IS 'URL file bukti transaksi (gambar atau PDF)';
COMMENT ON COLUMN kas_transaksi.service_category IS 'Kategori layanan (Jasa Cargo, Jasa Gudang, dll)';
COMMENT ON COLUMN kas_transaksi.service_type IS 'Tipe layanan spesifik dalam kategori';

-- Add service_category and service_type columns to kas_transaksi table
ALTER TABLE kas_transaksi 
ADD COLUMN IF NOT EXISTS service_category TEXT,
ADD COLUMN IF NOT EXISTS service_type TEXT;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_kas_transaksi_service_category ON kas_transaksi(service_category);
CREATE INDEX IF NOT EXISTS idx_kas_transaksi_service_type ON kas_transaksi(service_type);

-- Add comments
COMMENT ON COLUMN kas_transaksi.service_category IS 'Kategori layanan (Jasa Cargo, Jasa Gudang, dll)';
COMMENT ON COLUMN kas_transaksi.service_type IS 'Tipe layanan spesifik dalam kategori';

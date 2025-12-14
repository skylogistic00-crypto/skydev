-- Refresh kas_transaksi table to fix schema cache issue
-- This ensures the table is properly registered in the schema cache

-- Drop and recreate the table with all current columns
DROP TABLE IF EXISTS kas_transaksi CASCADE;

CREATE TABLE kas_transaksi (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tanggal DATE NOT NULL,
  document_number TEXT NOT NULL,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('Penerimaan Kas', 'Pengeluaran Kas')),
  account_number TEXT NOT NULL,
  account_name TEXT NOT NULL,
  nominal DECIMAL(15, 2) NOT NULL,
  keterangan TEXT,
  service_category TEXT,
  service_type TEXT,
  bukti TEXT,
  bukti_url TEXT,
  tax_type VARCHAR(50),
  tax_percentage DECIMAL(5,2) DEFAULT 0,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  employee_id UUID,
  approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  entity_id UUID
);

COMMENT ON TABLE kas_transaksi IS 'Tabel untuk mencatat transaksi penerimaan dan pengeluaran kas';
COMMENT ON COLUMN kas_transaksi.payment_type IS 'Jenis pembayaran: Penerimaan Kas atau Pengeluaran Kas';
COMMENT ON COLUMN kas_transaksi.nominal IS 'Nominal transaksi (positif untuk penerimaan, negatif untuk pengeluaran)';
COMMENT ON COLUMN kas_transaksi.service_category IS 'Kategori layanan (Jasa Cargo, Jasa Gudang, dll)';
COMMENT ON COLUMN kas_transaksi.service_type IS 'Tipe layanan spesifik';
COMMENT ON COLUMN kas_transaksi.tax_type IS 'Type of tax (PPh21, PPh23, PPN, etc.)';
COMMENT ON COLUMN kas_transaksi.tax_percentage IS 'Tax percentage applied';
COMMENT ON COLUMN kas_transaksi.tax_amount IS 'Total tax amount';

CREATE INDEX idx_kas_transaksi_tanggal ON kas_transaksi(tanggal);
CREATE INDEX idx_kas_transaksi_payment_type ON kas_transaksi(payment_type);
CREATE INDEX idx_kas_transaksi_service_category ON kas_transaksi(service_category);
CREATE INDEX idx_kas_transaksi_service_type ON kas_transaksi(service_type);
CREATE INDEX idx_kas_transaksi_entity_id ON kas_transaksi(entity_id);
CREATE INDEX idx_kas_transaksi_created_by ON kas_transaksi(created_by);

ALTER TABLE kas_transaksi ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users to view kas_transaksi" ON kas_transaksi;
DROP POLICY IF EXISTS "Allow authenticated users to insert kas_transaksi" ON kas_transaksi;
DROP POLICY IF EXISTS "Allow authenticated users to update kas_transaksi" ON kas_transaksi;
DROP POLICY IF EXISTS "Allow authenticated users to delete kas_transaksi" ON kas_transaksi;

CREATE POLICY "Allow authenticated users to view kas_transaksi"
  ON kas_transaksi FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert kas_transaksi"
  ON kas_transaksi FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update kas_transaksi"
  ON kas_transaksi FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete kas_transaksi"
  ON kas_transaksi FOR DELETE
  TO authenticated
  USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE kas_transaksi;

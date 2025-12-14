CREATE TABLE IF NOT EXISTS kas_transaksi (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tanggal DATE NOT NULL,
  document_number TEXT NOT NULL,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('Penerimaan Kas', 'Pengeluaran Kas')),
  account_number TEXT NOT NULL,
  account_name TEXT NOT NULL,
  nominal DECIMAL(15, 2) NOT NULL,
  keterangan TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE kas_transaksi IS 'Tabel untuk mencatat transaksi penerimaan dan pengeluaran kas';
COMMENT ON COLUMN kas_transaksi.payment_type IS 'Jenis pembayaran: Penerimaan Kas atau Pengeluaran Kas';
COMMENT ON COLUMN kas_transaksi.nominal IS 'Nominal transaksi (positif untuk penerimaan, negatif untuk pengeluaran)';

CREATE INDEX idx_kas_transaksi_tanggal ON kas_transaksi(tanggal);
CREATE INDEX idx_kas_transaksi_payment_type ON kas_transaksi(payment_type);

alter publication supabase_realtime add table kas_transaksi;

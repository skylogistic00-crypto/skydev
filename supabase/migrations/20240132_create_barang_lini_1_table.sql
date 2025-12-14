CREATE TABLE IF NOT EXISTS barang_lini_1 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_barang TEXT NOT NULL,
  sku TEXT NOT NULL UNIQUE,
  tanggal_masuk DATE NOT NULL,
  lama_simpan INTEGER,
  berat DECIMAL(10, 2),
  volume DECIMAL(10, 3),
  lokasi TEXT,
  status TEXT DEFAULT 'Tersedia',
  total_biaya DECIMAL(15, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_barang_lini_1_sku ON barang_lini_1(sku);
CREATE INDEX IF NOT EXISTS idx_barang_lini_1_status ON barang_lini_1(status);
CREATE INDEX IF NOT EXISTS idx_barang_lini_1_tanggal_masuk ON barang_lini_1(tanggal_masuk);

alter publication supabase_realtime add table barang_lini_1;

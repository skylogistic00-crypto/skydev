CREATE TABLE IF NOT EXISTS barang_lini_2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT NOT NULL,
  nama_barang TEXT NOT NULL,
  asal TEXT,
  lokasi TEXT,
  tgl_masuk DATE NOT NULL,
  tgl_keluar DATE,
  hari_simpan INTEGER,
  hari_di_lini_1 INTEGER,
  berat DECIMAL(10, 2),
  volume DECIMAL(10, 3),
  status TEXT DEFAULT 'Aktif',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_barang_lini_2_sku ON barang_lini_2(sku);
CREATE INDEX IF NOT EXISTS idx_barang_lini_2_status ON barang_lini_2(status);
CREATE INDEX IF NOT EXISTS idx_barang_lini_2_tgl_masuk ON barang_lini_2(tgl_masuk);

alter publication supabase_realtime add table barang_lini_2;

CREATE TABLE IF NOT EXISTS perpindahan_lini (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT NOT NULL,
  nama_barang TEXT NOT NULL,
  kode_barang TEXT,
  nomor_dokumen_pabean TEXT,
  tanggal_masuk_lini_1 DATE,
  tanggal_pindah_lini_2 DATE NOT NULL,
  hari_di_lini_1 INTEGER,
  berat NUMERIC,
  volume NUMERIC,
  lokasi TEXT,
  total_biaya_lini_1 NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS barang_diambil (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT NOT NULL,
  nama_barang TEXT NOT NULL,
  kode_barang TEXT,
  nomor_dokumen_pabean TEXT,
  tanggal_masuk_lini_1 DATE,
  tanggal_masuk_lini_2 DATE,
  tanggal_diambil DATE NOT NULL,
  lama_simpan INTEGER,
  hari_di_lini_1 INTEGER,
  berat NUMERIC,
  volume NUMERIC,
  total_biaya_lini_1 NUMERIC,
  total_biaya_lini_2 NUMERIC,
  status TEXT DEFAULT 'Diambil',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

alter publication supabase_realtime add table perpindahan_lini;
alter publication supabase_realtime add table barang_diambil;

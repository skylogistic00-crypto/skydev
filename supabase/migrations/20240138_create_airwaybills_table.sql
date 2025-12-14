CREATE TABLE IF NOT EXISTS airwaybills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  awb_number TEXT NOT NULL UNIQUE,
  tanggal_awb DATE NOT NULL,
  pengirim TEXT,
  penerima TEXT,
  asal TEXT,
  tujuan TEXT,
  jenis_layanan TEXT,
  berat DECIMAL(10,2),
  volume DECIMAL(10,2),
  jumlah_koli INTEGER,
  nilai_barang DECIMAL(15,2),
  biaya_kirim DECIMAL(15,2),
  status TEXT DEFAULT 'Pending',
  keterangan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

alter publication supabase_realtime add table airwaybills;

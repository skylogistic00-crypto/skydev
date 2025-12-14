-- Membuat tabel inventory_items
CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identitas Barang
  nama_barang TEXT NOT NULL,
  sku TEXT NOT NULL UNIQUE,
  kode_barang TEXT,
  nomor_batch_lot TEXT,
  nomor_seri TEXT,
  jenis_barang TEXT CHECK (jenis_barang IN ('Berikat', 'Non-Berikat')),
  asal_barang TEXT CHECK (asal_barang IN ('Impor', 'Lokal', 'Produksi Dalam Negeri')),
  
  -- Dokumen Pabean
  nomor_dokumen_pabean TEXT,
  tanggal_masuk DATE NOT NULL,
  lama_simpan INTEGER,
  berat DECIMAL(10,2),
  volume DECIMAL(10,2),
  
  -- Lokasi & Status
  lokasi TEXT,
  status TEXT NOT NULL CHECK (status IN ('Tersedia', 'Terpakai', 'Dipindahkan', 'Rusak')),
  keterangan TEXT,
  
  -- Nilai Barang
  harga_per_unit DECIMAL(15,2),
  total_biaya DECIMAL(15,2),
  mata_uang TEXT DEFAULT 'IDR' CHECK (mata_uang IN ('IDR', 'USD')),
  akun_persediaan TEXT,
  
  -- Audit & Sinkronisasi
  dibuat_oleh TEXT,
  tanggal_posting_ceisa DATE,
  sync_status TEXT DEFAULT 'Belum Terkirim' CHECK (sync_status IN ('Belum Terkirim', 'Terkirim ke WMS', 'Terkirim ke CEISA', 'Selesai')),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Menambahkan index untuk pencarian
CREATE INDEX IF NOT EXISTS idx_inventory_items_sku ON inventory_items(sku);
CREATE INDEX IF NOT EXISTS idx_inventory_items_status ON inventory_items(status);
CREATE INDEX IF NOT EXISTS idx_inventory_items_tanggal_masuk ON inventory_items(tanggal_masuk);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE inventory_items;

-- Menambahkan trigger untuk updated_at
CREATE OR REPLACE FUNCTION update_inventory_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER inventory_items_updated_at
  BEFORE UPDATE ON inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_items_updated_at();

COMMENT ON TABLE inventory_items IS 'Tabel untuk menyimpan data barang lini 1 dengan integrasi WMS/CEISA';

-- Membuat tabel barang_keluar
CREATE TABLE IF NOT EXISTS barang_keluar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT NOT NULL,
  nama_barang TEXT NOT NULL,
  kode_barang TEXT,
  nomor_dokumen_pabean TEXT,
  tanggal_keluar DATE NOT NULL,
  tujuan TEXT,
  jumlah INTEGER,
  keterangan TEXT,
  status TEXT NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Menambahkan index untuk pencarian
CREATE INDEX IF NOT EXISTS idx_barang_keluar_sku ON barang_keluar(sku);
CREATE INDEX IF NOT EXISTS idx_barang_keluar_tanggal ON barang_keluar(tanggal_keluar);
CREATE INDEX IF NOT EXISTS idx_barang_keluar_status ON barang_keluar(status);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE barang_keluar;

-- Menambahkan trigger untuk updated_at
CREATE OR REPLACE FUNCTION update_barang_keluar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER barang_keluar_updated_at
  BEFORE UPDATE ON barang_keluar
  FOR EACH ROW
  EXECUTE FUNCTION update_barang_keluar_updated_at();

COMMENT ON TABLE barang_keluar IS 'Tabel untuk mencatat barang yang keluar dari gudang';
COMMENT ON COLUMN barang_keluar.sku IS 'Stock Keeping Unit - kode unik barang';
COMMENT ON COLUMN barang_keluar.status IS 'Status pengiriman: Pending, Dalam Proses, Selesai, Dibatalkan';

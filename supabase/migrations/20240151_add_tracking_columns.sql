-- Menambahkan kolom tracking ke tabel stock
ALTER TABLE stock 
ADD COLUMN IF NOT EXISTS batas_waktu_pengambilan DATE,
ADD COLUMN IF NOT EXISTS status_pengambilan TEXT DEFAULT 'Normal';

-- Menambahkan kolom tracking ke barang_lini_1
ALTER TABLE barang_lini_1
ADD COLUMN IF NOT EXISTS batas_waktu_pengambilan DATE,
ADD COLUMN IF NOT EXISTS tanggal_pindah_ke_lini_2 DATE;

-- Menambahkan kolom tracking ke barang_lini_2
ALTER TABLE barang_lini_2
ADD COLUMN IF NOT EXISTS batas_waktu_pengambilan DATE;

-- Function untuk calculate hari di gudang
CREATE OR REPLACE FUNCTION get_hari_di_gudang(tanggal_masuk DATE)
RETURNS INTEGER AS $$
BEGIN
  IF tanggal_masuk IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN EXTRACT(DAY FROM (CURRENT_DATE - tanggal_masuk))::INTEGER;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function untuk calculate hari di lini
CREATE OR REPLACE FUNCTION get_hari_di_lini(tanggal_masuk DATE)
RETURNS INTEGER AS $$
BEGIN
  IF tanggal_masuk IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN EXTRACT(DAY FROM (CURRENT_DATE - tanggal_masuk))::INTEGER;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function untuk auto-update status pengambilan berdasarkan batas waktu
CREATE OR REPLACE FUNCTION update_status_pengambilan()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.batas_waktu_pengambilan IS NOT NULL THEN
    IF CURRENT_DATE > NEW.batas_waktu_pengambilan THEN
      NEW.status_pengambilan := 'Terlambat';
    ELSIF CURRENT_DATE >= NEW.batas_waktu_pengambilan - INTERVAL '3 days' THEN
      NEW.status_pengambilan := 'Mendekati Batas';
    ELSE
      NEW.status_pengambilan := 'Normal';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger untuk stock
DROP TRIGGER IF EXISTS trigger_update_status_pengambilan_stock ON stock;
CREATE TRIGGER trigger_update_status_pengambilan_stock
  BEFORE INSERT OR UPDATE ON stock
  FOR EACH ROW
  EXECUTE FUNCTION update_status_pengambilan();

-- Trigger untuk barang_lini_1
DROP TRIGGER IF EXISTS trigger_update_status_pengambilan_lini1 ON barang_lini_1;
CREATE TRIGGER trigger_update_status_pengambilan_lini1
  BEFORE INSERT OR UPDATE ON barang_lini_1
  FOR EACH ROW
  EXECUTE FUNCTION update_status_pengambilan();

-- Trigger untuk barang_lini_2
DROP TRIGGER IF EXISTS trigger_update_status_pengambilan_lini2 ON barang_lini_2;
CREATE TRIGGER trigger_update_status_pengambilan_lini2
  BEFORE INSERT OR UPDATE ON barang_lini_2
  FOR EACH ROW
  EXECUTE FUNCTION update_status_pengambilan();

-- View untuk report barang lama di gudang
CREATE OR REPLACE VIEW v_report_barang_lama AS
SELECT 
  'Stock Gudang' as lokasi,
  id,
  item_name as nama_barang,
  tanggal_masuk_barang,
  batas_waktu_pengambilan,
  get_hari_di_gudang(tanggal_masuk_barang) as lama_penyimpanan,
  status_pengambilan,
  CASE 
    WHEN batas_waktu_pengambilan IS NOT NULL 
    THEN batas_waktu_pengambilan - CURRENT_DATE
    ELSE NULL
  END as sisa_hari,
  created_at
FROM stock
WHERE tanggal_masuk_barang IS NOT NULL

UNION ALL

SELECT 
  'Lini 1' as lokasi,
  id,
  nama_barang,
  tanggal_masuk as tanggal_masuk_barang,
  batas_waktu_pengambilan,
  get_hari_di_lini(tanggal_masuk) as lama_penyimpanan,
  CASE 
    WHEN batas_waktu_pengambilan IS NOT NULL THEN
      CASE 
        WHEN CURRENT_DATE > batas_waktu_pengambilan THEN 'Terlambat'
        WHEN CURRENT_DATE >= batas_waktu_pengambilan - INTERVAL '3 days' THEN 'Mendekati Batas'
        ELSE 'Normal'
      END
    ELSE 'Normal'
  END as status_pengambilan,
  CASE 
    WHEN batas_waktu_pengambilan IS NOT NULL 
    THEN batas_waktu_pengambilan - CURRENT_DATE
    ELSE NULL
  END as sisa_hari,
  created_at
FROM barang_lini_1
WHERE status != 'Dipindahkan'

UNION ALL

SELECT 
  'Lini 2' as lokasi,
  id,
  nama_barang,
  tgl_masuk as tanggal_masuk_barang,
  batas_waktu_pengambilan,
  COALESCE(hari_di_lini_1, 0) + get_hari_di_lini(tgl_masuk) as lama_penyimpanan,
  CASE 
    WHEN batas_waktu_pengambilan IS NOT NULL THEN
      CASE 
        WHEN CURRENT_DATE > batas_waktu_pengambilan THEN 'Terlambat'
        WHEN CURRENT_DATE >= batas_waktu_pengambilan - INTERVAL '3 days' THEN 'Mendekati Batas'
        ELSE 'Normal'
      END
    ELSE 'Normal'
  END as status_pengambilan,
  CASE 
    WHEN batas_waktu_pengambilan IS NOT NULL 
    THEN batas_waktu_pengambilan - CURRENT_DATE
    ELSE NULL
  END as sisa_hari,
  created_at
FROM barang_lini_2
WHERE status = 'Aktif';

-- View untuk report perpindahan lini
CREATE OR REPLACE VIEW v_report_perpindahan_lini AS
SELECT 
  bl2.id,
  bl2.sku,
  bl2.nama_barang,
  bl1.tanggal_masuk as tanggal_masuk_lini_1,
  bl1.tanggal_pindah_ke_lini_2,
  bl2.tgl_masuk as tanggal_masuk_lini_2,
  bl2.hari_di_lini_1,
  get_hari_di_lini(bl2.tgl_masuk) as hari_di_lini_2,
  COALESCE(bl2.hari_di_lini_1, 0) + get_hari_di_lini(bl2.tgl_masuk) as total_hari_penyimpanan,
  bl2.status,
  bl2.created_at
FROM barang_lini_2 bl2
LEFT JOIN barang_lini_1 bl1 ON bl2.sku = bl1.sku
ORDER BY bl2.tgl_masuk DESC;

-- Index untuk performa
CREATE INDEX IF NOT EXISTS idx_stock_tanggal_masuk ON stock(tanggal_masuk_barang);
CREATE INDEX IF NOT EXISTS idx_stock_batas_waktu ON stock(batas_waktu_pengambilan);
CREATE INDEX IF NOT EXISTS idx_lini1_batas_waktu ON barang_lini_1(batas_waktu_pengambilan);
CREATE INDEX IF NOT EXISTS idx_lini2_batas_waktu ON barang_lini_2(batas_waktu_pengambilan);

COMMENT ON COLUMN stock.batas_waktu_pengambilan IS 'Tanggal batas waktu pengambilan barang';
COMMENT ON COLUMN stock.status_pengambilan IS 'Status: Normal, Mendekati Batas, Terlambat';
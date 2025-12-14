ALTER TABLE stock ADD COLUMN IF NOT EXISTS tanggal_masuk_barang DATE;

COMMENT ON COLUMN stock.tanggal_masuk_barang IS 'Tanggal barang masuk ke gudang';
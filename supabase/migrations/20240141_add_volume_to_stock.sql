ALTER TABLE stock ADD COLUMN IF NOT EXISTS volume TEXT;

COMMENT ON COLUMN stock.volume IS 'Volume barang (contoh: 10 x 20 x 30 cm³)';
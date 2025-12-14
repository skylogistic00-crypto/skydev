ALTER TABLE barang_lini_2 
ADD COLUMN IF NOT EXISTS total_biaya_lini_1 DECIMAL(15, 2),
ADD COLUMN IF NOT EXISTS total_biaya_lini_2 DECIMAL(15, 2);

-- Add awb column to barang_lini_1 table
ALTER TABLE barang_lini_1 
ADD COLUMN IF NOT EXISTS awb TEXT;

-- Add index for awb
CREATE INDEX IF NOT EXISTS idx_barang_lini_1_awb ON barang_lini_1(awb);

-- Add comment
COMMENT ON TABLE barang_lini_1 IS 'Barang Lini 1 table - added awb column for stock integration';

-- Add new columns to barang_lini_1 table
ALTER TABLE barang_lini_1 
ADD COLUMN IF NOT EXISTS item_arrival_date DATE,
ADD COLUMN IF NOT EXISTS sku TEXT,
ADD COLUMN IF NOT EXISTS awb TEXT,
ADD COLUMN IF NOT EXISTS storage_duration INTEGER,
ADD COLUMN IF NOT EXISTS total_price DECIMAL(15,2);

-- Update status column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'barang_lini_1' AND column_name = 'status') THEN
        ALTER TABLE barang_lini_1 ADD COLUMN status TEXT;
    END IF;
END $$;

-- Add comment
COMMENT ON TABLE barang_lini_1 IS 'Barang Lini 1 table - added columns for stock integration';

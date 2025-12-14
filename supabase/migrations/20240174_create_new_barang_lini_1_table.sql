-- Drop existing table if exists
DROP TABLE IF EXISTS barang_lini_1 CASCADE;

-- Create barang_lini_1 table with required columns
CREATE TABLE barang_lini_1 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_id UUID REFERENCES stock(id) ON DELETE SET NULL,
  item_name TEXT NOT NULL,
  item_arrival_date DATE,
  sku TEXT,
  awb TEXT,
  storage_duration INTEGER,
  status TEXT,
  total_price DECIMAL(15,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE barang_lini_1 ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Public access" ON barang_lini_1;
CREATE POLICY "Public access"
ON barang_lini_1 FOR ALL
USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_barang_lini_1_stock_id ON barang_lini_1(stock_id);
CREATE INDEX IF NOT EXISTS idx_barang_lini_1_sku ON barang_lini_1(sku);
CREATE INDEX IF NOT EXISTS idx_barang_lini_1_awb ON barang_lini_1(awb);
CREATE INDEX IF NOT EXISTS idx_barang_lini_1_status ON barang_lini_1(status);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE barang_lini_1;

-- Add comment
COMMENT ON TABLE barang_lini_1 IS 'Barang Lini 1 table - integrated with stock table';

-- Drop existing table if exists
DROP TABLE IF EXISTS barang_lini_2 CASCADE;

-- Create barang_lini_2 table with new structure
CREATE TABLE barang_lini_2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_name TEXT NOT NULL,
  sku TEXT NOT NULL,
  awb TEXT,
  item_arrival_date TIMESTAMPTZ,
  item_arrival_date_lini_2 TIMESTAMPTZ DEFAULT NOW(),
  storage_duration INTEGER,
  storage_duration_lini_2 INTEGER,
  status TEXT DEFAULT 'Lini 2',
  total_price DECIMAL(15, 2),
  total_price_lini_2 DECIMAL(15, 2),
  final_price DECIMAL(15, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_barang_lini_2_sku ON barang_lini_2(sku);
CREATE INDEX IF NOT EXISTS idx_barang_lini_2_status ON barang_lini_2(status);
CREATE INDEX IF NOT EXISTS idx_barang_lini_2_item_arrival_date ON barang_lini_2(item_arrival_date);
CREATE INDEX IF NOT EXISTS idx_barang_lini_2_item_arrival_date_lini_2 ON barang_lini_2(item_arrival_date_lini_2);

-- Enable realtime
alter publication supabase_realtime add table barang_lini_2;
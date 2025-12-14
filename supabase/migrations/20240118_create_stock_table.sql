CREATE TABLE IF NOT EXISTS stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT,
  location TEXT,
  item_name TEXT NOT NULL,
  unit TEXT,
  barcode TEXT,
  supplier_name TEXT,
  nominal_barang INTEGER DEFAULT 0,
  ppn_type TEXT,
  purchase_price DECIMAL(15,2) DEFAULT 0,
  selling_price DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

alter publication supabase_realtime add table stock;
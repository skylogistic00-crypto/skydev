CREATE TABLE IF NOT EXISTS barang_keluar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_name TEXT,
  sku TEXT,
  status TEXT,
  awb TEXT,
  item_arrival_date DATE,
  item_arrival_date_lini_2 DATE,
  storage_duration INTEGER,
  storage_duration_lini_2 INTEGER,
  total_price NUMERIC(15,2),
  total_price_lini_2 NUMERIC(15,2),
  final_price NUMERIC(15,2),
  item_quantity NUMERIC(10,2),
  unit TEXT,
  warehouses TEXT,
  zones TEXT,
  racks TEXT,
  lots TEXT,
  picked_up_by TEXT,
  pick_up_date DATE,
  payment TEXT,
  payment_status TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_barang_keluar_sku ON barang_keluar(sku);
CREATE INDEX IF NOT EXISTS idx_barang_keluar_awb ON barang_keluar(awb);
CREATE INDEX IF NOT EXISTS idx_barang_keluar_pick_up_date ON barang_keluar(pick_up_date);
CREATE INDEX IF NOT EXISTS idx_barang_keluar_payment_status ON barang_keluar(payment_status);

alter publication supabase_realtime add table barang_keluar;

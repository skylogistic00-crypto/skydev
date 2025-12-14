CREATE TABLE IF NOT EXISTS deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  delivery_address TEXT NOT NULL,
  city TEXT,
  province TEXT,
  postal_code TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_transit', 'delivered', 'cancelled')),
  delivery_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(status);
CREATE INDEX IF NOT EXISTS idx_deliveries_delivery_number ON deliveries(delivery_number);
CREATE INDEX IF NOT EXISTS idx_deliveries_customer_name ON deliveries(customer_name);

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON deliveries;
CREATE POLICY "Enable read access for authenticated users" ON deliveries FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON deliveries;
CREATE POLICY "Enable insert for authenticated users" ON deliveries FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for authenticated users" ON deliveries;
CREATE POLICY "Enable update for authenticated users" ON deliveries FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON deliveries;
CREATE POLICY "Enable delete for authenticated users" ON deliveries FOR DELETE TO authenticated USING (true);

ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS service_purchase (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_date DATE NOT NULL,
  service_category TEXT,
  service_type TEXT,
  item_name TEXT NOT NULL,
  supplier_name TEXT,
  quantity NUMERIC DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  subtotal NUMERIC NOT NULL,
  ppn_percentage NUMERIC DEFAULT 0,
  ppn_amount NUMERIC DEFAULT 0,
  total_amount NUMERIC NOT NULL,
  payment_method TEXT,
  payment_type TEXT,
  coa_cash_code TEXT,
  coa_expense_code TEXT,
  coa_payable_code TEXT,
  journal_ref TEXT,
  notes TEXT,
  description TEXT,
  approval_status TEXT DEFAULT 'approved',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_purchase_date ON service_purchase(transaction_date);
CREATE INDEX IF NOT EXISTS idx_service_purchase_supplier ON service_purchase(supplier_name);
CREATE INDEX IF NOT EXISTS idx_service_purchase_journal ON service_purchase(journal_ref);

ALTER TABLE service_purchase ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON service_purchase;
CREATE POLICY "Enable read access for all users" ON service_purchase FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON service_purchase;
CREATE POLICY "Enable insert for authenticated users" ON service_purchase FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for authenticated users" ON service_purchase;
CREATE POLICY "Enable update for authenticated users" ON service_purchase FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON service_purchase;
CREATE POLICY "Enable delete for authenticated users" ON service_purchase FOR DELETE USING (true);

CREATE TABLE IF NOT EXISTS shippers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipper_code TEXT NOT NULL UNIQUE,
  shipper_name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  email TEXT NOT NULL,
  city TEXT,
  country TEXT,
  is_pkp TEXT,
  tax_id TEXT,
  bank_name TEXT,
  bank_account_holder TEXT,
  payment_terms TEXT,
  category TEXT,
  currency TEXT NOT NULL DEFAULT 'IDR',
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE shippers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON shippers
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users" ON shippers
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON shippers
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Enable delete for authenticated users" ON shippers
  FOR DELETE
  TO authenticated
  USING (true);

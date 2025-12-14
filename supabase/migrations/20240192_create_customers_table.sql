CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_code TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
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

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON customers
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users" ON customers
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON customers
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Enable delete for authenticated users" ON customers
  FOR DELETE
  TO authenticated
  USING (true);

CREATE OR REPLACE FUNCTION generate_customer_code()
RETURNS TRIGGER AS $$
DECLARE
  next_number INTEGER;
  new_code TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(customer_code FROM 4) AS INTEGER)), 0) + 1
  INTO next_number
  FROM customers
  WHERE customer_code ~ '^CUS[0-9]+$';
  
  new_code := 'CUS' || LPAD(next_number::TEXT, 4, '0');
  
  NEW.customer_code := new_code;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_customer_code
BEFORE INSERT ON customers
FOR EACH ROW
EXECUTE FUNCTION generate_customer_code();

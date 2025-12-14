CREATE TABLE IF NOT EXISTS consignees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consignee_code TEXT NOT NULL UNIQUE,
  consignee_name TEXT NOT NULL,
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

ALTER TABLE consignees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON consignees
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users" ON consignees
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON consignees
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Enable delete for authenticated users" ON consignees
  FOR DELETE
  TO authenticated
  USING (true);

CREATE OR REPLACE FUNCTION generate_consignee_code()
RETURNS TRIGGER AS $$
DECLARE
  next_number INTEGER;
  new_code TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(consignee_code FROM 4) AS INTEGER)), 0) + 1
  INTO next_number
  FROM consignees
  WHERE consignee_code ~ '^CNS[0-9]+$';
  
  new_code := 'CNS' || LPAD(next_number::TEXT, 4, '0');
  
  NEW.consignee_code := new_code;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_consignee_code
BEFORE INSERT ON consignees
FOR EACH ROW
EXECUTE FUNCTION generate_consignee_code();

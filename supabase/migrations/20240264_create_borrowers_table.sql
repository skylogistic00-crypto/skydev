CREATE TABLE IF NOT EXISTS borrowers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  borrower_code TEXT UNIQUE,
  borrower_name TEXT NOT NULL,
  borrower_type TEXT CHECK (borrower_type IN ('Individu', 'Perusahaan', 'Lembaga')),
  
  identity_type TEXT CHECK (identity_type IN ('KTP', 'NPWP', 'Passport', 'SIUP', 'NIB')),
  identity_number TEXT,
  
  phone TEXT,
  email TEXT,
  address TEXT,
  
  bank_name TEXT,
  bank_account_number TEXT,
  bank_account_name TEXT,
  
  credit_limit NUMERIC(15,2),
  notes TEXT,
  
  status TEXT DEFAULT 'Aktif' CHECK (status IN ('Aktif', 'Tidak Aktif'))
);

CREATE INDEX IF NOT EXISTS idx_borrowers_name ON borrowers(borrower_name);
CREATE INDEX IF NOT EXISTS idx_borrowers_code ON borrowers(borrower_code);
CREATE INDEX IF NOT EXISTS idx_borrowers_identity ON borrowers(identity_number);

DROP POLICY IF EXISTS borrowers_select ON borrowers;
CREATE POLICY borrowers_select ON borrowers FOR SELECT USING (true);

DROP POLICY IF EXISTS borrowers_insert ON borrowers;
CREATE POLICY borrowers_insert ON borrowers FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS borrowers_update ON borrowers;
CREATE POLICY borrowers_update ON borrowers FOR UPDATE USING (true);

DROP POLICY IF EXISTS borrowers_delete ON borrowers;
CREATE POLICY borrowers_delete ON borrowers FOR DELETE USING (true);

ALTER TABLE borrowers ENABLE ROW LEVEL SECURITY;

CREATE SEQUENCE IF NOT EXISTS borrowers_code_seq START 1;

CREATE OR REPLACE FUNCTION generate_borrower_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.borrower_code IS NULL THEN
    NEW.borrower_code := 'BRW-' || LPAD(nextval('borrowers_code_seq')::TEXT, 5, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_borrower_code ON borrowers;
CREATE TRIGGER set_borrower_code
  BEFORE INSERT ON borrowers
  FOR EACH ROW
  EXECUTE FUNCTION generate_borrower_code();

ALTER TABLE loans ADD COLUMN IF NOT EXISTS borrower_id UUID;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_borrower'
  ) THEN
    ALTER TABLE loans ADD CONSTRAINT fk_borrower FOREIGN KEY (borrower_id) REFERENCES borrowers(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_loans_borrower_id ON loans(borrower_id);

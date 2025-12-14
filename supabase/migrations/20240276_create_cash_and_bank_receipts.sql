CREATE TABLE IF NOT EXISTS cash_and_bank_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_date DATE NOT NULL,
  transaction_type TEXT NOT NULL DEFAULT 'Penerimaan',
  category TEXT,
  source_destination TEXT,
  amount DECIMAL(15,2) NOT NULL,
  payment_method TEXT,
  coa_cash_code TEXT,
  coa_contra_code TEXT,
  description TEXT,
  reference_number TEXT UNIQUE,
  journal_ref TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE cash_and_bank_receipts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON cash_and_bank_receipts;
CREATE POLICY "Enable read access for all users" ON cash_and_bank_receipts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON cash_and_bank_receipts;
CREATE POLICY "Enable insert for authenticated users" ON cash_and_bank_receipts FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for authenticated users" ON cash_and_bank_receipts;
CREATE POLICY "Enable update for authenticated users" ON cash_and_bank_receipts FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON cash_and_bank_receipts;
CREATE POLICY "Enable delete for authenticated users" ON cash_and_bank_receipts FOR DELETE USING (true);

CREATE INDEX IF NOT EXISTS idx_cash_and_bank_receipts_date ON cash_and_bank_receipts(transaction_date);
CREATE INDEX IF NOT EXISTS idx_cash_and_bank_receipts_ref ON cash_and_bank_receipts(reference_number);

-- Drop the view if it exists and recreate as a proper table
DROP VIEW IF EXISTS general_ledger CASCADE;

-- Create general_ledger as a table with all required columns
CREATE TABLE IF NOT EXISTS general_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_entry_id UUID REFERENCES journal_entries(id) ON DELETE CASCADE,
  account_code TEXT NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  debit DECIMAL(15,2) DEFAULT 0,
  credit DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_gl_account_code ON general_ledger(account_code);
CREATE INDEX IF NOT EXISTS idx_gl_date ON general_ledger(date);
CREATE INDEX IF NOT EXISTS idx_gl_journal_entry_id ON general_ledger(journal_entry_id);

-- Enable RLS
ALTER TABLE general_ledger ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Allow authenticated users to view general_ledger" ON general_ledger;
CREATE POLICY "Allow authenticated users to view general_ledger"
  ON general_ledger FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert general_ledger" ON general_ledger;
CREATE POLICY "Allow authenticated users to insert general_ledger"
  ON general_ledger FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to update general_ledger" ON general_ledger;
CREATE POLICY "Allow authenticated users to update general_ledger"
  ON general_ledger FOR UPDATE
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to delete general_ledger" ON general_ledger;
CREATE POLICY "Allow authenticated users to delete general_ledger"
  ON general_ledger FOR DELETE
  TO authenticated
  USING (true);

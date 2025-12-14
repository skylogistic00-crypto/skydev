-- Create general_ledger table if not exists
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

-- Create index for faster queries
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

-- Create function to sync journal_entries to general_ledger
CREATE OR REPLACE FUNCTION sync_journal_to_gl()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into general_ledger
  INSERT INTO general_ledger (
    journal_entry_id,
    account_code,
    date,
    description,
    debit,
    credit,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.account_code,
    NEW.transaction_date,
    NEW.description,
    NEW.debit,
    NEW.credit,
    NOW(),
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on journal_entries
DROP TRIGGER IF EXISTS trigger_sync_journal_to_gl ON journal_entries;
CREATE TRIGGER trigger_sync_journal_to_gl
  AFTER INSERT ON journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION sync_journal_to_gl();
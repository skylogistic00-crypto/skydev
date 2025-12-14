CREATE TABLE IF NOT EXISTS journal_entry_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  account_code TEXT NOT NULL,
  account_name TEXT NOT NULL,
  debit DECIMAL(15,2) DEFAULT 0,
  credit DECIMAL(15,2) DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_journal_id ON journal_entry_lines(journal_id);
CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_account_code ON journal_entry_lines(account_code);

ALTER TABLE journal_entry_lines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users to view journal_entry_lines" ON journal_entry_lines;
CREATE POLICY "Allow authenticated users to view journal_entry_lines"
  ON journal_entry_lines FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert journal_entry_lines" ON journal_entry_lines;
CREATE POLICY "Allow authenticated users to insert journal_entry_lines"
  ON journal_entry_lines FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to update journal_entry_lines" ON journal_entry_lines;
CREATE POLICY "Allow authenticated users to update journal_entry_lines"
  ON journal_entry_lines FOR UPDATE
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to delete journal_entry_lines" ON journal_entry_lines;
CREATE POLICY "Allow authenticated users to delete journal_entry_lines"
  ON journal_entry_lines FOR DELETE
  TO authenticated
  USING (true);

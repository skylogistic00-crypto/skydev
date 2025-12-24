-- Add reference_type and reference_id columns to journal_entries table if they don't exist
ALTER TABLE journal_entries 
ADD COLUMN IF NOT EXISTS reference_type TEXT;

ALTER TABLE journal_entries 
ADD COLUMN IF NOT EXISTS reference_id UUID;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_journal_entries_reference_type 
ON journal_entries(reference_type);

CREATE INDEX IF NOT EXISTS idx_journal_entries_reference_id 
ON journal_entries(reference_id);

CREATE INDEX IF NOT EXISTS idx_journal_entries_reference 
ON journal_entries(reference_type, reference_id);

-- Update existing records where reference info might be missing
-- This helps track which source table the journal entry came from
COMMENT ON COLUMN journal_entries.reference_type IS 'Source table name (e.g., cash_disbursement, cash_receipts, purchase_transactions)';
COMMENT ON COLUMN journal_entries.reference_id IS 'Source table record ID';

-- Remove all triggers and functions created for COA balance updates

-- Drop trigger
DROP TRIGGER IF EXISTS trigger_update_coa_after_journal ON journal_entries;

-- Drop functions
DROP FUNCTION IF EXISTS trigger_update_coa_balance() CASCADE;
DROP FUNCTION IF EXISTS update_single_coa_balance(TEXT) CASCADE;
DROP FUNCTION IF EXISTS update_coa_balance_from_journal() CASCADE;

-- Remove columns added to chart_of_accounts
ALTER TABLE chart_of_accounts 
  DROP COLUMN IF EXISTS debit,
  DROP COLUMN IF EXISTS credit,
  DROP COLUMN IF EXISTS total_amount;

COMMENT ON TABLE chart_of_accounts IS 'Chart of Accounts - triggers and balance columns removed per user request';

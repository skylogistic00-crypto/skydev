-- Remove foreign key constraint from general_ledger.account_code
-- This constraint is causing issues because account codes may not always exist in chart_of_accounts
-- The account_code is still validated at the application level

ALTER TABLE general_ledger 
DROP CONSTRAINT IF EXISTS general_ledger_account_code_fkey;

-- Keep the index for performance
CREATE INDEX IF NOT EXISTS idx_gl_account_code ON general_ledger(account_code);

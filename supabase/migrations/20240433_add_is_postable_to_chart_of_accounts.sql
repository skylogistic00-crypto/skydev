-- Add is_postable column to chart_of_accounts table
-- This column indicates whether an account is a leaf account that can be posted to

ALTER TABLE chart_of_accounts ADD COLUMN IF NOT EXISTS is_postable BOOLEAN DEFAULT true;

-- Set is_postable = false for header/parent accounts
UPDATE chart_of_accounts SET is_postable = false WHERE is_header = true;

-- Set is_postable = false for parent accounts (accounts that have children)
UPDATE chart_of_accounts SET is_postable = false 
WHERE account_code IN (
  SELECT DISTINCT parent_code FROM chart_of_accounts WHERE parent_code IS NOT NULL
);

-- Specifically set parent accounts to not postable
UPDATE chart_of_accounts SET is_postable = false WHERE account_code = '1-1100'; -- Kas (parent)
UPDATE chart_of_accounts SET is_postable = false WHERE account_code = '1-1200'; -- Bank (parent)

-- Set leaf accounts to postable
UPDATE chart_of_accounts SET is_postable = true WHERE account_code LIKE '1-11__' AND account_code != '1-1100';
UPDATE chart_of_accounts SET is_postable = true WHERE account_code LIKE '1-12__' AND account_code != '1-1200';

-- Add comment
COMMENT ON COLUMN chart_of_accounts.is_postable IS 'Indicates if this is a leaf account that can be posted to (not a header/parent)';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_coa_is_postable ON chart_of_accounts(is_postable);

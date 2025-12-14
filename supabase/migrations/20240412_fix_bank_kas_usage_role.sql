-- Fix usage_role for Bank and Kas accounts
-- This ensures Bank and Kas accounts can be properly filtered in TransaksiKeuanganForm

-- Update all Bank accounts (1-12xx) to have usage_role = 'cash_and_bank'
UPDATE chart_of_accounts 
SET usage_role = 'cash_and_bank'
WHERE account_code LIKE '1-12%' 
  AND is_header = false
  AND is_active = true;

-- Update all Kas accounts (1-11xx) to have usage_role = 'cash'
UPDATE chart_of_accounts 
SET usage_role = 'cash'
WHERE account_code LIKE '1-11%' 
  AND is_header = false
  AND is_active = true;

-- Verify the updates
SELECT account_code, account_name, usage_role, flow_type, is_active, is_header
FROM chart_of_accounts
WHERE account_code LIKE '1-11%' OR account_code LIKE '1-12%'
ORDER BY account_code;

-- Fix usage_role for Bank and Kas accounts by searching account names
-- This ensures Bank and Kas accounts can be properly filtered in TransaksiKeuanganForm

-- First, let's see what accounts contain "Bank" or "Kas" in their names
SELECT account_code, account_name, usage_role, flow_type, is_active, is_header
FROM chart_of_accounts
WHERE (account_name ILIKE '%bank%' OR account_name ILIKE '%kas%')
  AND is_active = true
ORDER BY account_code;

-- Update all accounts with "Bank" in name to have usage_role = 'cash_and_bank'
UPDATE chart_of_accounts 
SET usage_role = 'cash_and_bank'
WHERE account_name ILIKE '%bank%'
  AND is_header = false
  AND is_active = true;

-- Update all accounts with "Kas" in name to have usage_role = 'cash'
UPDATE chart_of_accounts 
SET usage_role = 'cash'
WHERE account_name ILIKE '%kas%'
  AND is_header = false
  AND is_active = true;

-- Verify the updates
SELECT account_code, account_name, usage_role, flow_type, is_active, is_header
FROM chart_of_accounts
WHERE (account_name ILIKE '%bank%' OR account_name ILIKE '%kas%')
  AND is_active = true
ORDER BY account_code;

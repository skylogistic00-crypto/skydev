-- Sync data from akun_coa to chart_of_accounts
-- This will replace all data in chart_of_accounts with data from akun_coa

-- Step 1: Drop all foreign key constraints that reference chart_of_accounts
ALTER TABLE chart_of_accounts DROP CONSTRAINT IF EXISTS fk_coa_parent_code;
ALTER TABLE general_ledger DROP CONSTRAINT IF EXISTS fk_gl_debit_account;
ALTER TABLE general_ledger DROP CONSTRAINT IF EXISTS fk_gl_credit_account;
ALTER TABLE coa_mapping DROP CONSTRAINT IF EXISTS coa_mapping_coa_id_fkey;
ALTER TABLE account_mappings DROP CONSTRAINT IF EXISTS account_mappings_coa_id_fkey;

-- Step 2: Delete all existing data from chart_of_accounts
DELETE FROM chart_of_accounts;

-- Step 3: Copy data from akun_coa to chart_of_accounts
INSERT INTO chart_of_accounts (
  account_code,
  account_name,
  account_type,
  level,
  is_header,
  normal_balance,
  description,
  is_active,
  parent_code,
  created_at,
  updated_at
)
SELECT 
  account_code,
  account_name,
  account_type,
  level,
  is_header,
  normal_balance,
  description,
  COALESCE(is_active, true) as is_active,
  parent_code,
  COALESCE(created_at, NOW()) as created_at,
  COALESCE(updated_at, NOW()) as updated_at
FROM akun_coa
WHERE account_code IS NOT NULL
ORDER BY account_code;

-- Step 4: Re-add all foreign key constraints
ALTER TABLE chart_of_accounts 
ADD CONSTRAINT fk_coa_parent_code 
FOREIGN KEY (parent_code) 
REFERENCES chart_of_accounts(account_code) 
ON DELETE SET NULL;

ALTER TABLE general_ledger 
ADD CONSTRAINT fk_gl_debit_account 
FOREIGN KEY (debit_account) 
REFERENCES chart_of_accounts(account_code) 
ON DELETE RESTRICT;

ALTER TABLE general_ledger 
ADD CONSTRAINT fk_gl_credit_account 
FOREIGN KEY (credit_account) 
REFERENCES chart_of_accounts(account_code) 
ON DELETE RESTRICT;

ALTER TABLE coa_mapping 
ADD CONSTRAINT coa_mapping_coa_id_fkey 
FOREIGN KEY (coa_id) 
REFERENCES chart_of_accounts(id) 
ON DELETE CASCADE;

ALTER TABLE account_mappings 
ADD CONSTRAINT account_mappings_coa_id_fkey 
FOREIGN KEY (coa_id) 
REFERENCES chart_of_accounts(id) 
ON DELETE CASCADE;

-- Step 5: Update the updated_at timestamp
UPDATE chart_of_accounts SET updated_at = NOW();

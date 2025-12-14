-- Migration: Backfill account_type for all COA records based on account_code prefix

-- Update account_type based on account_code prefix
UPDATE chart_of_accounts
SET account_type = CASE
    WHEN account_code LIKE '1-%' THEN 'Aset'
    WHEN account_code LIKE '2-%' THEN 'Kewajiban'
    WHEN account_code LIKE '3-%' THEN 'Ekuitas'
    WHEN account_code LIKE '4-%' THEN 'Pendapatan'
    WHEN account_code LIKE '5-%' THEN 'HPP'
    WHEN account_code LIKE '6-%' THEN 'Beban'
    WHEN account_code LIKE '7-%' THEN 'Pendapatan Lain'
    WHEN account_code LIKE '8-%' THEN 'Beban Lain'
    ELSE COALESCE(account_type, 'Lainnya')
END
WHERE account_type IS NULL OR account_type = '';

-- Also update the general_ledger table to have account_type
ALTER TABLE general_ledger 
  ADD COLUMN IF NOT EXISTS account_type TEXT;

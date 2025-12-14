-- Add COA accounts for stock adjustments if not exists

-- Update existing account 4-9500 to be more specific for stock adjustments
UPDATE chart_of_accounts 
SET account_name = 'Pendapatan Lain-lain (Selisih Lebih Stock)'
WHERE account_code = '4-9500';

-- Update existing account 7-2500 to be more specific for stock adjustments  
UPDATE chart_of_accounts
SET account_name = 'Beban Lain-lain (Selisih Kurang Stock)'
WHERE account_code = '7-2500';

-- Add specific accounts for stock adjustments if they don't exist
INSERT INTO chart_of_accounts (account_code, account_name, account_type, level, is_header, normal_balance, description)
VALUES 
  ('4-2100', 'Pendapatan Lain-lain', 'Pendapatan', 3, false, 'Kredit', 'Pendapatan dari stock adjustment, retur, dll')
ON CONFLICT (account_code) DO UPDATE 
SET description = 'Pendapatan dari stock adjustment, retur, dll';

INSERT INTO chart_of_accounts (account_code, account_name, account_type, level, is_header, normal_balance, description)
VALUES 
  ('6-2100', 'Beban Lain-lain', 'Beban Operasional', 3, false, 'Debit', 'Beban dari stock adjustment, barang rusak, hilang, dll')
ON CONFLICT (account_code) DO UPDATE 
SET description = 'Beban dari stock adjustment, barang rusak, hilang, dll';
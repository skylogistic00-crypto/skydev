-- Fix account_type for Hutang Usaha account that was incorrectly created as "Beban Operasional"
-- This account should be "Kewajiban" because it's a liability account

UPDATE chart_of_accounts
SET account_type = 'Kewajiban',
    normal_balance = 'Kredit',
    updated_at = NOW()
WHERE account_name = 'Hutang Usaha'
  AND description ILIKE '%pinjaman%'
  AND account_type = 'Beban Operasional';

-- Also fix any other loan/debt related accounts that might be incorrectly categorized
UPDATE chart_of_accounts
SET account_type = 'Kewajiban',
    normal_balance = 'Kredit',
    updated_at = NOW()
WHERE (account_name ILIKE '%hutang%' OR account_name ILIKE '%pinjaman%' OR account_name ILIKE '%utang%')
  AND account_type != 'Kewajiban'
  AND account_code LIKE '2-%';

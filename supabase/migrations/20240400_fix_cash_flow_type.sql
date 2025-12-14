-- Fix missing flow_type for cash accounts
-- This ensures credit account can be found for "Pengeluaran Kas" transactions

UPDATE chart_of_accounts 
SET 
  flow_type = 'cash',
  usage_role = 'kas',
  trans_type = 'asset'
WHERE account_code IN ('1-1001', '1-1100', '1-1110', '1-1120', '1-1101')
  AND account_name ILIKE '%kas%';

UPDATE chart_of_accounts 
SET 
  flow_type = 'bank',
  usage_role = 'bank',
  trans_type = 'asset'
WHERE account_code IN ('1-1002', '1-1200')
  AND account_name ILIKE '%bank%';

UPDATE chart_of_accounts 
SET 
  usage_role = 'piutang',
  trans_type = 'asset'
WHERE account_code IN ('1-1003', '1-1004')
  AND account_name ILIKE '%piutang%';

UPDATE chart_of_accounts 
SET 
  usage_role = 'inventory',
  trans_type = 'asset'
WHERE account_code = '1-1005'
  AND account_name ILIKE '%persediaan%';

UPDATE chart_of_accounts 
SET 
  usage_role = 'hutang',
  trans_type = 'liability'
WHERE account_code IN ('2-1001', '2-1002', '2-1003', '2-2001')
  AND account_name ILIKE '%hutang%';

UPDATE chart_of_accounts 
SET 
  usage_role = 'beban_operasional',
  trans_type = 'expense'
WHERE account_code LIKE '6-%'
  AND account_type = 'Beban Operasional';

UPDATE chart_of_accounts 
SET 
  usage_role = 'hpp',
  trans_type = 'expense'
WHERE account_code LIKE '5-%'
  AND account_type = 'Beban Pokok Penjualan';

UPDATE chart_of_accounts 
SET 
  trans_type = 'revenue'
WHERE account_code LIKE '4-%'
  AND account_type = 'Pendapatan';

UPDATE chart_of_accounts 
SET 
  trans_type = 'equity'
WHERE account_code LIKE '3-%'
  AND account_type = 'Ekuitas';

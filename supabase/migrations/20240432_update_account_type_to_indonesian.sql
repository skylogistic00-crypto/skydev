-- Update account_type from 'revenue' to 'Pendapatan' and 'expense' to 'Beban Operasional'

UPDATE chart_of_accounts
SET account_type = 'Pendapatan'
WHERE account_type = 'revenue';

UPDATE chart_of_accounts
SET account_type = 'Beban Operasional'
WHERE account_type = 'expense';

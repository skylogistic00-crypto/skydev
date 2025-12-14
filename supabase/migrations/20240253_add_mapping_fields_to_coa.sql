ALTER TABLE chart_of_accounts
ADD COLUMN IF NOT EXISTS usage_role TEXT,
ADD COLUMN IF NOT EXISTS flow_type TEXT,
ADD COLUMN IF NOT EXISTS trans_type TEXT;

COMMENT ON COLUMN chart_of_accounts.usage_role IS 'Role akun untuk mapping otomatis (pendapatan_jasa, pendapatan_barang, hpp, inventory, hutang, piutang, beban_operasional, beban_kendaraan, beban_lain, other)';
COMMENT ON COLUMN chart_of_accounts.flow_type IS 'Tipe aliran kas (cash, bank)';
COMMENT ON COLUMN chart_of_accounts.trans_type IS 'Tipe transaksi (equity, liability, asset, revenue, expense)';

CREATE INDEX IF NOT EXISTS idx_coa_usage_role ON chart_of_accounts(usage_role);
CREATE INDEX IF NOT EXISTS idx_coa_flow_type ON chart_of_accounts(flow_type);
CREATE INDEX IF NOT EXISTS idx_coa_trans_type ON chart_of_accounts(trans_type);

UPDATE chart_of_accounts SET usage_role = 'pendapatan_jasa', trans_type = 'revenue' WHERE account_code LIKE '4-1%';
UPDATE chart_of_accounts SET usage_role = 'pendapatan_barang', trans_type = 'revenue' WHERE account_code LIKE '4-2%';
UPDATE chart_of_accounts SET usage_role = 'other', trans_type = 'revenue' WHERE account_code LIKE '4-9%';

UPDATE chart_of_accounts SET usage_role = 'hpp', trans_type = 'expense' WHERE account_code LIKE '5-%';

UPDATE chart_of_accounts SET usage_role = 'beban_operasional', trans_type = 'expense' WHERE account_code LIKE '6-1%';
UPDATE chart_of_accounts SET usage_role = 'beban_kendaraan', trans_type = 'expense' WHERE account_code LIKE '6-2%';
UPDATE chart_of_accounts SET usage_role = 'beban_lain', trans_type = 'expense' WHERE account_code LIKE '6-9%';

UPDATE chart_of_accounts SET usage_role = 'inventory', trans_type = 'asset' WHERE account_code LIKE '1-14%';

UPDATE chart_of_accounts SET usage_role = 'piutang', trans_type = 'asset' WHERE account_code LIKE '1-13%';

UPDATE chart_of_accounts SET usage_role = 'hutang', trans_type = 'liability' WHERE account_code LIKE '2-%';

UPDATE chart_of_accounts SET trans_type = 'equity' WHERE account_code LIKE '3-%';

UPDATE chart_of_accounts SET flow_type = 'cash' WHERE account_code IN ('1-1110', '1-1120');
UPDATE chart_of_accounts SET flow_type = 'bank' WHERE account_code LIKE '1-12%';
UPDATE chart_of_accounts SET flow_type = 'cash' WHERE account_code = '1-1101';

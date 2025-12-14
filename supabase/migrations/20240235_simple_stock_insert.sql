-- Insert stock data dengan kolom minimal yang pasti ada

-- Pastikan COA sudah ada
INSERT INTO chart_of_accounts (account_code, account_name, account_type, normal_balance, level, parent_code, is_header, is_active, description)
VALUES 
  ('1-1101', 'Persediaan Elektronik', 'Aset', 'Debit', 3, '1-0000', false, true, 'Persediaan barang elektronik'),
  ('1-1102', 'Persediaan Furniture', 'Aset', 'Debit', 3, '1-0000', false, true, 'Persediaan furniture'),
  ('1-1103', 'Persediaan Alat Tulis', 'Aset', 'Debit', 3, '1-0000', false, true, 'Persediaan alat tulis'),
  ('4-1101', 'Pendapatan Penjualan Elektronik', 'Pendapatan', 'Kredit', 3, '4-0000', false, true, 'Pendapatan elektronik'),
  ('4-1102', 'Pendapatan Penjualan Furniture', 'Pendapatan', 'Kredit', 3, '4-0000', false, true, 'Pendapatan furniture'),
  ('5-1101', 'HPP Elektronik', 'Beban Pokok Penjualan', 'Debit', 3, '5-0000', false, true, 'HPP elektronik')
ON CONFLICT (account_code) DO NOTHING;

-- Insert dengan kolom minimal
INSERT INTO stock (
  item_name,
  barcode, 
  supplier_name, 
  nominal_barang, 
  purchase_price, 
  selling_price
) VALUES 
  ('Laptop Dell', 'LPT-001', 'PT Teknologi', 15000000, 12000000, 15000000),
  ('Monitor LG', 'MON-001', 'PT Teknologi', 2500000, 2000000, 2500000),
  ('Keyboard Logitech', 'KEY-001', 'PT Teknologi', 450000, 350000, 450000),
  ('Meja Kerja', 'MJK-001', 'CV Furniture', 1500000, 1200000, 1500000),
  ('Kursi Kantor', 'KRS-001', 'CV Furniture', 1200000, 900000, 1200000)
ON CONFLICT (barcode) DO NOTHING;

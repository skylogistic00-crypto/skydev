-- Restore stock data dengan COA mapping yang sesuai

-- Pastikan COA untuk persediaan barang sudah ada
INSERT INTO chart_of_accounts (account_code, account_name, account_type, normal_balance, level, parent_code, is_header, is_active, description)
VALUES 
  ('1-1100', 'Persediaan Barang Dagangan', 'Aset', 'Debit', 2, '1-0000', false, true, 'Persediaan barang untuk dijual kembali'),
  ('1-1101', 'Persediaan Elektronik', 'Aset', 'Debit', 3, '1-1100', false, true, 'Persediaan barang elektronik'),
  ('1-1102', 'Persediaan Furniture', 'Aset', 'Debit', 3, '1-1100', false, true, 'Persediaan furniture dan perabotan'),
  ('1-1103', 'Persediaan Alat Tulis', 'Aset', 'Debit', 3, '1-1100', false, true, 'Persediaan alat tulis kantor'),
  ('1-1104', 'Persediaan Spare Parts', 'Aset', 'Debit', 3, '1-1100', false, true, 'Persediaan suku cadang'),
  ('4-1101', 'Pendapatan Penjualan Elektronik', 'Pendapatan', 'Kredit', 3, '4-0000', false, true, 'Pendapatan dari penjualan elektronik'),
  ('4-1102', 'Pendapatan Penjualan Furniture', 'Pendapatan', 'Kredit', 3, '4-0000', false, true, 'Pendapatan dari penjualan furniture'),
  ('4-1103', 'Pendapatan Penjualan Alat Tulis', 'Pendapatan', 'Kredit', 3, '4-0000', false, true, 'Pendapatan dari penjualan alat tulis'),
  ('5-1101', 'HPP Elektronik', 'Beban Pokok Penjualan', 'Debit', 3, '5-0000', false, true, 'Harga pokok penjualan elektronik'),
  ('5-1102', 'HPP Furniture', 'Beban Pokok Penjualan', 'Debit', 3, '5-0000', false, true, 'Harga pokok penjualan furniture'),
  ('5-1103', 'HPP Alat Tulis', 'Beban Pokok Penjualan', 'Debit', 3, '5-0000', false, true, 'Harga pokok penjualan alat tulis')
ON CONFLICT (account_code) DO NOTHING;

-- Insert sample stock data dengan COA mapping
INSERT INTO stock (
  name, 
  category, 
  location, 
  item_name, 
  jenis_barang,
  unit, 
  barcode, 
  supplier_name, 
  nominal_barang, 
  ppn_type,
  purchase_price, 
  selling_price,
  quantity,
  min_stock,
  max_stock,
  coa_account_code,
  coa_account_name,
  description
) VALUES 
  -- Elektronik
  ('Laptop Dell Latitude 5420', 'Elektronik', 'Gudang A', 'Laptop', 'Laptop Dell', 'Unit', 'LPT-DELL-001', 'PT Teknologi Maju', 15000000, 'PPN 11%', 12000000, 15000000, 10, 2, 20, '1-1101', 'Persediaan Elektronik', 'Laptop Dell Latitude 5420 i5 Gen 11'),
  ('Monitor LG 24 Inch', 'Elektronik', 'Gudang A', 'Monitor', 'Monitor LG', 'Unit', 'MON-LG-001', 'PT Teknologi Maju', 2500000, 'PPN 11%', 2000000, 2500000, 15, 3, 30, '1-1101', 'Persediaan Elektronik', 'Monitor LG 24 inch Full HD'),
  ('Keyboard Logitech K380', 'Elektronik', 'Gudang A', 'Keyboard', 'Keyboard Wireless', 'Unit', 'KEY-LOG-001', 'PT Teknologi Maju', 450000, 'PPN 11%', 350000, 450000, 25, 5, 50, '1-1101', 'Persediaan Elektronik', 'Keyboard wireless Logitech K380'),
  ('Mouse Logitech M331', 'Elektronik', 'Gudang A', 'Mouse', 'Mouse Wireless', 'Unit', 'MOU-LOG-001', 'PT Teknologi Maju', 250000, 'PPN 11%', 180000, 250000, 30, 5, 50, '1-1101', 'Persediaan Elektronik', 'Mouse wireless Logitech M331'),
  ('Printer HP LaserJet', 'Elektronik', 'Gudang A', 'Printer', 'Printer Laser', 'Unit', 'PRT-HP-001', 'PT Teknologi Maju', 3500000, 'PPN 11%', 2800000, 3500000, 8, 2, 15, '1-1101', 'Persediaan Elektronik', 'Printer HP LaserJet Pro M404dn'),
  
  -- Furniture
  ('Meja Kerja Minimalis', 'Furniture', 'Gudang B', 'Meja', 'Meja Kantor', 'Unit', 'MJK-MIN-001', 'CV Furniture Jaya', 1500000, 'PPN 11%', 1200000, 1500000, 12, 3, 20, '1-1102', 'Persediaan Furniture', 'Meja kerja minimalis 120x60cm'),
  ('Kursi Kantor Ergonomis', 'Furniture', 'Gudang B', 'Kursi', 'Kursi Kantor', 'Unit', 'KRS-ERG-001', 'CV Furniture Jaya', 1200000, 'PPN 11%', 900000, 1200000, 15, 3, 25, '1-1102', 'Persediaan Furniture', 'Kursi kantor ergonomis dengan sandaran'),
  ('Lemari Arsip 4 Pintu', 'Furniture', 'Gudang B', 'Lemari', 'Lemari Arsip', 'Unit', 'LMR-ARS-001', 'CV Furniture Jaya', 2500000, 'PPN 11%', 2000000, 2500000, 8, 2, 15, '1-1102', 'Persediaan Furniture', 'Lemari arsip besi 4 pintu'),
  ('Rak Buku 5 Tingkat', 'Furniture', 'Gudang B', 'Rak', 'Rak Display', 'Unit', 'RAK-BKU-001', 'CV Furniture Jaya', 800000, 'PPN 11%', 600000, 800000, 10, 2, 20, '1-1102', 'Persediaan Furniture', 'Rak buku kayu 5 tingkat'),
  
  -- Alat Tulis
  ('Kertas A4 80gsm', 'Alat Tulis', 'Gudang C', 'Kertas', 'Kertas HVS', 'Rim', 'KRT-A4-001', 'PT Kertas Nusantara', 45000, 'PPN 11%', 35000, 45000, 100, 20, 200, '1-1103', 'Persediaan Alat Tulis', 'Kertas A4 80gsm isi 500 lembar'),
  ('Pulpen Pilot G2', 'Alat Tulis', 'Gudang C', 'Pulpen', 'Pulpen Gel', 'Pcs', 'PEN-PIL-001', 'PT Kertas Nusantara', 5000, 'Non PPN', 3500, 5000, 200, 50, 500, '1-1103', 'Persediaan Alat Tulis', 'Pulpen gel Pilot G2 0.7mm'),
  ('Spidol Whiteboard', 'Alat Tulis', 'Gudang C', 'Spidol', 'Spidol Board', 'Pcs', 'SPD-WB-001', 'PT Kertas Nusantara', 8000, 'Non PPN', 6000, 8000, 150, 30, 300, '1-1103', 'Persediaan Alat Tulis', 'Spidol whiteboard warna hitam'),
  ('Stapler Joyko HD-10', 'Alat Tulis', 'Gudang C', 'Stapler', 'Stapler Besar', 'Pcs', 'STP-JOY-001', 'PT Kertas Nusantara', 25000, 'Non PPN', 18000, 25000, 50, 10, 100, '1-1103', 'Persediaan Alat Tulis', 'Stapler Joyko HD-10 kapasitas 50 lembar'),
  ('Map Plastik Folio', 'Alat Tulis', 'Gudang C', 'Map', 'Map Dokumen', 'Pcs', 'MAP-FLO-001', 'PT Kertas Nusantara', 3000, 'Non PPN', 2000, 3000, 100, 20, 200, '1-1103', 'Persediaan Alat Tulis', 'Map plastik folio warna biru'),
  
  -- Spare Parts
  ('Ban Mobil Bridgestone', 'Spare Parts', 'Gudang D', 'Ban', 'Ban Mobil', 'Unit', 'BAN-BRG-001', 'PT Otomotif Sejahtera', 1200000, 'PPN 11%', 950000, 1200000, 20, 4, 40, '1-1104', 'Persediaan Spare Parts', 'Ban mobil Bridgestone 185/65 R15'),
  ('Oli Mesin Shell Helix', 'Spare Parts', 'Gudang D', 'Oli', 'Oli Mesin', 'Liter', 'OLI-SHL-001', 'PT Otomotif Sejahtera', 85000, 'PPN 11%', 65000, 85000, 50, 10, 100, '1-1104', 'Persediaan Spare Parts', 'Oli mesin Shell Helix HX7 10W-40'),
  ('Aki Mobil GS Astra', 'Spare Parts', 'Gudang D', 'Aki', 'Aki Kering', 'Unit', 'AKI-GSA-001', 'PT Otomotif Sejahtera', 850000, 'PPN 11%', 650000, 850000, 15, 3, 30, '1-1104', 'Persediaan Spare Parts', 'Aki mobil GS Astra NS60 12V 45Ah'),
  ('Filter Udara Denso', 'Spare Parts', 'Gudang D', 'Filter', 'Filter Udara', 'Pcs', 'FLT-DNS-001', 'PT Otomotif Sejahtera', 150000, 'PPN 11%', 110000, 150000, 30, 5, 60, '1-1104', 'Persediaan Spare Parts', 'Filter udara Denso untuk mobil sedan')
ON CONFLICT (barcode) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  location = EXCLUDED.location,
  item_name = EXCLUDED.item_name,
  jenis_barang = EXCLUDED.jenis_barang,
  unit = EXCLUDED.unit,
  supplier_name = EXCLUDED.supplier_name,
  nominal_barang = EXCLUDED.nominal_barang,
  ppn_type = EXCLUDED.ppn_type,
  purchase_price = EXCLUDED.purchase_price,
  selling_price = EXCLUDED.selling_price,
  quantity = EXCLUDED.quantity,
  min_stock = EXCLUDED.min_stock,
  max_stock = EXCLUDED.max_stock,
  coa_account_code = EXCLUDED.coa_account_code,
  coa_account_name = EXCLUDED.coa_account_name,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Update COA mapping untuk kategori barang
INSERT INTO coa_category_mapping (
  kategori_layanan,
  jenis_layanan,
  asset_account_code,
  revenue_account_code,
  cogs_account_code,
  expense_account_code
) VALUES
  ('Barang', 'Elektronik', '1-1101', '4-1101', '5-1101', '6-0000'),
  ('Barang', 'Furniture', '1-1102', '4-1102', '5-1102', '6-0000'),
  ('Barang', 'Alat Tulis', '1-1103', '4-1103', '5-1103', '6-0000'),
  ('Barang', 'Spare Parts', '1-1104', '4-0000', '5-0000', '6-0000')
ON CONFLICT (kategori_layanan, jenis_layanan) DO UPDATE SET
  asset_account_code = EXCLUDED.asset_account_code,
  revenue_account_code = EXCLUDED.revenue_account_code,
  cogs_account_code = EXCLUDED.cogs_account_code,
  expense_account_code = EXCLUDED.expense_account_code;

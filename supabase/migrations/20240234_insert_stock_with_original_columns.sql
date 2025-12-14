-- Restore stock data menggunakan kolom asli dari CREATE TABLE

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

-- Insert sample stock data menggunakan kolom yang pasti ada
INSERT INTO stock (
  item_name,
  location, 
  unit, 
  barcode, 
  supplier_name, 
  nominal_barang, 
  ppn_type,
  purchase_price, 
  selling_price,
  coa_account_code,
  coa_account_name,
  description,
  sku,
  kode_barang,
  brand,
  part_number
) VALUES 
  -- Elektronik
  ('Laptop Dell Latitude 5420', 'Gudang A', 'Unit', 'LPT-DELL-001', 'PT Teknologi Maju', 15000000, 'PPN 11%', 12000000, 15000000, '1-1101', 'Persediaan Elektronik', 'Laptop Dell Latitude 5420 i5 Gen 11', 'SKU-LPT-001', 'BRG-001', 'Dell', 'LAT-5420'),
  ('Monitor LG 24 Inch', 'Gudang A', 'Unit', 'MON-LG-001', 'PT Teknologi Maju', 2500000, 'PPN 11%', 2000000, 2500000, '1-1101', 'Persediaan Elektronik', 'Monitor LG 24 inch Full HD', 'SKU-MON-001', 'BRG-002', 'LG', '24MK430H'),
  ('Keyboard Logitech K380', 'Gudang A', 'Unit', 'KEY-LOG-001', 'PT Teknologi Maju', 450000, 'PPN 11%', 350000, 450000, '1-1101', 'Persediaan Elektronik', 'Keyboard wireless Logitech K380', 'SKU-KEY-001', 'BRG-003', 'Logitech', 'K380'),
  ('Mouse Logitech M331', 'Gudang A', 'Unit', 'MOU-LOG-001', 'PT Teknologi Maju', 250000, 'PPN 11%', 180000, 250000, '1-1101', 'Persediaan Elektronik', 'Mouse wireless Logitech M331', 'SKU-MOU-001', 'BRG-004', 'Logitech', 'M331'),
  ('Printer HP LaserJet', 'Gudang A', 'Unit', 'PRT-HP-001', 'PT Teknologi Maju', 3500000, 'PPN 11%', 2800000, 3500000, '1-1101', 'Persediaan Elektronik', 'Printer HP LaserJet Pro M404dn', 'SKU-PRT-001', 'BRG-005', 'HP', 'M404DN'),
  
  -- Furniture
  ('Meja Kerja Minimalis', 'Gudang B', 'Unit', 'MJK-MIN-001', 'CV Furniture Jaya', 1500000, 'PPN 11%', 1200000, 1500000, '1-1102', 'Persediaan Furniture', 'Meja kerja minimalis 120x60cm', 'SKU-MJK-001', 'BRG-006', 'Olympic', 'MK-120'),
  ('Kursi Kantor Ergonomis', 'Gudang B', 'Unit', 'KRS-ERG-001', 'CV Furniture Jaya', 1200000, 'PPN 11%', 900000, 1200000, '1-1102', 'Persediaan Furniture', 'Kursi kantor ergonomis dengan sandaran', 'SKU-KRS-001', 'BRG-007', 'Ergotec', 'ERG-100'),
  ('Lemari Arsip 4 Pintu', 'Gudang B', 'Unit', 'LMR-ARS-001', 'CV Furniture Jaya', 2500000, 'PPN 11%', 2000000, 2500000, '1-1102', 'Persediaan Furniture', 'Lemari arsip besi 4 pintu', 'SKU-LMR-001', 'BRG-008', 'Lion', 'LA-4P'),
  ('Rak Buku 5 Tingkat', 'Gudang B', 'Unit', 'RAK-BKU-001', 'CV Furniture Jaya', 800000, 'PPN 11%', 600000, 800000, '1-1102', 'Persediaan Furniture', 'Rak buku kayu 5 tingkat', 'SKU-RAK-001', 'BRG-009', 'Funika', 'RB-5T'),
  
  -- Alat Tulis
  ('Kertas A4 80gsm', 'Gudang C', 'Rim', 'KRT-A4-001', 'PT Kertas Nusantara', 45000, 'PPN 11%', 35000, 45000, '1-1103', 'Persediaan Alat Tulis', 'Kertas A4 80gsm isi 500 lembar', 'SKU-KRT-001', 'BRG-010', 'Sinar Dunia', 'SD-A4-80'),
  ('Pulpen Pilot G2', 'Gudang C', 'Pcs', 'PEN-PIL-001', 'PT Kertas Nusantara', 5000, 'Non PPN', 3500, 5000, '1-1103', 'Persediaan Alat Tulis', 'Pulpen gel Pilot G2 0.7mm', 'SKU-PEN-001', 'BRG-011', 'Pilot', 'G2-07'),
  ('Spidol Whiteboard', 'Gudang C', 'Pcs', 'SPD-WB-001', 'PT Kertas Nusantara', 8000, 'Non PPN', 6000, 8000, '1-1103', 'Persediaan Alat Tulis', 'Spidol whiteboard warna hitam', 'SKU-SPD-001', 'BRG-012', 'Snowman', 'WB-12'),
  ('Stapler Joyko HD-10', 'Gudang C', 'Pcs', 'STP-JOY-001', 'PT Kertas Nusantara', 25000, 'Non PPN', 18000, 25000, '1-1103', 'Persediaan Alat Tulis', 'Stapler Joyko HD-10 kapasitas 50 lembar', 'SKU-STP-001', 'BRG-013', 'Joyko', 'HD-10'),
  ('Map Plastik Folio', 'Gudang C', 'Pcs', 'MAP-FLO-001', 'PT Kertas Nusantara', 3000, 'Non PPN', 2000, 3000, '1-1103', 'Persediaan Alat Tulis', 'Map plastik folio warna biru', 'SKU-MAP-001', 'BRG-014', 'Bantex', 'MP-F'),
  
  -- Spare Parts
  ('Ban Mobil Bridgestone', 'Gudang D', 'Unit', 'BAN-BRG-001', 'PT Otomotif Sejahtera', 1200000, 'PPN 11%', 950000, 1200000, '1-1104', 'Persediaan Spare Parts', 'Ban mobil Bridgestone 185/65 R15', 'SKU-BAN-001', 'BRG-015', 'Bridgestone', 'BR-185-65-R15'),
  ('Oli Mesin Shell Helix', 'Gudang D', 'Liter', 'OLI-SHL-001', 'PT Otomotif Sejahtera', 85000, 'PPN 11%', 65000, 85000, '1-1104', 'Persediaan Spare Parts', 'Oli mesin Shell Helix HX7 10W-40', 'SKU-OLI-001', 'BRG-016', 'Shell', 'HX7-10W40'),
  ('Aki Mobil GS Astra', 'Gudang D', 'Unit', 'AKI-GSA-001', 'PT Otomotif Sejahtera', 850000, 'PPN 11%', 650000, 850000, '1-1104', 'Persediaan Spare Parts', 'Aki mobil GS Astra NS60 12V 45Ah', 'SKU-AKI-001', 'BRG-017', 'GS Astra', 'NS60'),
  ('Filter Udara Denso', 'Gudang D', 'Pcs', 'FLT-DNS-001', 'PT Otomotif Sejahtera', 150000, 'PPN 11%', 110000, 150000, '1-1104', 'Persediaan Spare Parts', 'Filter udara Denso untuk mobil sedan', 'SKU-FLT-001', 'BRG-018', 'Denso', 'AF-001')
ON CONFLICT (barcode) DO UPDATE SET
  item_name = EXCLUDED.item_name,
  location = EXCLUDED.location,
  unit = EXCLUDED.unit,
  supplier_name = EXCLUDED.supplier_name,
  nominal_barang = EXCLUDED.nominal_barang,
  ppn_type = EXCLUDED.ppn_type,
  purchase_price = EXCLUDED.purchase_price,
  selling_price = EXCLUDED.selling_price,
  coa_account_code = EXCLUDED.coa_account_code,
  coa_account_name = EXCLUDED.coa_account_name,
  description = EXCLUDED.description,
  sku = EXCLUDED.sku,
  kode_barang = EXCLUDED.kode_barang,
  brand = EXCLUDED.brand,
  part_number = EXCLUDED.part_number,
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

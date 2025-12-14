-- Tambah COA untuk kategori baru
INSERT INTO chart_of_accounts (account_code, account_name, account_type, normal_balance, level, parent_code, is_header, is_active, description)
VALUES 
  ('1-1105', 'Persediaan Minimarket', 'Aset', 'Debit', 3, '1-0000', false, true, 'Persediaan barang minimarket'),
  ('1-1106', 'Persediaan Material', 'Aset', 'Debit', 3, '1-0000', false, true, 'Persediaan material bangunan'),
  ('1-1107', 'Persediaan Alat Kesehatan', 'Aset', 'Debit', 3, '1-0000', false, true, 'Persediaan alat kesehatan'),
  ('4-1104', 'Pendapatan Penjualan Minimarket', 'Pendapatan', 'Kredit', 3, '4-0000', false, true, 'Pendapatan minimarket'),
  ('4-1105', 'Pendapatan Penjualan Material', 'Pendapatan', 'Kredit', 3, '4-0000', false, true, 'Pendapatan material'),
  ('4-1106', 'Pendapatan Penjualan Alat Kesehatan', 'Pendapatan', 'Kredit', 3, '4-0000', false, true, 'Pendapatan alat kesehatan'),
  ('5-1104', 'HPP Minimarket', 'Beban Pokok Penjualan', 'Debit', 3, '5-0000', false, true, 'HPP minimarket'),
  ('5-1105', 'HPP Material', 'Beban Pokok Penjualan', 'Debit', 3, '5-0000', false, true, 'HPP material'),
  ('5-1106', 'HPP Alat Kesehatan', 'Beban Pokok Penjualan', 'Debit', 3, '5-0000', false, true, 'HPP alat kesehatan')
ON CONFLICT (account_code) DO NOTHING;

-- Insert data barang minimarket
INSERT INTO stock (
  item_name, jenis_barang, location, unit, barcode, supplier_name, 
  nominal_barang, ppn_type, purchase_price, selling_price,
  coa_account_code, coa_account_name, description, sku, kode_barang, brand, part_number
) VALUES 
  -- Makanan & Minuman
  ('Indomie', 'Indomie Goreng Original', 'Gudang E', 'Pcs', 'MKN-001', 'PT Indofood', 3000, 'PPN 11%', 2500, 3000, '1-1105', 'Persediaan Minimarket', 'Mie instan goreng', 'SKU-MKN-001', 'BRG-020', 'Indomie', 'IG-001'),
  ('Aqua', 'Aqua 600ml', 'Gudang E', 'Pcs', 'MNM-001', 'PT Aqua', 4000, 'PPN 11%', 3000, 4000, '1-1105', 'Persediaan Minimarket', 'Air mineral 600ml', 'SKU-MNM-001', 'BRG-021', 'Aqua', 'AQ-600'),
  ('Susu', 'Susu Ultra Milk 1L', 'Gudang E', 'Pcs', 'MNM-002', 'PT Ultrajaya', 18000, 'PPN 11%', 15000, 18000, '1-1105', 'Persediaan Minimarket', 'Susu UHT 1 liter', 'SKU-MNM-002', 'BRG-022', 'Ultra Milk', 'UM-1L'),
  ('Kopi', 'Kapal Api Special Mix', 'Gudang E', 'Pcs', 'MNM-003', 'PT Santos Jaya', 2000, 'PPN 11%', 1500, 2000, '1-1105', 'Persediaan Minimarket', 'Kopi sachet', 'SKU-MNM-003', 'BRG-023', 'Kapal Api', 'KA-SM'),
  ('Teh', 'Teh Sariwangi Celup', 'Gudang E', 'Box', 'MNM-004', 'PT Unilever', 8000, 'PPN 11%', 6500, 8000, '1-1105', 'Persediaan Minimarket', 'Teh celup isi 25', 'SKU-MNM-004', 'BRG-024', 'Sariwangi', 'SW-25'),
  ('Gula', 'Gula Pasir Gulaku 1kg', 'Gudang E', 'Kg', 'MKN-002', 'PT Sugar Group', 15000, 'PPN 11%', 12000, 15000, '1-1105', 'Persediaan Minimarket', 'Gula pasir premium', 'SKU-MKN-002', 'BRG-025', 'Gulaku', 'GL-1K'),
  ('Minyak', 'Minyak Goreng Bimoli 2L', 'Gudang E', 'Pcs', 'MKN-003', 'PT Salim Ivomas', 35000, 'PPN 11%', 30000, 35000, '1-1105', 'Persediaan Minimarket', 'Minyak goreng 2 liter', 'SKU-MKN-003', 'BRG-026', 'Bimoli', 'BM-2L'),
  ('Beras', 'Beras Rojo Lele 5kg', 'Gudang E', 'Kg', 'MKN-004', 'PT Pangan Sejahtera', 65000, 'PPN 11%', 55000, 65000, '1-1105', 'Persediaan Minimarket', 'Beras premium 5kg', 'SKU-MKN-004', 'BRG-027', 'Rojo Lele', 'RL-5K'),
  ('Sabun', 'Sabun Lifebuoy 85gr', 'Gudang E', 'Pcs', 'HYG-001', 'PT Unilever', 4500, 'PPN 11%', 3500, 4500, '1-1105', 'Persediaan Minimarket', 'Sabun mandi batang', 'SKU-HYG-001', 'BRG-028', 'Lifebuoy', 'LB-85'),
  ('Shampo', 'Shampo Pantene 170ml', 'Gudang E', 'Pcs', 'HYG-002', 'PT P&G', 18000, 'PPN 11%', 15000, 18000, '1-1105', 'Persediaan Minimarket', 'Shampo anti rontok', 'SKU-HYG-002', 'BRG-029', 'Pantene', 'PT-170'),
  
  -- Material Bangunan
  ('Semen', 'Semen Gresik 50kg', 'Gudang F', 'Sak', 'MAT-001', 'PT Semen Indonesia', 65000, 'PPN 11%', 55000, 65000, '1-1106', 'Persediaan Material', 'Semen portland 50kg', 'SKU-MAT-001', 'BRG-030', 'Gresik', 'SG-50'),
  ('Pasir', 'Pasir Beton per m3', 'Gudang F', 'M3', 'MAT-002', 'CV Bahan Bangunan', 350000, 'PPN 11%', 300000, 350000, '1-1106', 'Persediaan Material', 'Pasir beton curah', 'SKU-MAT-002', 'BRG-031', 'Lokal', 'PB-M3'),
  ('Bata', 'Bata Merah Press', 'Gudang F', 'Pcs', 'MAT-003', 'CV Bahan Bangunan', 1200, 'PPN 11%', 1000, 1200, '1-1106', 'Persediaan Material', 'Bata merah press', 'SKU-MAT-003', 'BRG-032', 'Lokal', 'BM-PR'),
  ('Cat', 'Cat Tembok Avian 5kg', 'Gudang F', 'Pail', 'MAT-004', 'PT Avia Avian', 180000, 'PPN 11%', 150000, 180000, '1-1106', 'Persediaan Material', 'Cat tembok interior', 'SKU-MAT-004', 'BRG-033', 'Avian', 'AV-5K'),
  ('Pipa', 'Pipa PVC Rucika 3 inch', 'Gudang F', 'Btg', 'MAT-005', 'PT Rucika', 85000, 'PPN 11%', 70000, 85000, '1-1106', 'Persediaan Material', 'Pipa PVC 3 inch 4m', 'SKU-MAT-005', 'BRG-034', 'Rucika', 'RC-3I'),
  ('Keramik', 'Keramik Roman 40x40', 'Gudang F', 'Box', 'MAT-006', 'PT Roman Ceramics', 120000, 'PPN 11%', 100000, 120000, '1-1106', 'Persediaan Material', 'Keramik lantai 40x40', 'SKU-MAT-006', 'BRG-035', 'Roman', 'RM-4040'),
  ('Besi', 'Besi Beton 10mm 12m', 'Gudang F', 'Btg', 'MAT-007', 'PT Krakatau Steel', 95000, 'PPN 11%', 80000, 95000, '1-1106', 'Persediaan Material', 'Besi beton polos 10mm', 'SKU-MAT-007', 'BRG-036', 'KS', 'BB-10'),
  ('Triplek', 'Triplek 4mm 122x244', 'Gudang F', 'Lbr', 'MAT-008', 'PT Kayu Lapis', 85000, 'PPN 11%', 70000, 85000, '1-1106', 'Persediaan Material', 'Triplek 4mm standar', 'SKU-MAT-008', 'BRG-037', 'Lokal', 'TP-4M'),
  
  -- Alat Kesehatan
  ('Masker', 'Masker Medis 3 Ply', 'Gudang G', 'Box', 'MED-001', 'PT Sensi', 45000, 'PPN 11%', 35000, 45000, '1-1107', 'Persediaan Alat Kesehatan', 'Masker medis isi 50', 'SKU-MED-001', 'BRG-038', 'Sensi', 'MS-3P'),
  ('Sarung Tangan', 'Sarung Tangan Latex', 'Gudang G', 'Box', 'MED-002', 'PT OneMed', 55000, 'PPN 11%', 45000, 55000, '1-1107', 'Persediaan Alat Kesehatan', 'Sarung tangan latex isi 100', 'SKU-MED-002', 'BRG-039', 'OneMed', 'ST-LX'),
  ('Termometer', 'Termometer Digital', 'Gudang G', 'Pcs', 'MED-003', 'PT Omron', 85000, 'PPN 11%', 70000, 85000, '1-1107', 'Persediaan Alat Kesehatan', 'Termometer digital infrared', 'SKU-MED-003', 'BRG-040', 'Omron', 'OM-TM'),
  ('Tensimeter', 'Tensimeter Digital', 'Gudang G', 'Pcs', 'MED-004', 'PT Omron', 350000, 'PPN 11%', 300000, 350000, '1-1107', 'Persediaan Alat Kesehatan', 'Tensimeter digital lengan', 'SKU-MED-004', 'BRG-041', 'Omron', 'OM-TS'),
  ('Plester', 'Plester Hansaplast', 'Gudang G', 'Box', 'MED-005', 'PT Hansaplast', 25000, 'PPN 11%', 20000, 25000, '1-1107', 'Persediaan Alat Kesehatan', 'Plester luka isi 20', 'SKU-MED-005', 'BRG-042', 'Hansaplast', 'HP-20'),
  ('Alkohol', 'Alkohol 70% 1L', 'Gudang G', 'Btl', 'MED-006', 'PT OneMed', 35000, 'PPN 11%', 28000, 35000, '1-1107', 'Persediaan Alat Kesehatan', 'Alkohol antiseptik 1 liter', 'SKU-MED-006', 'BRG-043', 'OneMed', 'AL-1L'),
  ('Perban', 'Perban Gulung 5cm', 'Gudang G', 'Pcs', 'MED-007', 'PT Softex', 8000, 'PPN 11%', 6000, 8000, '1-1107', 'Persediaan Alat Kesehatan', 'Perban gulung elastis', 'SKU-MED-007', 'BRG-044', 'Softex', 'PB-5C'),
  ('Kapas', 'Kapas Pembalut 100gr', 'Gudang G', 'Pcs', 'MED-008', 'PT Selection', 15000, 'PPN 11%', 12000, 15000, '1-1107', 'Persediaan Alat Kesehatan', 'Kapas pembalut steril', 'SKU-MED-008', 'BRG-045', 'Selection', 'KP-100'),
  ('Betadine', 'Betadine Solution 60ml', 'Gudang G', 'Btl', 'MED-009', 'PT Mundipharma', 28000, 'PPN 11%', 23000, 28000, '1-1107', 'Persediaan Alat Kesehatan', 'Antiseptik betadine', 'SKU-MED-009', 'BRG-046', 'Betadine', 'BD-60'),
  ('Kasa', 'Kasa Steril 10x10', 'Gudang G', 'Box', 'MED-010', 'PT OneMed', 35000, 'PPN 11%', 28000, 35000, '1-1107', 'Persediaan Alat Kesehatan', 'Kasa steril isi 25', 'SKU-MED-010', 'BRG-047', 'OneMed', 'KS-10'),
  
  -- ATK Tambahan
  ('Buku Tulis', 'Buku Tulis Sinar Dunia 38 Lembar', 'Gudang C', 'Pcs', 'ATK-001', 'PT Sinar Dunia', 4000, 'Non PPN', 3000, 4000, '1-1103', 'Persediaan Alat Tulis', 'Buku tulis 38 lembar', 'SKU-ATK-001', 'BRG-048', 'Sinar Dunia', 'SD-38'),
  ('Pensil', 'Pensil 2B Faber Castell', 'Gudang C', 'Pcs', 'ATK-002', 'PT Faber Castell', 3500, 'Non PPN', 2500, 3500, '1-1103', 'Persediaan Alat Tulis', 'Pensil 2B', 'SKU-ATK-002', 'BRG-049', 'Faber Castell', 'FC-2B'),
  ('Penghapus', 'Penghapus Steadtler', 'Gudang C', 'Pcs', 'ATK-003', 'PT Steadtler', 5000, 'Non PPN', 3500, 5000, '1-1103', 'Persediaan Alat Tulis', 'Penghapus putih', 'SKU-ATK-003', 'BRG-050', 'Steadtler', 'ST-ER'),
  ('Penggaris', 'Penggaris 30cm Butterfly', 'Gudang C', 'Pcs', 'ATK-004', 'PT Butterfly', 4000, 'Non PPN', 3000, 4000, '1-1103', 'Persediaan Alat Tulis', 'Penggaris plastik 30cm', 'SKU-ATK-004', 'BRG-051', 'Butterfly', 'BF-30'),
  ('Lem', 'Lem Kertas UHU 60ml', 'Gudang C', 'Pcs', 'ATK-005', 'PT UHU', 12000, 'Non PPN', 9000, 12000, '1-1103', 'Persediaan Alat Tulis', 'Lem kertas cair', 'SKU-ATK-005', 'BRG-052', 'UHU', 'UH-60'),
  ('Gunting', 'Gunting Kenko', 'Gudang C', 'Pcs', 'ATK-006', 'PT Kenko', 15000, 'Non PPN', 12000, 15000, '1-1103', 'Persediaan Alat Tulis', 'Gunting stainless', 'SKU-ATK-006', 'BRG-053', 'Kenko', 'KK-SC'),
  ('Cutter', 'Cutter Kenko Besar', 'Gudang C', 'Pcs', 'ATK-007', 'PT Kenko', 8000, 'Non PPN', 6000, 8000, '1-1103', 'Persediaan Alat Tulis', 'Cutter besar', 'SKU-ATK-007', 'BRG-054', 'Kenko', 'KK-CT'),
  ('Tipe-X', 'Tipe-X Kenko', 'Gudang C', 'Pcs', 'ATK-008', 'PT Kenko', 6000, 'Non PPN', 4500, 6000, '1-1103', 'Persediaan Alat Tulis', 'Tipe-X correction pen', 'SKU-ATK-008', 'BRG-055', 'Kenko', 'KK-TX')
ON CONFLICT (barcode) DO NOTHING;

-- Update COA mapping
INSERT INTO coa_category_mapping (
  service_category, service_type, asset_account_code, revenue_account_code, cogs_account_code, description
) VALUES
  ('Barang', 'Minimarket', '1-1105', '4-1104', '5-1104', 'Mapping untuk barang minimarket'),
  ('Barang', 'Material', '1-1106', '4-1105', '5-1105', 'Mapping untuk material bangunan'),
  ('Barang', 'Alat Kesehatan', '1-1107', '4-1106', '5-1106', 'Mapping untuk alat kesehatan')
ON CONFLICT (service_category, service_type) DO UPDATE SET
  asset_account_code = EXCLUDED.asset_account_code,
  revenue_account_code = EXCLUDED.revenue_account_code,
  cogs_account_code = EXCLUDED.cogs_account_code,
  description = EXCLUDED.description;

-- Complete COA Mapping Rules for all service categories

-- Jasa Cargo mappings
INSERT INTO coa_category_mapping (service_category, service_type, revenue_account_code, cogs_account_code, description, is_active)
VALUES 
  ('Jasa Cargo', 'Cargo Udara Domestik', '4-1100', '5-1100', 'Jasa pengiriman cargo udara dalam negeri', true),
  ('Jasa Cargo', 'Cargo Udara Internasional', '4-1100', '5-1100', 'Jasa pengiriman cargo udara luar negeri', true),
  ('Jasa Cargo', 'Cargo Laut Domestik', '4-1100', '5-1100', 'Jasa pengiriman cargo laut dalam negeri', true),
  ('Jasa Cargo', 'Cargo Laut Internasional', '4-1100', '5-1100', 'Jasa pengiriman cargo laut luar negeri', true),
  ('Jasa Cargo', 'Cargo Darat', '4-1100', '5-1100', 'Jasa pengiriman cargo darat', true)
ON CONFLICT (service_category, service_type) DO UPDATE
SET revenue_account_code = EXCLUDED.revenue_account_code,
    cogs_account_code = EXCLUDED.cogs_account_code,
    description = EXCLUDED.description;

-- Jasa Gudang mappings
INSERT INTO coa_category_mapping (service_category, service_type, revenue_account_code, cogs_account_code, description, is_active)
VALUES 
  ('Jasa Gudang', 'Sewa Gudang', '4-1200', '5-1200', 'Pendapatan sewa gudang', true),
  ('Jasa Gudang', 'Handling', '4-1200', '5-1200', 'Jasa bongkar muat barang', true),
  ('Jasa Gudang', 'Stuffing/Unstuffing', '4-1200', '5-1200', 'Jasa stuffing dan unstuffing kontainer', true),
  ('Jasa Gudang', 'Packing/Repacking', '4-1200', '5-1200', 'Jasa packing dan repacking barang', true),
  ('Jasa Gudang', 'Labeling', '4-1200', '5-1200', 'Jasa pelabelan barang', true),
  ('Jasa Gudang', 'Sortir', '4-1200', '5-1200', 'Jasa sortir barang', true)
ON CONFLICT (service_category, service_type) DO UPDATE
SET revenue_account_code = EXCLUDED.revenue_account_code,
    cogs_account_code = EXCLUDED.cogs_account_code,
    description = EXCLUDED.description;

-- Jasa Kepabeanan mappings
INSERT INTO coa_category_mapping (service_category, service_type, revenue_account_code, cogs_account_code, description, is_active)
VALUES 
  ('Jasa Kepabeanan', 'Custom Clearance Import', '4-1300', '5-1300', 'Jasa pengurusan bea cukai impor', true),
  ('Jasa Kepabeanan', 'Custom Clearance Export', '4-1300', '5-1300', 'Jasa pengurusan bea cukai ekspor', true),
  ('Jasa Kepabeanan', 'Undername', '4-1300', '5-1300', 'Jasa undername kepabeanan', true)
ON CONFLICT (service_category, service_type) DO UPDATE
SET revenue_account_code = EXCLUDED.revenue_account_code,
    cogs_account_code = EXCLUDED.cogs_account_code,
    description = EXCLUDED.description;

-- Jasa Trucking mappings
INSERT INTO coa_category_mapping (service_category, service_type, revenue_account_code, cogs_account_code, description, is_active)
VALUES 
  ('Jasa Trucking', 'Trucking Lokal', '4-1400', '5-1400', 'Jasa trucking dalam kota', true),
  ('Jasa Trucking', 'Trucking Antar Kota', '4-1400', '5-1400', 'Jasa trucking antar kota', true),
  ('Jasa Trucking', 'Trucking Kontainer', '4-1400', '5-1400', 'Jasa trucking kontainer', true)
ON CONFLICT (service_category, service_type) DO UPDATE
SET revenue_account_code = EXCLUDED.revenue_account_code,
    cogs_account_code = EXCLUDED.cogs_account_code,
    description = EXCLUDED.description;

-- Jasa Lainnya mappings
INSERT INTO coa_category_mapping (service_category, service_type, revenue_account_code, cogs_account_code, description, is_active)
VALUES 
  ('Jasa Lainnya', 'Konsultasi', '4-1900', '5-1900', 'Jasa konsultasi', true),
  ('Jasa Lainnya', 'Survey', '4-1900', '5-1900', 'Jasa survey', true),
  ('Jasa Lainnya', 'Administrasi', '4-1900', '5-1900', 'Jasa administrasi', true),
  ('Jasa Lainnya', 'Asuransi', '4-1900', '5-1900', 'Jasa asuransi', true)
ON CONFLICT (service_category, service_type) DO UPDATE
SET revenue_account_code = EXCLUDED.revenue_account_code,
    cogs_account_code = EXCLUDED.cogs_account_code,
    description = EXCLUDED.description;

-- Persediaan mappings (with asset account)
INSERT INTO coa_category_mapping (service_category, service_type, asset_account_code, cogs_account_code, description, is_active)
VALUES 
  ('Persediaan', 'Barang Dagangan', '1-1300', '5-1000', 'Persediaan barang dagangan', true),
  ('Persediaan', 'Bahan Baku', '1-1310', '5-1000', 'Persediaan bahan baku', true),
  ('Persediaan', 'Barang Dalam Proses', '1-1320', '5-1000', 'Persediaan barang dalam proses', true),
  ('Persediaan', 'Barang Jadi', '1-1330', '5-1000', 'Persediaan barang jadi', true),
  ('Persediaan', 'Suku Cadang', '1-1340', '5-1000', 'Persediaan suku cadang', true),
  ('Persediaan', 'Barang Habis Pakai', '1-1350', '5-1000', 'Persediaan barang habis pakai', true)
ON CONFLICT (service_category, service_type) DO UPDATE
SET asset_account_code = EXCLUDED.asset_account_code,
    cogs_account_code = EXCLUDED.cogs_account_code,
    description = EXCLUDED.description;

-- Beban mappings
INSERT INTO coa_category_mapping (service_category, service_type, cogs_account_code, description, is_active)
VALUES 
  ('Beban', 'Beban Gaji', '6-1100', 'Beban gaji karyawan', true),
  ('Beban', 'Beban Sewa', '6-1200', 'Beban sewa kantor/gudang', true),
  ('Beban', 'Beban Listrik', '6-1300', 'Beban listrik', true),
  ('Beban', 'Beban Air', '6-1310', 'Beban air', true),
  ('Beban', 'Beban Telepon & Internet', '6-1320', 'Beban telepon dan internet', true),
  ('Beban', 'Beban Perlengkapan Kantor', '6-1400', 'Beban perlengkapan kantor', true),
  ('Beban', 'Beban Pemeliharaan', '6-1500', 'Beban pemeliharaan dan perbaikan', true),
  ('Beban', 'Beban BBM', '6-1600', 'Beban bahan bakar minyak', true),
  ('Beban', 'Beban Transportasi', '6-1700', 'Beban transportasi', true),
  ('Beban', 'Beban Asuransi', '6-1800', 'Beban asuransi', true),
  ('Beban', 'Beban Pajak', '6-1900', 'Beban pajak', true),
  ('Beban', 'Beban Lain-lain', '6-9900', 'Beban operasional lainnya', true)
ON CONFLICT (service_category, service_type) DO UPDATE
SET cogs_account_code = EXCLUDED.cogs_account_code,
    description = EXCLUDED.description;

-- Unit Disewakan mappings
INSERT INTO coa_category_mapping (service_category, service_type, revenue_account_code, asset_account_code, description, is_active)
VALUES 
  ('Unit Disewakan', 'Kendaraan', '4-1500', '1-2100', 'Pendapatan sewa kendaraan', true),
  ('Unit Disewakan', 'Alat Berat', '4-1500', '1-2200', 'Pendapatan sewa alat berat', true),
  ('Unit Disewakan', 'Peralatan', '4-1500', '1-2300', 'Pendapatan sewa peralatan', true)
ON CONFLICT (service_category, service_type) DO UPDATE
SET revenue_account_code = EXCLUDED.revenue_account_code,
    asset_account_code = EXCLUDED.asset_account_code,
    description = EXCLUDED.description;

-- Add missing columns to product_reference table for complete auto-population
ALTER TABLE product_reference 
  ADD COLUMN IF NOT EXISTS satuan TEXT,
  ADD COLUMN IF NOT EXISTS berat NUMERIC,
  ADD COLUMN IF NOT EXISTS volume NUMERIC,
  ADD COLUMN IF NOT EXISTS hs_code TEXT,
  ADD COLUMN IF NOT EXISTS kategori_layanan TEXT,
  ADD COLUMN IF NOT EXISTS jenis_layanan TEXT;

-- Update existing data with complete information
UPDATE product_reference SET
  satuan = unit,
  berat = CAST(typical_weight AS NUMERIC),
  kategori_layanan = service_category,
  jenis_layanan = service_type
WHERE satuan IS NULL OR berat IS NULL;

-- Update Air Mineral products with complete data
UPDATE product_reference SET
  satuan = 'pcs',
  berat = 0.6,
  volume = 0.6,
  hs_code = '2201.10.00',
  kategori_layanan = 'Minuman',
  jenis_layanan = 'Minuman Kemasan',
  coa_account_code = '1-1400',
  coa_account_name = 'Persediaan Barang Dagangan'
WHERE item_name = 'Air Mineral';

-- Update Mie Instan products
UPDATE product_reference SET
  satuan = 'pcs',
  berat = 0.085,
  volume = 0.1,
  hs_code = '1902.30.00',
  kategori_layanan = 'Makanan',
  jenis_layanan = 'Makanan Kemasan',
  coa_account_code = '1-1400',
  coa_account_name = 'Persediaan Barang Dagangan'
WHERE item_name = 'Mie Instan';

-- Update Susu UHT products
UPDATE product_reference SET
  satuan = 'pcs',
  berat = 0.25,
  volume = 0.25,
  hs_code = '0401.20.00',
  kategori_layanan = 'Minuman',
  jenis_layanan = 'Minuman Kemasan',
  coa_account_code = '1-1400',
  coa_account_name = 'Persediaan Barang Dagangan'
WHERE item_name = 'Susu UHT';

-- Update Kopi Instan products
UPDATE product_reference SET
  satuan = 'pcs',
  berat = 0.025,
  volume = 0.03,
  hs_code = '2101.11.00',
  kategori_layanan = 'Minuman',
  jenis_layanan = 'Minuman Kemasan',
  coa_account_code = '1-1400',
  coa_account_name = 'Persediaan Barang Dagangan'
WHERE item_name = 'Kopi Instan';

-- Update Teh Celup products
UPDATE product_reference SET
  satuan = 'pcs',
  berat = 0.05,
  volume = 0.05,
  hs_code = '0902.30.00',
  kategori_layanan = 'Minuman',
  jenis_layanan = 'Minuman Kemasan',
  coa_account_code = '1-1400',
  coa_account_name = 'Persediaan Barang Dagangan'
WHERE item_name = 'Teh Celup';

-- Update Sabun Mandi products
UPDATE product_reference SET
  satuan = 'pcs',
  berat = 0.1,
  volume = 0.12,
  hs_code = '3401.11.00',
  kategori_layanan = 'Kebersihan',
  jenis_layanan = 'Produk Kebersihan',
  coa_account_code = '1-1400',
  coa_account_name = 'Persediaan Barang Dagangan'
WHERE item_name = 'Sabun Mandi';

-- Update Shampo products
UPDATE product_reference SET
  satuan = 'pcs',
  berat = 0.35,
  volume = 0.35,
  hs_code = '3305.10.00',
  kategori_layanan = 'Kebersihan',
  jenis_layanan = 'Produk Kebersihan',
  coa_account_code = '1-1400',
  coa_account_name = 'Persediaan Barang Dagangan'
WHERE item_name = 'Shampo';

-- Update Pasta Gigi products
UPDATE product_reference SET
  satuan = 'pcs',
  berat = 0.15,
  volume = 0.15,
  hs_code = '3306.10.00',
  kategori_layanan = 'Kebersihan',
  jenis_layanan = 'Produk Kebersihan',
  coa_account_code = '1-1400',
  coa_account_name = 'Persediaan Barang Dagangan'
WHERE item_name = 'Pasta Gigi';

-- Update Deterjen products
UPDATE product_reference SET
  satuan = 'kg',
  berat = 1.0,
  volume = 1.2,
  hs_code = '3402.20.00',
  kategori_layanan = 'Kebersihan',
  jenis_layanan = 'Produk Kebersihan',
  coa_account_code = '1-1400',
  coa_account_name = 'Persediaan Barang Dagangan'
WHERE item_name = 'Deterjen';

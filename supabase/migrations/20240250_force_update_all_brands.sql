-- Force update all brands with correct data, overriding any incorrect values

-- Air Mineral brands
UPDATE brands SET 
  satuan = 'pcs',
  berat = 0.6,
  volume = 0.6,
  kategori_layanan = 'Minuman',
  jenis_layanan = 'Minuman Kemasan',
  coa_account_code = '1-1400',
  coa_account_name = 'Persediaan Barang Dagangan'
WHERE brand_name IN ('Aqua', 'Le Minerale', 'Pristine', 'Ades', 'Vit', 'Club', 'Cleo', 'Nestle Pure Life', 'Evian', 'Fiji');

-- Mie Instan brands
UPDATE brands SET 
  satuan = 'pcs',
  berat = 0.085,
  volume = 0.1,
  kategori_layanan = 'Makanan',
  jenis_layanan = 'Makanan Kemasan',
  coa_account_code = '1-1400',
  coa_account_name = 'Persediaan Barang Dagangan'
WHERE brand_name IN ('Indomie', 'Mie Sedaap', 'Sarimi', 'Supermi');

-- Susu UHT brands
UPDATE brands SET 
  satuan = 'pcs',
  berat = 0.25,
  volume = 0.25,
  kategori_layanan = 'Minuman',
  jenis_layanan = 'Minuman Kemasan',
  coa_account_code = '1-1400',
  coa_account_name = 'Persediaan Barang Dagangan'
WHERE brand_name IN ('Ultra Milk', 'Indomilk', 'Frisian Flag', 'Greenfields');

-- Kopi brands
UPDATE brands SET 
  satuan = 'pcs',
  berat = 0.025,
  volume = 0.03,
  kategori_layanan = 'Minuman',
  jenis_layanan = 'Minuman Kemasan',
  coa_account_code = '1-1400',
  coa_account_name = 'Persediaan Barang Dagangan'
WHERE brand_name IN ('Kapal Api', 'Nescafe', 'Good Day', 'Torabika', 'ABC');

-- Teh brands
UPDATE brands SET 
  satuan = 'pcs',
  berat = 0.05,
  volume = 0.05,
  kategori_layanan = 'Minuman',
  jenis_layanan = 'Minuman Kemasan',
  coa_account_code = '1-1400',
  coa_account_name = 'Persediaan Barang Dagangan'
WHERE brand_name IN ('Sariwangi', 'Sosro', 'Teh Pucuk', 'Fruit Tea');

-- Sabun brands
UPDATE brands SET 
  satuan = 'pcs',
  berat = 0.1,
  volume = 0.12,
  kategori_layanan = 'Kebersihan',
  jenis_layanan = 'Produk Kebersihan',
  coa_account_code = '1-1400',
  coa_account_name = 'Persediaan Barang Dagangan'
WHERE brand_name IN ('Lifebuoy', 'Lux', 'Nuvo', 'Dettol', 'Biore');

-- Shampo brands
UPDATE brands SET 
  satuan = 'pcs',
  berat = 0.12,
  volume = 0.15,
  kategori_layanan = 'Kebersihan',
  jenis_layanan = 'Produk Kebersihan',
  coa_account_code = '1-1400',
  coa_account_name = 'Persediaan Barang Dagangan'
WHERE brand_name IN ('Pantene', 'Sunsilk', 'Clear', 'Dove', 'Rejoice');

-- Pasta Gigi brands
UPDATE brands SET 
  satuan = 'pcs',
  berat = 0.15,
  volume = 0.18,
  kategori_layanan = 'Kebersihan',
  jenis_layanan = 'Produk Kebersihan',
  coa_account_code = '1-1400',
  coa_account_name = 'Persediaan Barang Dagangan'
WHERE brand_name IN ('Pepsodent', 'Close Up', 'Sensodyne', 'Formula');

-- Deterjen brands
UPDATE brands SET 
  satuan = 'pcs',
  berat = 0.8,
  volume = 1.0,
  kategori_layanan = 'Kebersihan',
  jenis_layanan = 'Produk Kebersihan',
  coa_account_code = '1-1400',
  coa_account_name = 'Persediaan Barang Dagangan'
WHERE brand_name IN ('Rinso', 'Attack', 'So Klin', 'Daia');

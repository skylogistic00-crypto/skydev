-- Add coa_account_code and coa_account_name to brands table
ALTER TABLE brands 
  ADD COLUMN IF NOT EXISTS coa_account_code TEXT,
  ADD COLUMN IF NOT EXISTS coa_account_name TEXT;

-- Update Air Mineral brands with COA
UPDATE brands SET 
  coa_account_code = '1-1400',
  coa_account_name = 'Persediaan Barang Dagangan'
WHERE brand_name IN ('Aqua', 'Le Minerale', 'Pristine', 'Ades', 'Vit');

-- Update Mie Instan brands with COA
UPDATE brands SET 
  coa_account_code = '1-1400',
  coa_account_name = 'Persediaan Barang Dagangan'
WHERE brand_name IN ('Indomie', 'Mie Sedaap', 'Sarimi', 'Supermi');

-- Update Susu UHT brands with COA
UPDATE brands SET 
  coa_account_code = '1-1400',
  coa_account_name = 'Persediaan Barang Dagangan'
WHERE brand_name IN ('Ultra Milk', 'Indomilk', 'Frisian Flag', 'Greenfields');

-- Update Kopi brands with COA
UPDATE brands SET 
  coa_account_code = '1-1400',
  coa_account_name = 'Persediaan Barang Dagangan'
WHERE brand_name IN ('Kapal Api', 'Nescafe', 'Good Day', 'Torabika', 'ABC');

-- Update Teh brands with COA
UPDATE brands SET 
  coa_account_code = '1-1400',
  coa_account_name = 'Persediaan Barang Dagangan'
WHERE brand_name IN ('Sariwangi', 'Sosro', 'Teh Pucuk', 'Fruit Tea');

-- Update Sabun brands with COA
UPDATE brands SET 
  coa_account_code = '1-1400',
  coa_account_name = 'Persediaan Barang Dagangan'
WHERE brand_name IN ('Lifebuoy', 'Lux', 'Nuvo', 'Dettol', 'Biore');

-- Update Shampo brands with COA
UPDATE brands SET 
  coa_account_code = '1-1400',
  coa_account_name = 'Persediaan Barang Dagangan'
WHERE brand_name IN ('Pantene', 'Sunsilk', 'Clear', 'Dove', 'Rejoice');

-- Update Pasta Gigi brands with COA
UPDATE brands SET 
  coa_account_code = '1-1400',
  coa_account_name = 'Persediaan Barang Dagangan'
WHERE brand_name IN ('Pepsodent', 'Close Up', 'Sensodyne', 'Formula');

-- Update Deterjen brands with COA
UPDATE brands SET 
  coa_account_code = '1-1400',
  coa_account_name = 'Persediaan Barang Dagangan'
WHERE brand_name IN ('Rinso', 'Attack', 'So Klin', 'Daia');

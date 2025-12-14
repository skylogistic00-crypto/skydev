-- Add berat, satuan, volume to brands table
ALTER TABLE brands 
  ADD COLUMN IF NOT EXISTS satuan TEXT,
  ADD COLUMN IF NOT EXISTS berat NUMERIC,
  ADD COLUMN IF NOT EXISTS volume NUMERIC;

-- Update existing brands with typical values based on common products
-- Air Mineral brands
UPDATE brands SET 
  satuan = 'pcs',
  berat = 0.6,
  volume = 0.6
WHERE brand_name IN ('Aqua', 'Le Minerale', 'Pristine', 'Ades', 'Vit');

-- Mie Instan brands
UPDATE brands SET 
  satuan = 'pcs',
  berat = 0.085,
  volume = 0.1
WHERE brand_name IN ('Indomie', 'Mie Sedaap', 'Sarimi', 'Supermi');

-- Susu UHT brands
UPDATE brands SET 
  satuan = 'pcs',
  berat = 0.25,
  volume = 0.25
WHERE brand_name IN ('Ultra Milk', 'Indomilk', 'Frisian Flag', 'Greenfields');

-- Kopi brands
UPDATE brands SET 
  satuan = 'pcs',
  berat = 0.025,
  volume = 0.03
WHERE brand_name IN ('Kapal Api', 'Nescafe', 'Good Day', 'Torabika', 'ABC');

-- Teh brands
UPDATE brands SET 
  satuan = 'pcs',
  berat = 0.05,
  volume = 0.05
WHERE brand_name IN ('Sariwangi', 'Sosro', 'Teh Pucuk', 'Fruit Tea');

-- Sabun brands
UPDATE brands SET 
  satuan = 'pcs',
  berat = 0.1,
  volume = 0.12
WHERE brand_name IN ('Lifebuoy', 'Lux', 'Nuvo', 'Dettol', 'Biore');

-- Shampo brands
UPDATE brands SET 
  satuan = 'pcs',
  berat = 0.35,
  volume = 0.35
WHERE brand_name IN ('Pantene', 'Sunsilk', 'Clear', 'Dove', 'Rejoice');

-- Pasta Gigi brands
UPDATE brands SET 
  satuan = 'pcs',
  berat = 0.15,
  volume = 0.15
WHERE brand_name IN ('Pepsodent', 'Close Up', 'Sensodyne', 'Formula');

-- Deterjen brands
UPDATE brands SET 
  satuan = 'kg',
  berat = 1.0,
  volume = 1.2
WHERE brand_name IN ('Rinso', 'Attack', 'So Klin', 'Daia');

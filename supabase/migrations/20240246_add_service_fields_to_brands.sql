-- Add kategori_layanan and jenis_layanan to brands table
ALTER TABLE brands 
  ADD COLUMN IF NOT EXISTS kategori_layanan TEXT,
  ADD COLUMN IF NOT EXISTS jenis_layanan TEXT;

-- Update Air Mineral brands
UPDATE brands SET 
  kategori_layanan = 'Minuman',
  jenis_layanan = 'Minuman Kemasan'
WHERE brand_name IN ('Aqua', 'Le Minerale', 'Pristine', 'Ades', 'Vit');

-- Update Mie Instan brands
UPDATE brands SET 
  kategori_layanan = 'Makanan',
  jenis_layanan = 'Makanan Kemasan'
WHERE brand_name IN ('Indomie', 'Mie Sedaap', 'Sarimi', 'Supermi');

-- Update Susu UHT brands
UPDATE brands SET 
  kategori_layanan = 'Minuman',
  jenis_layanan = 'Minuman Kemasan'
WHERE brand_name IN ('Ultra Milk', 'Indomilk', 'Frisian Flag', 'Greenfields');

-- Update Kopi brands
UPDATE brands SET 
  kategori_layanan = 'Minuman',
  jenis_layanan = 'Minuman Kemasan'
WHERE brand_name IN ('Kapal Api', 'Nescafe', 'Good Day', 'Torabika', 'ABC');

-- Update Teh brands
UPDATE brands SET 
  kategori_layanan = 'Minuman',
  jenis_layanan = 'Minuman Kemasan'
WHERE brand_name IN ('Sariwangi', 'Sosro', 'Teh Pucuk', 'Fruit Tea');

-- Update Sabun brands
UPDATE brands SET 
  kategori_layanan = 'Kebersihan',
  jenis_layanan = 'Produk Kebersihan'
WHERE brand_name IN ('Lifebuoy', 'Lux', 'Nuvo', 'Dettol', 'Biore');

-- Update Shampo brands
UPDATE brands SET 
  kategori_layanan = 'Kebersihan',
  jenis_layanan = 'Produk Kebersihan'
WHERE brand_name IN ('Pantene', 'Sunsilk', 'Clear', 'Dove', 'Rejoice');

-- Update Pasta Gigi brands
UPDATE brands SET 
  kategori_layanan = 'Kebersihan',
  jenis_layanan = 'Produk Kebersihan'
WHERE brand_name IN ('Pepsodent', 'Close Up', 'Sensodyne', 'Formula');

-- Update Deterjen brands
UPDATE brands SET 
  kategori_layanan = 'Kebersihan',
  jenis_layanan = 'Produk Kebersihan'
WHERE brand_name IN ('Rinso', 'Attack', 'So Klin', 'Daia');

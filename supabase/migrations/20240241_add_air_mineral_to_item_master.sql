-- Add Air Mineral and other common items to item_master
INSERT INTO item_master (item_name, jenis_barang, brand, description) VALUES
  ('Air Mineral', 'Minuman', 'Aqua', 'Air mineral dalam kemasan botol'),
  ('Air Mineral', 'Minuman', 'Le Minerale', 'Air mineral dalam kemasan botol'),
  ('Air Mineral', 'Minuman', 'Pristine', 'Air mineral dalam kemasan botol'),
  ('Air Mineral', 'Minuman', 'Ades', 'Air mineral dalam kemasan botol'),
  ('Air Mineral', 'Minuman', 'Vit', 'Air mineral dalam kemasan botol'),
  ('Air Mineral', 'Minuman', 'Club', 'Air mineral dalam kemasan botol'),
  ('Air Mineral', 'Minuman', 'Cleo', 'Air mineral dalam kemasan botol'),
  ('Mie Instan', 'Makanan', 'Indomie', 'Mie instan berbagai rasa'),
  ('Mie Instan', 'Makanan', 'Mie Sedaap', 'Mie instan berbagai rasa'),
  ('Susu UHT', 'Minuman', 'Ultra Milk', 'Susu UHT dalam kemasan'),
  ('Susu UHT', 'Minuman', 'Indomilk', 'Susu UHT dalam kemasan'),
  ('Kopi Instan', 'Minuman', 'Kapal Api', 'Kopi instan sachet'),
  ('Kopi Instan', 'Minuman', 'Nescafe', 'Kopi instan sachet'),
  ('Teh Celup', 'Minuman', 'Sariwangi', 'Teh celup dalam kemasan'),
  ('Teh Celup', 'Minuman', 'Sosro', 'Teh celup dalam kemasan'),
  ('Sabun Mandi', 'Kebersihan', 'Lifebuoy', 'Sabun mandi batangan'),
  ('Sabun Mandi', 'Kebersihan', 'Lux', 'Sabun mandi batangan'),
  ('Shampo', 'Kebersihan', 'Pantene', 'Shampo dalam kemasan'),
  ('Shampo', 'Kebersihan', 'Clear', 'Shampo dalam kemasan'),
  ('Pasta Gigi', 'Kebersihan', 'Pepsodent', 'Pasta gigi dalam kemasan'),
  ('Deterjen', 'Kebersihan', 'Rinso', 'Deterjen bubuk')
ON CONFLICT (item_name, jenis_barang, brand) DO NOTHING;

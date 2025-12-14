-- Remove brand column from item_master and update unique constraint
-- First, clear existing data
DELETE FROM item_master;

-- Drop the old unique constraint
ALTER TABLE item_master DROP CONSTRAINT IF EXISTS item_master_item_name_jenis_barang_brand_key;

-- Drop the brand column
ALTER TABLE item_master DROP COLUMN IF EXISTS brand;

-- Add new unique constraint without brand
ALTER TABLE item_master ADD CONSTRAINT item_master_item_name_jenis_barang_key UNIQUE(item_name, jenis_barang);

-- Insert items without brand (brand will come from item_brand_mapping)
INSERT INTO item_master (item_name, jenis_barang, description) VALUES
  ('Air Mineral', 'Minuman', 'Air mineral dalam kemasan botol'),
  ('Mie Instan', 'Makanan', 'Mie instan berbagai rasa'),
  ('Susu UHT', 'Minuman', 'Susu UHT dalam kemasan'),
  ('Kopi Instan', 'Minuman', 'Kopi instan sachet'),
  ('Teh Celup', 'Minuman', 'Teh celup dalam kemasan'),
  ('Sabun Mandi', 'Kebersihan', 'Sabun mandi batangan'),
  ('Shampo', 'Kebersihan', 'Shampo dalam kemasan'),
  ('Pasta Gigi', 'Kebersihan', 'Pasta gigi dalam kemasan'),
  ('Deterjen', 'Kebersihan', 'Deterjen bubuk'),
  ('Beras', 'Makanan', 'Beras berbagai jenis'),
  ('Gula Pasir', 'Makanan', 'Gula pasir kristal putih'),
  ('Minyak Goreng', 'Makanan', 'Minyak goreng kemasan'),
  ('Tepung Terigu', 'Makanan', 'Tepung terigu serbaguna'),
  ('Kecap', 'Makanan', 'Kecap manis dan asin'),
  ('Saus Sambal', 'Makanan', 'Saus sambal botol'),
  ('Tissue', 'Kebersihan', 'Tissue wajah dan toilet'),
  ('Sikat Gigi', 'Kebersihan', 'Sikat gigi berbagai jenis'),
  ('Pembalut', 'Kebersihan', 'Pembalut wanita'),
  ('Popok Bayi', 'Kebersihan', 'Popok bayi sekali pakai'),
  ('Susu Formula', 'Minuman', 'Susu formula bayi'),
  ('Biskuit', 'Makanan', 'Biskuit berbagai rasa'),
  ('Coklat', 'Makanan', 'Coklat batangan'),
  ('Permen', 'Makanan', 'Permen berbagai rasa'),
  ('Kerupuk', 'Makanan', 'Kerupuk berbagai jenis'),
  ('Semen', 'Material', 'Semen untuk konstruksi'),
  ('Cat Tembok', 'Material', 'Cat tembok berbagai warna'),
  ('Pipa PVC', 'Material', 'Pipa PVC berbagai ukuran'),
  ('Masker Medis', 'Alat Kesehatan', 'Masker medis 3 ply'),
  ('Sarung Tangan', 'Alat Kesehatan', 'Sarung tangan latex'),
  ('Ban Mobil', 'Spare Parts', 'Ban mobil berbagai ukuran'),
  ('Oli Mesin', 'Spare Parts', 'Oli mesin berbagai tipe')
ON CONFLICT (item_name, jenis_barang) DO NOTHING;

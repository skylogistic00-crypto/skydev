-- Create jenis_barang table
CREATE TABLE IF NOT EXISTS jenis_barang (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create brands table
CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(brand_name, category)
);

-- Create item_master table
CREATE TABLE IF NOT EXISTS item_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_name TEXT NOT NULL,
  jenis_barang TEXT NOT NULL,
  brand TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(item_name, jenis_barang, brand)
);

-- Add COA columns to stock table if not exists
ALTER TABLE stock 
ADD COLUMN IF NOT EXISTS coa_account_inventory TEXT,
ADD COLUMN IF NOT EXISTS coa_account_hpp TEXT,
ADD COLUMN IF NOT EXISTS coa_account_expense TEXT;

-- Insert sample jenis_barang
INSERT INTO jenis_barang (name, description) VALUES
  ('Elektronik', 'Barang elektronik dan gadget'),
  ('Furniture', 'Perabotan dan furniture'),
  ('Alat Tulis', 'Alat tulis kantor'),
  ('Minimarket', 'Barang kebutuhan sehari-hari'),
  ('Material', 'Material bangunan'),
  ('Alat Kesehatan', 'Alat dan perlengkapan kesehatan'),
  ('Spare Parts', 'Suku cadang kendaraan')
ON CONFLICT (name) DO NOTHING;

-- Insert sample brands
INSERT INTO brands (brand_name, category, description) VALUES
  ('Dell', 'Elektronik', 'Brand laptop dan komputer'),
  ('LG', 'Elektronik', 'Brand elektronik'),
  ('Logitech', 'Elektronik', 'Brand aksesoris komputer'),
  ('HP', 'Elektronik', 'Brand printer dan komputer'),
  ('Olympic', 'Furniture', 'Brand furniture'),
  ('Ergotec', 'Furniture', 'Brand furniture ergonomis'),
  ('Sinar Dunia', 'Alat Tulis', 'Brand alat tulis'),
  ('Pilot', 'Alat Tulis', 'Brand alat tulis'),
  ('Indomie', 'Minimarket', 'Brand makanan'),
  ('Aqua', 'Minimarket', 'Brand minuman'),
  ('Gresik', 'Material', 'Brand semen'),
  ('Rucika', 'Material', 'Brand pipa'),
  ('Sensi', 'Alat Kesehatan', 'Brand alat kesehatan'),
  ('OneMed', 'Alat Kesehatan', 'Brand alat kesehatan'),
  ('Bridgestone', 'Spare Parts', 'Brand ban'),
  ('Shell', 'Spare Parts', 'Brand oli')
ON CONFLICT (brand_name, category) DO NOTHING;

-- Insert sample item_master
INSERT INTO item_master (item_name, jenis_barang, brand, description) VALUES
  ('Laptop', 'Elektronik', 'Dell', 'Laptop Dell berbagai seri'),
  ('Monitor', 'Elektronik', 'LG', 'Monitor LG berbagai ukuran'),
  ('Keyboard', 'Elektronik', 'Logitech', 'Keyboard Logitech'),
  ('Mouse', 'Elektronik', 'Logitech', 'Mouse Logitech'),
  ('Printer', 'Elektronik', 'HP', 'Printer HP'),
  ('Meja Kerja', 'Furniture', 'Olympic', 'Meja kerja kantor'),
  ('Kursi Kantor', 'Furniture', 'Ergotec', 'Kursi kantor ergonomis'),
  ('Kertas A4', 'Alat Tulis', 'Sinar Dunia', 'Kertas A4 berbagai ukuran'),
  ('Pulpen', 'Alat Tulis', 'Pilot', 'Pulpen berbagai warna'),
  ('Indomie', 'Minimarket', 'Indomie', 'Mie instan berbagai rasa'),
  ('Air Mineral', 'Minimarket', 'Aqua', 'Air mineral kemasan'),
  ('Semen', 'Material', 'Gresik', 'Semen portland'),
  ('Pipa PVC', 'Material', 'Rucika', 'Pipa PVC berbagai ukuran'),
  ('Masker Medis', 'Alat Kesehatan', 'Sensi', 'Masker medis 3 ply'),
  ('Sarung Tangan', 'Alat Kesehatan', 'OneMed', 'Sarung tangan latex'),
  ('Ban Mobil', 'Spare Parts', 'Bridgestone', 'Ban mobil berbagai ukuran'),
  ('Oli Mesin', 'Spare Parts', 'Shell', 'Oli mesin berbagai tipe')
ON CONFLICT (item_name, jenis_barang, brand) DO NOTHING;

-- Enable RLS
ALTER TABLE jenis_barang ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_master ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow all for authenticated users" ON jenis_barang FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON brands FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON item_master FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Add to realtime
ALTER PUBLICATION supabase_realtime ADD TABLE jenis_barang;
ALTER PUBLICATION supabase_realtime ADD TABLE brands;
ALTER PUBLICATION supabase_realtime ADD TABLE item_master;

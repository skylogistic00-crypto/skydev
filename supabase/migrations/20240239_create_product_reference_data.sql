-- Create product reference table for auto-population
CREATE TABLE IF NOT EXISTS product_reference (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_name TEXT NOT NULL,
  brand TEXT,
  service_category TEXT,
  service_type TEXT,
  description TEXT,
  coa_account_code TEXT,
  coa_account_name TEXT,
  unit TEXT,
  typical_weight TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(item_name, brand)
);

-- Insert Indonesian beverage brands (Air Mineral)
INSERT INTO product_reference (item_name, brand, service_category, service_type, description, coa_account_code, coa_account_name, unit, typical_weight) VALUES
  ('Air Mineral', 'Aqua', 'Minuman', 'Minuman Kemasan', 'Air mineral dalam kemasan botol', '1-1400', 'Persediaan Barang Dagangan', 'pcs', '0.6'),
  ('Air Mineral', 'Le Minerale', 'Minuman', 'Minuman Kemasan', 'Air mineral dalam kemasan botol', '1-1400', 'Persediaan Barang Dagangan', 'pcs', '0.6'),
  ('Air Mineral', 'Pristine', 'Minuman', 'Minuman Kemasan', 'Air mineral dalam kemasan botol', '1-1400', 'Persediaan Barang Dagangan', 'pcs', '0.6'),
  ('Air Mineral', 'Ades', 'Minuman', 'Minuman Kemasan', 'Air mineral dalam kemasan botol', '1-1400', 'Persediaan Barang Dagangan', 'pcs', '0.6'),
  ('Air Mineral', 'Vit', 'Minuman', 'Minuman Kemasan', 'Air mineral dalam kemasan botol', '1-1400', 'Persediaan Barang Dagangan', 'pcs', '0.6'),
  ('Air Mineral', 'Club', 'Minuman', 'Minuman Kemasan', 'Air mineral dalam kemasan botol', '1-1400', 'Persediaan Barang Dagangan', 'pcs', '0.6'),
  ('Air Mineral', 'Cleo', 'Minuman', 'Minuman Kemasan', 'Air mineral dalam kemasan botol', '1-1400', 'Persediaan Barang Dagangan', 'pcs', '0.6'),
  ('Air Mineral', 'Nestle Pure Life', 'Minuman', 'Minuman Kemasan', 'Air mineral dalam kemasan botol', '1-1400', 'Persediaan Barang Dagangan', 'pcs', '0.6'),
  ('Air Mineral', 'Evian', 'Minuman', 'Minuman Kemasan', 'Air mineral premium dalam kemasan botol', '1-1400', 'Persediaan Barang Dagangan', 'pcs', '0.5'),
  ('Air Mineral', 'Fiji', 'Minuman', 'Minuman Kemasan', 'Air mineral premium dalam kemasan botol', '1-1400', 'Persediaan Barang Dagangan', 'pcs', '0.5');

-- Add more common Indonesian products
INSERT INTO product_reference (item_name, brand, service_category, service_type, description, coa_account_code, coa_account_name, unit, typical_weight) VALUES
  ('Mie Instan', 'Indomie', 'Makanan', 'Makanan Kemasan', 'Mie instan berbagai rasa', '1-1400', 'Persediaan Barang Dagangan', 'pcs', '0.085'),
  ('Mie Instan', 'Mie Sedaap', 'Makanan', 'Makanan Kemasan', 'Mie instan berbagai rasa', '1-1400', 'Persediaan Barang Dagangan', 'pcs', '0.085'),
  ('Mie Instan', 'Sarimi', 'Makanan', 'Makanan Kemasan', 'Mie instan berbagai rasa', '1-1400', 'Persediaan Barang Dagangan', 'pcs', '0.085'),
  ('Susu UHT', 'Ultra Milk', 'Minuman', 'Minuman Kemasan', 'Susu UHT dalam kemasan', '1-1400', 'Persediaan Barang Dagangan', 'pcs', '0.25'),
  ('Susu UHT', 'Indomilk', 'Minuman', 'Minuman Kemasan', 'Susu UHT dalam kemasan', '1-1400', 'Persediaan Barang Dagangan', 'pcs', '0.25'),
  ('Susu UHT', 'Frisian Flag', 'Minuman', 'Minuman Kemasan', 'Susu UHT dalam kemasan', '1-1400', 'Persediaan Barang Dagangan', 'pcs', '0.25'),
  ('Kopi Instan', 'Kapal Api', 'Minuman', 'Minuman Kemasan', 'Kopi instan sachet', '1-1400', 'Persediaan Barang Dagangan', 'pcs', '0.025'),
  ('Kopi Instan', 'Nescafe', 'Minuman', 'Minuman Kemasan', 'Kopi instan sachet', '1-1400', 'Persediaan Barang Dagangan', 'pcs', '0.025'),
  ('Kopi Instan', 'Good Day', 'Minuman', 'Minuman Kemasan', 'Kopi instan sachet', '1-1400', 'Persediaan Barang Dagangan', 'pcs', '0.025'),
  ('Teh Celup', 'Sariwangi', 'Minuman', 'Minuman Kemasan', 'Teh celup dalam kemasan', '1-1400', 'Persediaan Barang Dagangan', 'pcs', '0.05'),
  ('Teh Celup', 'Sosro', 'Minuman', 'Minuman Kemasan', 'Teh celup dalam kemasan', '1-1400', 'Persediaan Barang Dagangan', 'pcs', '0.05'),
  ('Sabun Mandi', 'Lifebuoy', 'Kebersihan', 'Produk Kebersihan', 'Sabun mandi batangan', '1-1400', 'Persediaan Barang Dagangan', 'pcs', '0.1'),
  ('Sabun Mandi', 'Lux', 'Kebersihan', 'Produk Kebersihan', 'Sabun mandi batangan', '1-1400', 'Persediaan Barang Dagangan', 'pcs', '0.1'),
  ('Sabun Mandi', 'Nuvo', 'Kebersihan', 'Produk Kebersihan', 'Sabun mandi batangan', '1-1400', 'Persediaan Barang Dagangan', 'pcs', '0.1'),
  ('Shampo', 'Pantene', 'Kebersihan', 'Produk Kebersihan', 'Shampo dalam kemasan', '1-1400', 'Persediaan Barang Dagangan', 'pcs', '0.35'),
  ('Shampo', 'Clear', 'Kebersihan', 'Produk Kebersihan', 'Shampo dalam kemasan', '1-1400', 'Persediaan Barang Dagangan', 'pcs', '0.35'),
  ('Shampo', 'Sunsilk', 'Kebersihan', 'Produk Kebersihan', 'Shampo dalam kemasan', '1-1400', 'Persediaan Barang Dagangan', 'pcs', '0.35'),
  ('Pasta Gigi', 'Pepsodent', 'Kebersihan', 'Produk Kebersihan', 'Pasta gigi dalam kemasan', '1-1400', 'Persediaan Barang Dagangan', 'pcs', '0.15'),
  ('Pasta Gigi', 'Close Up', 'Kebersihan', 'Produk Kebersihan', 'Pasta gigi dalam kemasan', '1-1400', 'Persediaan Barang Dagangan', 'pcs', '0.15'),
  ('Deterjen', 'Rinso', 'Kebersihan', 'Produk Kebersihan', 'Deterjen bubuk', '1-1400', 'Persediaan Barang Dagangan', 'kg', '1'),
  ('Deterjen', 'Attack', 'Kebersihan', 'Produk Kebersihan', 'Deterjen bubuk', '1-1400', 'Persediaan Barang Dagangan', 'kg', '1'),
  ('Deterjen', 'Daia', 'Kebersihan', 'Produk Kebersihan', 'Deterjen bubuk', '1-1400', 'Persediaan Barang Dagangan', 'kg', '1');

-- Enable RLS
ALTER TABLE product_reference ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Allow all for authenticated users" ON product_reference 
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Add to realtime
ALTER PUBLICATION supabase_realtime ADD TABLE product_reference;

-- Create function to get product reference
CREATE OR REPLACE FUNCTION get_product_reference(
  p_item_name TEXT,
  p_brand TEXT DEFAULT NULL
)
RETURNS TABLE (
  item_name TEXT,
  brand TEXT,
  service_category TEXT,
  service_type TEXT,
  description TEXT,
  coa_account_code TEXT,
  coa_account_name TEXT,
  unit TEXT,
  typical_weight TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pr.item_name,
    pr.brand,
    pr.service_category,
    pr.service_type,
    pr.description,
    pr.coa_account_code,
    pr.coa_account_name,
    pr.unit,
    pr.typical_weight
  FROM product_reference pr
  WHERE pr.item_name = p_item_name
    AND (p_brand IS NULL OR pr.brand = p_brand)
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

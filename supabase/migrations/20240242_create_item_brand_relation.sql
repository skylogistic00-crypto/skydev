-- Create item_brand_mapping table to link items with their available brands
CREATE TABLE IF NOT EXISTS item_brand_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_name TEXT NOT NULL,
  brand_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(item_name, brand_name)
);

-- Insert mappings for Air Mineral
INSERT INTO item_brand_mapping (item_name, brand_name) VALUES
  ('Air Mineral', 'Aqua'),
  ('Air Mineral', 'Le Minerale'),
  ('Air Mineral', 'Pristine'),
  ('Air Mineral', 'Ades'),
  ('Air Mineral', 'Vit'),
  ('Air Mineral', 'Club'),
  ('Air Mineral', 'Cleo'),
  ('Air Mineral', 'Nestle Pure Life'),
  ('Air Mineral', 'Evian'),
  ('Air Mineral', 'Fiji');

-- Insert mappings for other products
INSERT INTO item_brand_mapping (item_name, brand_name) VALUES
  ('Mie Instan', 'Indomie'),
  ('Mie Instan', 'Mie Sedaap'),
  ('Mie Instan', 'Sarimi'),
  ('Susu UHT', 'Ultra Milk'),
  ('Susu UHT', 'Indomilk'),
  ('Susu UHT', 'Frisian Flag'),
  ('Kopi Instan', 'Kapal Api'),
  ('Kopi Instan', 'Nescafe'),
  ('Kopi Instan', 'Good Day'),
  ('Teh Celup', 'Sariwangi'),
  ('Teh Celup', 'Sosro'),
  ('Sabun Mandi', 'Lifebuoy'),
  ('Sabun Mandi', 'Lux'),
  ('Sabun Mandi', 'Nuvo'),
  ('Shampo', 'Pantene'),
  ('Shampo', 'Clear'),
  ('Shampo', 'Sunsilk'),
  ('Pasta Gigi', 'Pepsodent'),
  ('Pasta Gigi', 'Close Up'),
  ('Deterjen', 'Rinso'),
  ('Deterjen', 'Attack'),
  ('Deterjen', 'Daia');

-- Enable RLS
ALTER TABLE item_brand_mapping ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Allow all for authenticated users" ON item_brand_mapping 
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Add to realtime
ALTER PUBLICATION supabase_realtime ADD TABLE item_brand_mapping;

-- Create function to get brands by item name
CREATE OR REPLACE FUNCTION get_brands_by_item(p_item_name TEXT)
RETURNS TABLE (
  brand_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ibm.brand_name
  FROM item_brand_mapping ibm
  WHERE ibm.item_name = p_item_name
    AND ibm.is_active = true
  ORDER BY ibm.brand_name;
END;
$$ LANGUAGE plpgsql;

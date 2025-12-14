-- Create COA Mapping System for Automatic Account Selection
-- This migration creates a mapping table that automatically selects COA accounts based on service/product categories

-- 1. Create category mapping table
CREATE TABLE IF NOT EXISTS coa_category_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_category TEXT NOT NULL,
  service_type TEXT NOT NULL,
  revenue_account_code TEXT,
  cogs_account_code TEXT,
  asset_account_code TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(service_category, service_type)
);

-- 2. Insert mapping rules for Jasa Cargo
INSERT INTO coa_category_mapping (service_category, service_type, revenue_account_code, cogs_account_code, description) VALUES
('Jasa Cargo', 'Cargo Udara Domestik', '4-1110', '5-1110', 'Pengiriman cargo via udara dalam negeri'),
('Jasa Cargo', 'Cargo Udara Internasional', '4-1120', '5-1110', 'Pengiriman cargo via udara internasional'),
('Jasa Cargo', 'Cargo Laut (LCL)', '4-1210', '5-1110', 'Pengiriman cargo via laut Less than Container Load'),
('Jasa Cargo', 'Cargo Laut (FCL)', '4-1220', '5-1110', 'Pengiriman cargo via laut Full Container Load'),
('Jasa Cargo', 'Cargo Darat', '4-1300', '5-1110', 'Pengiriman cargo via darat/truk');

-- 3. Insert mapping rules for Jasa Tambahan
INSERT INTO coa_category_mapping (service_category, service_type, revenue_account_code, cogs_account_code, description) VALUES
('Jasa Tambahan', 'Asuransi Pengiriman', '4-1410', '5-1130', 'Layanan asuransi untuk pengiriman barang'),
('Jasa Tambahan', 'Packing Kayu', '4-1420', '5-1140', 'Jasa packing dengan kayu untuk keamanan barang'),
('Jasa Tambahan', 'Packing Kardus', '4-1420', '5-1140', 'Jasa packing dengan kardus'),
('Jasa Tambahan', 'Packing Bubble Wrap', '4-1420', '5-1140', 'Jasa packing dengan bubble wrap');

-- 4. Insert mapping rules for Jasa Gudang
INSERT INTO coa_category_mapping (service_category, service_type, revenue_account_code, cogs_account_code, description) VALUES
('Jasa Gudang', 'Sewa Gudang', '4-2110', '5-2130', 'Pendapatan dari sewa ruang gudang'),
('Jasa Gudang', 'Jasa Penyimpanan (Storage)', '4-2120', '5-2120', 'Jasa penyimpanan barang di gudang'),
('Jasa Gudang', 'Jasa Bongkar Muat', '4-2210', '5-1120', 'Jasa penanganan bongkar muat barang'),
('Jasa Gudang', 'Jasa Penanganan Barang', '4-2210', '5-1120', 'Jasa penanganan dan handling barang');

-- 5. Insert mapping rules for Persediaan (Inventory)
INSERT INTO coa_category_mapping (service_category, service_type, asset_account_code, description) VALUES
('Persediaan', 'Pembelian Kardus', '1-1400', 'Pembelian bahan kemasan kardus'),
('Persediaan', 'Pembelian Bubble Wrap', '1-1400', 'Pembelian bahan kemasan bubble wrap'),
('Persediaan', 'Pembelian Kayu Packing', '1-1400', 'Pembelian bahan kemasan kayu'),
('Persediaan', 'Pembelian Lakban', '1-1400', 'Pembelian bahan kemasan lakban'),
('Persediaan', 'Pembelian Plastik Wrapping', '1-1400', 'Pembelian bahan kemasan plastik');

-- 6. Create function to get COA mapping
CREATE OR REPLACE FUNCTION get_coa_mapping(
  p_service_category TEXT,
  p_service_type TEXT
)
RETURNS TABLE (
  revenue_account_code TEXT,
  revenue_account_name TEXT,
  cogs_account_code TEXT,
  cogs_account_name TEXT,
  asset_account_code TEXT,
  asset_account_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.revenue_account_code,
    r.account_name as revenue_account_name,
    m.cogs_account_code,
    c.account_name as cogs_account_name,
    m.asset_account_code,
    a.account_name as asset_account_name
  FROM coa_category_mapping m
  LEFT JOIN chart_of_accounts r ON m.revenue_account_code = r.account_code
  LEFT JOIN chart_of_accounts c ON m.cogs_account_code = c.account_code
  LEFT JOIN chart_of_accounts a ON m.asset_account_code = a.account_code
  WHERE m.service_category = p_service_category
    AND m.service_type = p_service_type
    AND m.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- 7. Create function to get all available service types by category
CREATE OR REPLACE FUNCTION get_service_types_by_category(p_category TEXT)
RETURNS TABLE (
  service_type TEXT,
  revenue_account_code TEXT,
  description TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.service_type,
    m.revenue_account_code,
    m.description
  FROM coa_category_mapping m
  WHERE m.service_category = p_category
    AND m.is_active = true
  ORDER BY m.service_type;
END;
$$ LANGUAGE plpgsql;

-- 8. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_coa_mapping_category ON coa_category_mapping(service_category);
CREATE INDEX IF NOT EXISTS idx_coa_mapping_type ON coa_category_mapping(service_type);
CREATE INDEX IF NOT EXISTS idx_coa_mapping_active ON coa_category_mapping(is_active);

-- 9. Enable realtime for the mapping table
ALTER PUBLICATION supabase_realtime ADD TABLE coa_category_mapping;

COMMENT ON TABLE coa_category_mapping IS 'Mapping table for automatic COA account selection based on service/product categories';
COMMENT ON FUNCTION get_coa_mapping IS 'Returns COA account codes and names for a given service category and type';
COMMENT ON FUNCTION get_service_types_by_category IS 'Returns all available service types for a given category';
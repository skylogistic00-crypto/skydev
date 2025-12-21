-- Drop tables if exist to recreate cleanly
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS assets CASCADE;

-- Create assets table for operational asset details
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_name TEXT NOT NULL,
  asset_category TEXT NOT NULL,
  acquisition_date DATE,
  acquisition_cost DECIMAL(15, 2) DEFAULT 0,
  useful_life_years INTEGER DEFAULT 5,
  coa_account_code TEXT,
  status TEXT DEFAULT 'active',
  description TEXT,
  location TEXT,
  serial_number TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on asset_category for filtering
CREATE INDEX idx_assets_category ON assets(asset_category);
CREATE INDEX idx_assets_status ON assets(status);
CREATE INDEX idx_assets_coa_account_code ON assets(coa_account_code);

-- Create vehicles table for vehicle-specific details
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
  brand TEXT NOT NULL,
  model TEXT,
  plate_number TEXT NOT NULL,
  year_made INTEGER,
  color TEXT,
  engine_number TEXT,
  chassis_number TEXT,
  fuel_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for lookups
CREATE INDEX idx_vehicles_asset_id ON vehicles(asset_id);
CREATE INDEX idx_vehicles_plate ON vehicles(plate_number);

-- Enable RLS
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for assets
DROP POLICY IF EXISTS "Allow all for authenticated users on assets" ON assets;
CREATE POLICY "Allow all for authenticated users on assets" 
  ON assets FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- RLS Policies for vehicles
DROP POLICY IF EXISTS "Allow all for authenticated users on vehicles" ON vehicles;
CREATE POLICY "Allow all for authenticated users on vehicles" 
  ON vehicles FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS trigger_assets_updated_at ON assets;
CREATE TRIGGER trigger_assets_updated_at
  BEFORE UPDATE ON assets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_vehicles_updated_at ON vehicles;
CREATE TRIGGER trigger_vehicles_updated_at
  BEFORE UPDATE ON vehicles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comment
COMMENT ON TABLE assets IS 'Stores operational asset details separate from Chart of Accounts';
COMMENT ON TABLE vehicles IS 'Stores vehicle-specific details linked to assets';

DROP TABLE IF EXISTS lots CASCADE;
DROP TABLE IF EXISTS racks CASCADE;
DROP TABLE IF EXISTS zones CASCADE;
DROP TABLE IF EXISTS warehouses CASCADE;

CREATE TABLE warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  address TEXT,
  city TEXT,
  province TEXT,
  postal_code TEXT,
  phone TEXT,
  manager_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id UUID REFERENCES warehouses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(warehouse_id, code)
);

CREATE TABLE racks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID REFERENCES zones(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  level INTEGER,
  capacity INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(zone_id, code)
);

CREATE TABLE lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rack_id UUID REFERENCES racks(id) ON DELETE CASCADE,
  lot_number TEXT NOT NULL,
  item_name TEXT,
  quantity INTEGER DEFAULT 0,
  manufacturing_date DATE,
  expiry_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(rack_id, lot_number)
);

CREATE INDEX idx_zones_warehouse ON zones(warehouse_id);
CREATE INDEX idx_racks_zone ON racks(zone_id);
CREATE INDEX idx_lots_rack ON lots(rack_id);

ALTER PUBLICATION supabase_realtime ADD TABLE warehouses;
ALTER PUBLICATION supabase_realtime ADD TABLE zones;
ALTER PUBLICATION supabase_realtime ADD TABLE racks;
ALTER PUBLICATION supabase_realtime ADD TABLE lots;

-- Drop existing table if exists and recreate
DROP TABLE IF EXISTS service_items CASCADE;

-- Create service_items table
CREATE TABLE service_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(15,2) NOT NULL,
  unit TEXT DEFAULT 'Unit',
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE service_items;

-- Insert sample service items
INSERT INTO service_items (item_name, description, price, unit, category) VALUES
  ('Konsultasi IT', 'Konsultasi teknologi informasi per jam', 500000, 'Jam', 'Konsultasi'),
  ('Instalasi Software', 'Instalasi dan konfigurasi software', 1000000, 'Paket', 'Instalasi'),
  ('Maintenance Server', 'Pemeliharaan server bulanan', 2500000, 'Bulan', 'Maintenance'),
  ('Training Karyawan', 'Pelatihan karyawan per sesi', 3000000, 'Sesi', 'Training'),
  ('Design Grafis', 'Jasa design grafis per project', 1500000, 'Project', 'Design');
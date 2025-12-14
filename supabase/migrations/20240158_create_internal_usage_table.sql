-- Create departments table
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create internal_usage table
CREATE TABLE IF NOT EXISTS internal_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  item_id UUID REFERENCES inventory_items(id),
  item_name TEXT NOT NULL,
  stock_before INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  stock_after INTEGER NOT NULL,
  unit_cost DECIMAL(15,2) NOT NULL,
  total_cost DECIMAL(15,2) NOT NULL,
  department_id UUID REFERENCES departments(id),
  department_name TEXT,
  usage_location TEXT,
  coa_account_code TEXT NOT NULL,
  coa_account_name TEXT NOT NULL,
  purpose TEXT NOT NULL,
  verified_by UUID REFERENCES auth.users(id),
  verified_by_name TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'departments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE departments;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'internal_usage'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE internal_usage;
  END IF;
END $$;

-- Insert sample departments
INSERT INTO departments (name, code, description) VALUES
  ('Warehouse', 'WH', 'Departemen Gudang'),
  ('Operations', 'OPS', 'Departemen Operasional'),
  ('Maintenance', 'MNT', 'Departemen Pemeliharaan'),
  ('Administration', 'ADM', 'Departemen Administrasi'),
  ('IT', 'IT', 'Departemen IT')
ON CONFLICT (code) DO NOTHING;

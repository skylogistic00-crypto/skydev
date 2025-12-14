-- Add user_id column to all entity tables if not exists

-- Employees table
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_code TEXT UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  position TEXT,
  department TEXT,
  hire_date DATE,
  status TEXT DEFAULT 'active',
  address TEXT,
  city TEXT,
  country TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE employees ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS position TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS hire_date DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS country TEXT;

-- Drivers table
CREATE TABLE IF NOT EXISTS drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  driver_code TEXT UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  license_number TEXT,
  license_type TEXT,
  license_expiry DATE,
  status TEXT DEFAULT 'active',
  address TEXT,
  city TEXT,
  country TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE drivers ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS license_number TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS license_type TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS license_expiry DATE;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS country TEXT;

-- Suppliers table
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ACTIVE';
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'IDR';
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS payment_terms TEXT;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS bank_account_holder TEXT;

-- Customers table
ALTER TABLE customers ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS birth_date DATE;

-- Consignees table
ALTER TABLE consignees ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE consignees ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE consignees ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ACTIVE';
ALTER TABLE consignees ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'IDR';
ALTER TABLE consignees ADD COLUMN IF NOT EXISTS payment_terms TEXT;
ALTER TABLE consignees ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE consignees ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE consignees ADD COLUMN IF NOT EXISTS bank_account_holder TEXT;

-- Shippers table
ALTER TABLE shippers ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE shippers ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE shippers ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ACTIVE';
ALTER TABLE shippers ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'IDR';
ALTER TABLE shippers ADD COLUMN IF NOT EXISTS payment_terms TEXT;
ALTER TABLE shippers ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE shippers ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE shippers ADD COLUMN IF NOT EXISTS bank_account_holder TEXT;

-- Enable RLS on employees and drivers if not already enabled
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for employees
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON employees;
CREATE POLICY "Enable read access for authenticated users" ON employees
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON employees;
CREATE POLICY "Enable insert for authenticated users" ON employees
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for authenticated users" ON employees;
CREATE POLICY "Enable update for authenticated users" ON employees
  FOR UPDATE
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON employees;
CREATE POLICY "Enable delete for authenticated users" ON employees
  FOR DELETE
  TO authenticated
  USING (true);

-- Create RLS policies for drivers
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON drivers;
CREATE POLICY "Enable read access for authenticated users" ON drivers
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON drivers;
CREATE POLICY "Enable insert for authenticated users" ON drivers
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for authenticated users" ON drivers;
CREATE POLICY "Enable update for authenticated users" ON drivers
  FOR UPDATE
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON drivers;
CREATE POLICY "Enable delete for authenticated users" ON drivers
  FOR DELETE
  TO authenticated
  USING (true);

-- Create code generation functions for employees and drivers
CREATE OR REPLACE FUNCTION generate_employee_code()
RETURNS TRIGGER AS $$
DECLARE
  next_number INTEGER;
  new_code TEXT;
BEGIN
  IF NEW.employee_code IS NULL THEN
    SELECT COALESCE(MAX(CAST(SUBSTRING(employee_code FROM 4) AS INTEGER)), 0) + 1
    INTO next_number
    FROM employees
    WHERE employee_code ~ '^EMP[0-9]+$';
    
    new_code := 'EMP' || LPAD(next_number::TEXT, 5, '0');
    NEW.employee_code := new_code;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_employee_code ON employees;
CREATE TRIGGER set_employee_code
  BEFORE INSERT ON employees
  FOR EACH ROW
  EXECUTE FUNCTION generate_employee_code();

CREATE OR REPLACE FUNCTION generate_driver_code()
RETURNS TRIGGER AS $$
DECLARE
  next_number INTEGER;
  new_code TEXT;
BEGIN
  IF NEW.driver_code IS NULL THEN
    SELECT COALESCE(MAX(CAST(SUBSTRING(driver_code FROM 4) AS INTEGER)), 0) + 1
    INTO next_number
    FROM drivers
    WHERE driver_code ~ '^DRV[0-9]+$';
    
    new_code := 'DRV' || LPAD(next_number::TEXT, 5, '0');
    NEW.driver_code := new_code;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_driver_code ON drivers;
CREATE TRIGGER set_driver_code
  BEFORE INSERT ON drivers
  FOR EACH ROW
  EXECUTE FUNCTION generate_driver_code();

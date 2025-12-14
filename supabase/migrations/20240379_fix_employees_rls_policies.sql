-- Fix RLS policies for employees table

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow authenticated users to read employees" ON employees;
DROP POLICY IF EXISTS "Allow authenticated users to insert employees" ON employees;
DROP POLICY IF EXISTS "Allow authenticated users to update employees" ON employees;
DROP POLICY IF EXISTS "Allow authenticated users to delete employees" ON employees;
DROP POLICY IF EXISTS "Allow service role full access to employees" ON employees;

-- Enable RLS
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Create comprehensive policies for authenticated users
CREATE POLICY "Allow authenticated users to read employees" ON employees
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert employees" ON employees
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update employees" ON employees
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete employees" ON employees
  FOR DELETE
  TO authenticated
  USING (true);

-- Service role full access
CREATE POLICY "Allow service role full access to employees" ON employees
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Also fix related tables
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users to read departments" ON departments;
CREATE POLICY "Allow authenticated users to read departments" ON departments
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to read positions" ON positions;
CREATE POLICY "Allow authenticated users to read positions" ON positions
  FOR SELECT
  TO authenticated
  USING (true);

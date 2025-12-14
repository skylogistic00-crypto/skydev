ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON suppliers;
CREATE POLICY "Enable read access for authenticated users" ON suppliers
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON suppliers;
CREATE POLICY "Enable insert for authenticated users" ON suppliers
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for authenticated users" ON suppliers;
CREATE POLICY "Enable update for authenticated users" ON suppliers
  FOR UPDATE
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON suppliers;
CREATE POLICY "Enable delete for authenticated users" ON suppliers
  FOR DELETE
  TO authenticated
  USING (true);

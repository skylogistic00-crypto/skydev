-- Enable RLS on kas_transaksi table
ALTER TABLE kas_transaksi ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow authenticated users to view kas_transaksi" ON kas_transaksi;
DROP POLICY IF EXISTS "Allow authenticated users to insert kas_transaksi" ON kas_transaksi;
DROP POLICY IF EXISTS "Allow authenticated users to update kas_transaksi" ON kas_transaksi;
DROP POLICY IF EXISTS "Allow authenticated users to delete kas_transaksi" ON kas_transaksi;

-- Create policies for authenticated users
CREATE POLICY "Allow authenticated users to view kas_transaksi"
  ON kas_transaksi FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert kas_transaksi"
  ON kas_transaksi FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update kas_transaksi"
  ON kas_transaksi FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete kas_transaksi"
  ON kas_transaksi FOR DELETE
  TO authenticated
  USING (true);

CREATE TABLE IF NOT EXISTS stock_barang_import (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

ALTER TABLE stock_barang_import ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations for authenticated users"
  ON stock_barang_import
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

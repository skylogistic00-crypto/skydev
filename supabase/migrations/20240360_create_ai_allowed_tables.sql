-- Create ai_allowed_tables for AI query whitelist
CREATE TABLE IF NOT EXISTS ai_allowed_tables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name TEXT NOT NULL UNIQUE,
  allowed_columns TEXT[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE ai_allowed_tables ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read whitelist
CREATE POLICY "Allow authenticated users to view ai_allowed_tables"
  ON ai_allowed_tables FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can modify whitelist
CREATE POLICY "Allow admins to manage ai_allowed_tables"
  ON ai_allowed_tables FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Insert financial tables whitelist
INSERT INTO ai_allowed_tables (table_name, allowed_columns)
VALUES
  ('kas_transaksi', ARRAY['id','tanggal','document_number','payment_type','account_number','nominal','keterangan','service_category','service_type','created_at']),
  ('cash_disbursement', ARRAY['id','tanggal','nomor_bukti','dibayar_kepada','jumlah','keterangan','coa_debit_id','coa_credit_id','created_at']),
  ('cash_and_bank_receipts', ARRAY['id','tanggal','nomor_bukti','diterima_dari','jumlah','keterangan','coa_debit_id','coa_credit_id','created_at']),
  ('sales_transactions', ARRAY['id','tanggal','customer_id','item_id','quantity','unit_price','total_amount','payment_method','created_at']),
  ('purchase_transactions', ARRAY['id','tanggal','supplier_id','item_id','quantity','unit_price','total_amount','payment_method','created_at']),
  ('general_ledger', ARRAY['id','tanggal','coa_id','debit','credit','keterangan','created_at']),
  ('chart_of_accounts', ARRAY['id','account_code','account_name','account_type','category','balance','created_at']);

-- Add comment
COMMENT ON TABLE ai_allowed_tables IS 'Whitelist of tables and columns that AI can query for financial data';

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE ai_allowed_tables;

CREATE TABLE IF NOT EXISTS transaction_cart (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  user_id UUID,
  session_id TEXT,
  
  jenis_transaksi TEXT NOT NULL,
  payment_type TEXT,
  kategori TEXT,
  jenis_layanan TEXT,
  
  item_name TEXT,
  brand TEXT,
  customer TEXT,
  supplier TEXT,
  consignee TEXT,
  
  quantity NUMERIC(15,2) DEFAULT 1,
  harga_jual NUMERIC(15,2),
  harga_beli NUMERIC(15,2),
  
  ppn_percentage NUMERIC(5,2),
  ppn_amount NUMERIC(15,2),
  
  nominal NUMERIC(15,2) NOT NULL,
  tanggal DATE NOT NULL,
  description TEXT,
  
  coa_selected TEXT,
  sumber_penerimaan TEXT,
  kas_sumber TEXT,
  kas_tujuan TEXT,
  kategori_pengeluaran TEXT,
  
  selected_bank TEXT,
  selected_kas TEXT,
  
  stock_info JSONB,
  
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'checked_out', 'cancelled')),
  
  CONSTRAINT fk_coa_selected FOREIGN KEY (coa_selected) REFERENCES chart_of_accounts(account_code)
);

CREATE INDEX idx_transaction_cart_user_id ON transaction_cart(user_id);
CREATE INDEX idx_transaction_cart_session_id ON transaction_cart(session_id);
CREATE INDEX idx_transaction_cart_status ON transaction_cart(status);
CREATE INDEX idx_transaction_cart_created_at ON transaction_cart(created_at);

DROP POLICY IF EXISTS transaction_cart_select ON transaction_cart;
CREATE POLICY transaction_cart_select ON transaction_cart FOR SELECT USING (true);

DROP POLICY IF EXISTS transaction_cart_insert ON transaction_cart;
CREATE POLICY transaction_cart_insert ON transaction_cart FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS transaction_cart_update ON transaction_cart;
CREATE POLICY transaction_cart_update ON transaction_cart FOR UPDATE USING (true);

DROP POLICY IF EXISTS transaction_cart_delete ON transaction_cart;
CREATE POLICY transaction_cart_delete ON transaction_cart FOR DELETE USING (true);

ALTER TABLE transaction_cart ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION cleanup_old_cart_items()
RETURNS void AS $$
BEGIN
  DELETE FROM transaction_cart
  WHERE status = 'pending'
  AND created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS approval_transaksi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  source TEXT,
  transaction_date DATE NOT NULL,
  service_category TEXT,
  service_type TEXT,
  item_name TEXT NOT NULL,
  supplier_name TEXT,
  quantity NUMERIC DEFAULT 1,
  unit_price NUMERIC,
  subtotal NUMERIC,
  ppn_percentage NUMERIC DEFAULT 0,
  ppn_amount NUMERIC DEFAULT 0,
  total_amount NUMERIC NOT NULL,
  payment_method TEXT,
  payment_type TEXT,
  coa_cash_code TEXT,
  coa_expense_code TEXT,
  coa_payable_code TEXT,
  journal_ref TEXT,
  notes TEXT,
  description TEXT,
  approval_status TEXT DEFAULT 'waiting_approval' CHECK (approval_status IN ('waiting_approval', 'approved', 'rejected')),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_approval_transaksi_status ON approval_transaksi(approval_status);
CREATE INDEX IF NOT EXISTS idx_approval_transaksi_date ON approval_transaksi(transaction_date);
CREATE INDEX IF NOT EXISTS idx_approval_transaksi_type ON approval_transaksi(type);
CREATE INDEX IF NOT EXISTS idx_approval_transaksi_source ON approval_transaksi(source);

ALTER TABLE approval_transaksi ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON approval_transaksi;
CREATE POLICY "Enable read access for all users" ON approval_transaksi FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON approval_transaksi;
CREATE POLICY "Enable insert for authenticated users" ON approval_transaksi FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for authenticated users" ON approval_transaksi;
CREATE POLICY "Enable update for authenticated users" ON approval_transaksi FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON approval_transaksi;
CREATE POLICY "Enable delete for authenticated users" ON approval_transaksi FOR DELETE USING (true);

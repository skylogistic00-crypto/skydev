CREATE TABLE IF NOT EXISTS stock_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('stock_in', 'stock_out', 'adjustment', 'opname')),
  reference_number TEXT UNIQUE NOT NULL,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  item_name TEXT NOT NULL,
  sku TEXT NOT NULL,
  quantity DECIMAL(15,2) NOT NULL,
  unit TEXT NOT NULL,
  reason TEXT NOT NULL,
  notes TEXT,
  warehouse TEXT,
  zone TEXT,
  rack TEXT,
  lot TEXT,
  before_quantity DECIMAL(15,2),
  after_quantity DECIMAL(15,2),
  adjustment_value DECIMAL(15,2),
  approved_by TEXT,
  approval_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_adjustments_sku ON stock_adjustments(sku);
CREATE INDEX IF NOT EXISTS idx_stock_adjustments_type ON stock_adjustments(transaction_type);
CREATE INDEX IF NOT EXISTS idx_stock_adjustments_date ON stock_adjustments(transaction_date);
CREATE INDEX IF NOT EXISTS idx_stock_adjustments_status ON stock_adjustments(status);

alter publication supabase_realtime add table stock_adjustments;

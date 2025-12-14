ALTER TABLE purchase_transactions 
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'approved' 
CHECK (approval_status IN ('waiting_approval', 'approved', 'rejected'));

ALTER TABLE purchase_transactions 
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);

ALTER TABLE purchase_transactions 
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

ALTER TABLE purchase_transactions 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

ALTER TABLE kas_transaksi 
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'approved' 
CHECK (approval_status IN ('waiting_approval', 'approved', 'rejected'));

ALTER TABLE kas_transaksi 
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);

ALTER TABLE kas_transaksi 
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

ALTER TABLE kas_transaksi 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_purchase_approval_status ON purchase_transactions(approval_status);
CREATE INDEX IF NOT EXISTS idx_kas_approval_status ON kas_transaksi(approval_status);

ALTER TABLE sales_transactions 
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'approved';

CREATE INDEX IF NOT EXISTS idx_sales_transactions_approval_status 
ON sales_transactions(approval_status);

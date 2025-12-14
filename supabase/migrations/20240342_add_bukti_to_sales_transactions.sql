ALTER TABLE sales_transactions 
ADD COLUMN IF NOT EXISTS bukti TEXT;

CREATE INDEX IF NOT EXISTS idx_sales_transactions_bukti 
ON sales_transactions(bukti) WHERE bukti IS NOT NULL;

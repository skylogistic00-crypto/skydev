ALTER TABLE purchase_transactions 
ADD COLUMN IF NOT EXISTS item_id UUID REFERENCES stock(id);

CREATE INDEX IF NOT EXISTS idx_purchase_transactions_item_id ON purchase_transactions(item_id);

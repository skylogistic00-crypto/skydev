ALTER TABLE purchase_transactions 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

COMMENT ON COLUMN purchase_transactions.created_by IS 'User who created this purchase transaction';

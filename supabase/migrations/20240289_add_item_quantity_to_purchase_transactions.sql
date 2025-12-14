ALTER TABLE purchase_transactions 
ADD COLUMN IF NOT EXISTS item_quantity NUMERIC(15,2);

COMMENT ON COLUMN purchase_transactions.item_quantity IS 'Item quantity (alternative to quantity column)';

UPDATE purchase_transactions 
SET item_quantity = quantity 
WHERE item_quantity IS NULL AND quantity IS NOT NULL;

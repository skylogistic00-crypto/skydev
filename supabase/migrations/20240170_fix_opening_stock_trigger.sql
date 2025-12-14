-- Drop all triggers on stock table that might reference opening_stock
DROP TRIGGER IF EXISTS update_stock_after_transaction ON stock;
DROP TRIGGER IF EXISTS check_stock_balance_trigger ON stock;
DROP TRIGGER IF EXISTS auto_update_stock_balance ON stock;

-- Drop related functions
DROP FUNCTION IF EXISTS update_stock_after_transaction();
DROP FUNCTION IF EXISTS check_stock_balance();
DROP FUNCTION IF EXISTS auto_update_stock_balance();

-- Recreate only the necessary triggers
-- Trigger untuk auto-assign COA (already exists from migration 20240168)
-- Trigger untuk update status pengambilan (already exists from migration 20240151)

-- Add comment to confirm fix
COMMENT ON TABLE stock IS 'Stock table - fixed opening_stock trigger issue';

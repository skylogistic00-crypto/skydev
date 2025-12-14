-- Drop existing triggers first
DROP TRIGGER IF EXISTS trigger_update_stock_after_purchase ON purchase_transactions;
DROP TRIGGER IF EXISTS trigger_update_stock_after_purchase_update ON purchase_transactions;

-- Create trigger to update stock after purchase transaction
-- This will increase stock quantity when items are purchased

CREATE OR REPLACE FUNCTION update_stock_after_purchase()
RETURNS TRIGGER AS $$
BEGIN
  -- Update stock quantity by adding the purchased quantity
  -- Match by item_name only (simplified to avoid array comparison issues)
  UPDATE stock
  SET 
    quantity = COALESCE(quantity, 0) + NEW.quantity,
    updated_at = NOW()
  WHERE item_name = NEW.item_name;
  
  -- If stock record doesn't exist, log a warning
  IF NOT FOUND THEN
    RAISE WARNING 'Stock record not found for item_name: %', NEW.item_name;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle quantity changes in purchase transactions
CREATE OR REPLACE FUNCTION update_stock_after_purchase_quantity_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Adjust stock by the difference between new and old quantity
  UPDATE stock
  SET 
    quantity = COALESCE(quantity, 0) - OLD.quantity + NEW.quantity,
    updated_at = NOW()
  WHERE item_name = NEW.item_name;
  
  IF NOT FOUND THEN
    RAISE WARNING 'Stock record not found for item_name: %', NEW.item_name;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger that fires after INSERT on purchase_transactions
CREATE TRIGGER trigger_update_stock_after_purchase
AFTER INSERT ON purchase_transactions
FOR EACH ROW
EXECUTE FUNCTION update_stock_after_purchase();

-- Also handle UPDATE in case quantity is modified
CREATE TRIGGER trigger_update_stock_after_purchase_update
AFTER UPDATE OF quantity ON purchase_transactions
FOR EACH ROW
WHEN (OLD.quantity IS DISTINCT FROM NEW.quantity)
EXECUTE FUNCTION update_stock_after_purchase_quantity_change();

-- Fix the stock adjustment trigger to use 'quantity' instead of 'item_quantity'
DROP TRIGGER IF EXISTS trigger_update_stock_after_adjustment_insert ON stock_adjustments;
DROP TRIGGER IF EXISTS trigger_update_stock_after_adjustment_update ON stock_adjustments;

-- Recreate the function with correct column name
CREATE OR REPLACE FUNCTION update_stock_after_adjustment()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update stock if status is approved
  IF NEW.status = 'approved' THEN
    -- Update stock quantity based on adjustment value
    UPDATE stock
    SET 
      quantity = quantity + NEW.adjustment_value,
      updated_at = NOW()
    WHERE sku = NEW.sku;
    
    -- Log if stock not found
    IF NOT FOUND THEN
      RAISE WARNING 'Stock with SKU % not found', NEW.sku;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate triggers
CREATE TRIGGER trigger_update_stock_after_adjustment_insert
AFTER INSERT ON stock_adjustments
FOR EACH ROW
WHEN (NEW.status = 'approved')
EXECUTE FUNCTION update_stock_after_adjustment();

CREATE TRIGGER trigger_update_stock_after_adjustment_update
AFTER UPDATE ON stock_adjustments
FOR EACH ROW
WHEN (OLD.status != 'approved' AND NEW.status = 'approved')
EXECUTE FUNCTION update_stock_after_adjustment();

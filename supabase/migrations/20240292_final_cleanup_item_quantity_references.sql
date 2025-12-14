-- Final cleanup of all item_quantity references
-- This migration ensures no triggers or functions reference item_quantity in purchase_transactions or stock tables

-- Drop all old triggers that might reference item_quantity
DROP TRIGGER IF EXISTS trigger_update_stock_after_adjustment_insert ON stock_adjustments;
DROP TRIGGER IF EXISTS trigger_update_stock_after_adjustment_update ON stock_adjustments;

-- Drop and recreate the function to ensure it uses 'quantity' not 'item_quantity'
DROP FUNCTION IF EXISTS update_stock_after_adjustment();

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

-- Ensure purchase_transactions does NOT have item_quantity column
ALTER TABLE purchase_transactions DROP COLUMN IF EXISTS item_quantity;

-- Verify stock table uses 'quantity' not 'item_quantity'
-- If item_quantity exists in stock, rename it to quantity
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stock' AND column_name = 'item_quantity'
  ) THEN
    -- If quantity doesn't exist, rename item_quantity to quantity
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'stock' AND column_name = 'quantity'
    ) THEN
      ALTER TABLE stock RENAME COLUMN item_quantity TO quantity;
    ELSE
      -- If both exist, drop item_quantity
      ALTER TABLE stock DROP COLUMN item_quantity;
    END IF;
  END IF;
END $$;

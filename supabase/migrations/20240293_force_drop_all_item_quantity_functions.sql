-- Force drop ALL functions and triggers that might reference item_quantity
-- This is an aggressive cleanup to ensure no lingering references

-- Drop all triggers on stock_adjustments
DROP TRIGGER IF EXISTS trigger_update_stock_after_adjustment_insert ON stock_adjustments CASCADE;
DROP TRIGGER IF EXISTS trigger_update_stock_after_adjustment_update ON stock_adjustments CASCADE;

-- Force drop the function with CASCADE to remove all dependencies
DROP FUNCTION IF EXISTS update_stock_after_adjustment() CASCADE;

-- Verify no item_quantity column exists in purchase_transactions
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'purchase_transactions' 
    AND column_name = 'item_quantity'
  ) THEN
    ALTER TABLE purchase_transactions DROP COLUMN item_quantity CASCADE;
    RAISE NOTICE 'Dropped item_quantity column from purchase_transactions';
  END IF;
END $$;

-- Verify no item_quantity column exists in stock (should use quantity instead)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'stock' 
    AND column_name = 'item_quantity'
  ) THEN
    -- If quantity doesn't exist, rename item_quantity to quantity
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'stock' 
      AND column_name = 'quantity'
    ) THEN
      ALTER TABLE stock RENAME COLUMN item_quantity TO quantity;
      RAISE NOTICE 'Renamed item_quantity to quantity in stock table';
    ELSE
      -- If both exist, drop item_quantity
      ALTER TABLE stock DROP COLUMN item_quantity CASCADE;
      RAISE NOTICE 'Dropped item_quantity column from stock (quantity already exists)';
    END IF;
  END IF;
END $$;

-- Now recreate the function with the correct column name (quantity)
CREATE OR REPLACE FUNCTION update_stock_after_adjustment()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update stock if status is approved
  IF NEW.status = 'approved' THEN
    -- Update stock quantity based on adjustment value
    UPDATE stock
    SET 
      quantity = COALESCE(quantity, 0) + NEW.adjustment_value,
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

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Successfully cleaned up all item_quantity references and recreated triggers';
END $$;

-- NUCLEAR OPTION: Drop EVERYTHING that might reference item_quantity
-- This is the most aggressive cleanup possible

-- 1. Drop ALL triggers on ALL tables that might be involved
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT tgname, tgrelid::regclass::text as table_name
    FROM pg_trigger
    WHERE tgname LIKE '%stock%' OR tgname LIKE '%adjustment%' OR tgname LIKE '%purchase%'
    AND tgrelid::regclass::text IN ('stock', 'stock_adjustments', 'purchase_transactions')
  ) LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I CASCADE', r.tgname, r.table_name);
    RAISE NOTICE 'Dropped trigger % on %', r.tgname, r.table_name;
  END LOOP;
END $$;

-- 2. Drop ALL functions that might reference item_quantity
DROP FUNCTION IF EXISTS update_stock_after_adjustment() CASCADE;
DROP FUNCTION IF EXISTS update_stock_after_transaction() CASCADE;
DROP FUNCTION IF EXISTS auto_update_stock_balance() CASCADE;
DROP FUNCTION IF EXISTS check_stock_balance() CASCADE;

-- 3. Verify and remove item_quantity column from ALL tables
DO $$
BEGIN
  -- Check purchase_transactions
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'purchase_transactions' 
    AND column_name = 'item_quantity'
  ) THEN
    ALTER TABLE purchase_transactions DROP COLUMN item_quantity CASCADE;
    RAISE NOTICE 'Dropped item_quantity from purchase_transactions';
  END IF;
  
  -- Check stock table
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
      RAISE NOTICE 'Renamed item_quantity to quantity in stock';
    ELSE
      -- If both exist, drop item_quantity
      ALTER TABLE stock DROP COLUMN item_quantity CASCADE;
      RAISE NOTICE 'Dropped item_quantity from stock (quantity exists)';
    END IF;
  END IF;
  
  -- Check stock_adjustments
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'stock_adjustments' 
    AND column_name = 'item_quantity'
  ) THEN
    ALTER TABLE stock_adjustments DROP COLUMN item_quantity CASCADE;
    RAISE NOTICE 'Dropped item_quantity from stock_adjustments';
  END IF;
END $$;

-- 4. NOW recreate ONLY the stock adjustment function with correct column name
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

-- 5. Recreate triggers
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

-- 6. Final verification
DO $$
BEGIN
  RAISE NOTICE '=== CLEANUP COMPLETE ===';
  RAISE NOTICE 'All item_quantity references have been removed';
  RAISE NOTICE 'Stock adjustment triggers recreated with quantity column';
END $$;

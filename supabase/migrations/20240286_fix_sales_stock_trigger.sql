-- Fix the sales stock trigger to use description instead of brand
CREATE OR REPLACE FUNCTION update_stock_after_sales()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update stock for 'Barang' (goods) transactions
  IF NEW.transaction_type = 'Barang' THEN
    -- Update stock quantity by reducing it
    UPDATE stock
    SET 
      quantity = quantity - NEW.quantity,
      updated_at = NOW()
    WHERE item_name = NEW.item_name
      AND description = NEW.description;
    
    -- Log if stock not found
    IF NOT FOUND THEN
      RAISE WARNING 'Stock with item_name % and description % not found', NEW.item_name, NEW.description;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_stock_after_sales() IS 'Automatically reduces stock quantity when a sales transaction is created (using description field)';

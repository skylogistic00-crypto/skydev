-- Function to update stock quantity after sales transaction
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
      AND brand = NEW.brand;
    
    -- Log if stock not found
    IF NOT FOUND THEN
      RAISE WARNING 'Stock with item_name % and brand % not found', NEW.item_name, NEW.brand;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for INSERT on sales_transactions
DROP TRIGGER IF EXISTS trigger_update_stock_after_sales ON sales_transactions;
CREATE TRIGGER trigger_update_stock_after_sales
AFTER INSERT ON sales_transactions
FOR EACH ROW
WHEN (NEW.transaction_type = 'Barang')
EXECUTE FUNCTION update_stock_after_sales();

COMMENT ON FUNCTION update_stock_after_sales() IS 'Automatically reduces stock quantity when a sales transaction is created';

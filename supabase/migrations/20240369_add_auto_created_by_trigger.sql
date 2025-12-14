-- Add trigger to auto-fill created_by for purchase_transactions and cash_disbursement

-- Function to auto-fill created_by with current user
CREATE OR REPLACE FUNCTION auto_fill_created_by()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply trigger to purchase_transactions
DROP TRIGGER IF EXISTS set_created_by_purchase_transactions ON purchase_transactions;
CREATE TRIGGER set_created_by_purchase_transactions
BEFORE INSERT ON purchase_transactions
FOR EACH ROW
EXECUTE FUNCTION auto_fill_created_by();

-- Apply trigger to cash_disbursement
DROP TRIGGER IF EXISTS set_created_by_cash_disbursement ON cash_disbursement;
CREATE TRIGGER set_created_by_cash_disbursement
BEFORE INSERT ON cash_disbursement
FOR EACH ROW
EXECUTE FUNCTION auto_fill_created_by();

-- Apply trigger to sales_transactions
DROP TRIGGER IF EXISTS set_created_by_sales_transactions ON sales_transactions;
CREATE TRIGGER set_created_by_sales_transactions
BEFORE INSERT ON sales_transactions
FOR EACH ROW
EXECUTE FUNCTION auto_fill_created_by();

-- Apply trigger to cash_and_bank_receipts
DROP TRIGGER IF EXISTS set_created_by_cash_receipts ON cash_and_bank_receipts;
CREATE TRIGGER set_created_by_cash_receipts
BEFORE INSERT ON cash_and_bank_receipts
FOR EACH ROW
EXECUTE FUNCTION auto_fill_created_by();

COMMENT ON FUNCTION auto_fill_created_by() IS 'Automatically fills created_by with current authenticated user ID if not provided';

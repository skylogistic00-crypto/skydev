-- Add new fields to cash_disbursement table
ALTER TABLE cash_disbursement ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(15,2) DEFAULT 0;
ALTER TABLE cash_disbursement ADD COLUMN IF NOT EXISTS cash_account_id UUID;
ALTER TABLE cash_disbursement ADD COLUMN IF NOT EXISTS bank_account_id UUID;
ALTER TABLE cash_disbursement ADD COLUMN IF NOT EXISTS account_code TEXT;
ALTER TABLE cash_disbursement ADD COLUMN IF NOT EXISTS account_name TEXT;

-- Create trigger function to auto-map COA based on category
CREATE OR REPLACE FUNCTION auto_map_coa_cash_disbursement()
RETURNS TRIGGER AS $$
DECLARE
  v_account_code TEXT;
  v_account_name TEXT;
BEGIN
  -- Map category to COA account
  IF NEW.category IS NOT NULL THEN
    SELECT account_code, account_name INTO v_account_code, v_account_name
    FROM chart_of_accounts
    WHERE LOWER(account_name) LIKE '%' || LOWER(NEW.category) || '%'
      AND is_header = false
      AND account_code LIKE '6-%'
    LIMIT 1;
    
    -- If no match found, use default expense account
    IF v_account_code IS NULL THEN
      SELECT account_code, account_name INTO v_account_code, v_account_name
      FROM chart_of_accounts
      WHERE account_code = '6-2100'
      LIMIT 1;
    END IF;
    
    NEW.account_code := COALESCE(v_account_code, NEW.coa_expense_code);
    NEW.account_name := v_account_name;
  ELSE
    -- Use coa_expense_code if category is null
    IF NEW.coa_expense_code IS NOT NULL THEN
      SELECT account_name INTO v_account_name
      FROM chart_of_accounts
      WHERE account_code = NEW.coa_expense_code
      LIMIT 1;
      
      NEW.account_code := NEW.coa_expense_code;
      NEW.account_name := v_account_name;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS auto_map_coa ON cash_disbursement;
CREATE TRIGGER auto_map_coa
BEFORE INSERT OR UPDATE ON cash_disbursement
FOR EACH ROW
EXECUTE FUNCTION auto_map_coa_cash_disbursement();

COMMENT ON COLUMN cash_disbursement.tax_amount IS 'Tax amount for the disbursement';
COMMENT ON COLUMN cash_disbursement.cash_account_id IS 'Reference to cash account if payment is cash';
COMMENT ON COLUMN cash_disbursement.bank_account_id IS 'Reference to bank account if payment is transfer';
COMMENT ON COLUMN cash_disbursement.account_code IS 'Auto-mapped COA account code';
COMMENT ON COLUMN cash_disbursement.account_name IS 'Auto-mapped COA account name';

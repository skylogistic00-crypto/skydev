-- Fix trigger that overrides account_code set by frontend
-- This trigger was overriding the manually selected account codes

DROP TRIGGER IF EXISTS auto_map_coa_trigger ON cash_disbursement;
DROP TRIGGER IF EXISTS auto_map_coa ON cash_disbursement;
DROP FUNCTION IF EXISTS auto_map_coa_cash_disbursement() CASCADE;

-- Create updated trigger function that respects frontend-set account_code
CREATE OR REPLACE FUNCTION auto_map_coa_cash_disbursement()
RETURNS TRIGGER AS $$
DECLARE
  v_account_code TEXT;
  v_account_name TEXT;
BEGIN
  -- CRITICAL FIX: Only auto-map if account_code is NULL or empty
  -- This allows frontend to explicitly set the account_code
  IF NEW.account_code IS NOT NULL AND NEW.account_code != '' THEN
    -- Account code already set by frontend, don't override
    -- Just fill in account_name if missing
    IF NEW.account_name IS NULL OR NEW.account_name = '' THEN
      SELECT account_name INTO NEW.account_name
      FROM chart_of_accounts
      WHERE account_code = NEW.account_code
      LIMIT 1;
    END IF;
    RETURN NEW;
  END IF;
  
  -- Auto-map only if account_code is not set
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

-- Recreate trigger
CREATE TRIGGER auto_map_coa_trigger
  BEFORE INSERT OR UPDATE ON cash_disbursement
  FOR EACH ROW
  EXECUTE FUNCTION auto_map_coa_cash_disbursement();

-- Migration: Add account_code and account_name to all transaction tables
-- This ensures all financial transactions have COA details stored

-- 1. Add columns to sales_transactions
ALTER TABLE sales_transactions 
  ADD COLUMN IF NOT EXISTS account_code TEXT,
  ADD COLUMN IF NOT EXISTS account_name TEXT;

-- 2. Add columns to purchase_transactions
ALTER TABLE purchase_transactions 
  ADD COLUMN IF NOT EXISTS account_code TEXT,
  ADD COLUMN IF NOT EXISTS account_name TEXT;

-- 3. Add columns to cash_and_bank_receipts
ALTER TABLE cash_and_bank_receipts 
  ADD COLUMN IF NOT EXISTS account_code TEXT,
  ADD COLUMN IF NOT EXISTS account_name TEXT;

-- 4. Add columns to cash_disbursement
ALTER TABLE cash_disbursement 
  ADD COLUMN IF NOT EXISTS account_code TEXT,
  ADD COLUMN IF NOT EXISTS account_name TEXT;

-- 5. Add columns to kas_transaksi
ALTER TABLE kas_transaksi 
  ADD COLUMN IF NOT EXISTS account_code TEXT;

-- 6. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sales_account_code ON sales_transactions(account_code);
CREATE INDEX IF NOT EXISTS idx_purchase_account_code ON purchase_transactions(account_code);
CREATE INDEX IF NOT EXISTS idx_cash_receipts_account_code ON cash_and_bank_receipts(account_code);
CREATE INDEX IF NOT EXISTS idx_cash_disbursement_account_code ON cash_disbursement(account_code);
CREATE INDEX IF NOT EXISTS idx_kas_transaksi_account_code ON kas_transaksi(account_code);

-- 7. Backfill existing sales_transactions with account_code and account_name
UPDATE sales_transactions st
SET 
  account_code = COALESCE(st.coa_cash_code, st.coa_revenue_code),
  account_name = coa.account_name
FROM chart_of_accounts coa
WHERE (st.coa_cash_code = coa.account_code OR st.coa_revenue_code = coa.account_code)
  AND st.account_code IS NULL;

-- 8. Backfill existing purchase_transactions with account_code and account_name
UPDATE purchase_transactions pt
SET 
  account_code = COALESCE(pt.coa_inventory_code, pt.coa_cash_code),
  account_name = coa.account_name
FROM chart_of_accounts coa
WHERE (pt.coa_inventory_code = coa.account_code OR pt.coa_cash_code = coa.account_code)
  AND pt.account_code IS NULL;

-- 9. Backfill existing cash_and_bank_receipts with account_code and account_name
UPDATE cash_and_bank_receipts cr
SET 
  account_code = COALESCE(cr.coa_cash_code, cr.coa_contra_code),
  account_name = coa.account_name
FROM chart_of_accounts coa
WHERE (cr.coa_cash_code = coa.account_code OR cr.coa_contra_code = coa.account_code)
  AND cr.account_code IS NULL;

-- 10. Backfill existing cash_disbursement with account_code and account_name
UPDATE cash_disbursement cd
SET 
  account_code = COALESCE(cd.coa_expense_code, cd.coa_cash_code),
  account_name = coa.account_name
FROM chart_of_accounts coa
WHERE (cd.coa_expense_code = coa.account_code OR cd.coa_cash_code = coa.account_code)
  AND cd.account_code IS NULL;

-- 11. Backfill existing kas_transaksi with account_code
UPDATE kas_transaksi kt
SET 
  account_code = kt.account_number
WHERE kt.account_code IS NULL AND kt.account_number IS NOT NULL;

-- 12. Create trigger to auto-fill account_name on sales_transactions insert
CREATE OR REPLACE FUNCTION auto_fill_sales_coa_details()
RETURNS TRIGGER AS $$
DECLARE
  v_coa RECORD;
BEGIN
  IF NEW.account_code IS NOT NULL AND NEW.account_name IS NULL THEN
    SELECT account_name INTO v_coa
    FROM chart_of_accounts
    WHERE account_code = NEW.account_code;
    
    IF FOUND THEN
      NEW.account_name := v_coa.account_name;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_fill_sales_coa ON sales_transactions;
CREATE TRIGGER trigger_auto_fill_sales_coa
  BEFORE INSERT OR UPDATE ON sales_transactions
  FOR EACH ROW
  EXECUTE FUNCTION auto_fill_sales_coa_details();

-- 13. Create trigger to auto-fill account_name on purchase_transactions insert
CREATE OR REPLACE FUNCTION auto_fill_purchase_coa_details()
RETURNS TRIGGER AS $$
DECLARE
  v_coa RECORD;
BEGIN
  IF NEW.account_code IS NOT NULL AND NEW.account_name IS NULL THEN
    SELECT account_name INTO v_coa
    FROM chart_of_accounts
    WHERE account_code = NEW.account_code;
    
    IF FOUND THEN
      NEW.account_name := v_coa.account_name;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_fill_purchase_coa ON purchase_transactions;
CREATE TRIGGER trigger_auto_fill_purchase_coa
  BEFORE INSERT OR UPDATE ON purchase_transactions
  FOR EACH ROW
  EXECUTE FUNCTION auto_fill_purchase_coa_details();

-- 14. Create trigger to auto-fill account_name on cash_and_bank_receipts insert
CREATE OR REPLACE FUNCTION auto_fill_cash_receipts_coa_details()
RETURNS TRIGGER AS $$
DECLARE
  v_coa RECORD;
BEGIN
  IF NEW.account_code IS NOT NULL AND NEW.account_name IS NULL THEN
    SELECT account_name INTO v_coa
    FROM chart_of_accounts
    WHERE account_code = NEW.account_code;
    
    IF FOUND THEN
      NEW.account_name := v_coa.account_name;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_fill_cash_receipts_coa ON cash_and_bank_receipts;
CREATE TRIGGER trigger_auto_fill_cash_receipts_coa
  BEFORE INSERT OR UPDATE ON cash_and_bank_receipts
  FOR EACH ROW
  EXECUTE FUNCTION auto_fill_cash_receipts_coa_details();

-- 15. Create trigger to auto-fill account_name on cash_disbursement insert
CREATE OR REPLACE FUNCTION auto_fill_cash_disbursement_coa_details()
RETURNS TRIGGER AS $$
DECLARE
  v_coa RECORD;
BEGIN
  IF NEW.account_code IS NOT NULL AND NEW.account_name IS NULL THEN
    SELECT account_name INTO v_coa
    FROM chart_of_accounts
    WHERE account_code = NEW.account_code;
    
    IF FOUND THEN
      NEW.account_name := v_coa.account_name;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_fill_cash_disbursement_coa ON cash_disbursement;
CREATE TRIGGER trigger_auto_fill_cash_disbursement_coa
  BEFORE INSERT OR UPDATE ON cash_disbursement
  FOR EACH ROW
  EXECUTE FUNCTION auto_fill_cash_disbursement_coa_details();

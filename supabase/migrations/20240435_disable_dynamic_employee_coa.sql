-- Disable dynamic COA creation for employee advances
-- Always use 1-1500 for all employees instead of creating individual accounts

-- Drop the trigger
DROP TRIGGER IF EXISTS trigger_assign_employee_advance_coa ON employee_advances;

-- Replace the function to always use 1-1500
CREATE OR REPLACE FUNCTION assign_employee_advance_coa()
RETURNS TRIGGER AS $$
BEGIN
  -- Always use 1-1500 Uang Muka Karyawan for all employees
  IF NEW.coa_account_code IS NULL OR NEW.coa_account_code = '' THEN
    NEW.coa_account_code := '1-1500';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger with the new function
CREATE TRIGGER trigger_assign_employee_advance_coa
BEFORE INSERT ON employee_advances
FOR EACH ROW
EXECUTE FUNCTION assign_employee_advance_coa();

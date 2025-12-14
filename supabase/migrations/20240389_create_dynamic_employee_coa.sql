-- Create function to automatically create/get COA account for employee advance
-- This creates a unique account code for each employee under "Uang Muka Karyawan"

CREATE OR REPLACE FUNCTION get_or_create_employee_advance_coa(
  p_employee_id UUID,
  p_employee_name TEXT
)
RETURNS TEXT AS $$
DECLARE
  v_account_code TEXT;
  v_next_number INTEGER;
BEGIN
  -- Check if employee already has an advance account
  SELECT coa_account_code INTO v_account_code
  FROM employee_advances
  WHERE employee_id = p_employee_id
  LIMIT 1;
  
  -- If found, return existing account code
  IF v_account_code IS NOT NULL THEN
    RETURN v_account_code;
  END IF;
  
  -- Generate new account code
  -- Find the next available number under 1-1009 (Uang Muka Karyawan)
  SELECT COALESCE(MAX(CAST(SUBSTRING(account_code FROM 8) AS INTEGER)), 0) + 1
  INTO v_next_number
  FROM chart_of_accounts
  WHERE account_code LIKE '1-1009-%';
  
  -- Create account code (e.g., 1-1009-001, 1-1009-002, etc.)
  v_account_code := '1-1009-' || LPAD(v_next_number::TEXT, 3, '0');
  
  -- Insert new COA account for this employee
  INSERT INTO chart_of_accounts (
    account_code,
    account_name,
    account_type,
    level,
    is_header,
    normal_balance,
    description,
    parent_code
  ) VALUES (
    v_account_code,
    'Uang Muka Karyawan - ' || p_employee_name,
    'Aset',
    3,
    false,
    'Debit',
    'Uang muka yang diberikan kepada ' || p_employee_name,
    '1-1009'
  )
  ON CONFLICT (account_code) DO NOTHING;
  
  RETURN v_account_code;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-assign COA account when creating advance
CREATE OR REPLACE FUNCTION assign_employee_advance_coa()
RETURNS TRIGGER AS $$
BEGIN
  -- If coa_account_code is not provided, generate it
  IF NEW.coa_account_code IS NULL OR NEW.coa_account_code = '' THEN
    NEW.coa_account_code := get_or_create_employee_advance_coa(
      NEW.employee_id,
      NEW.employee_name
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_assign_employee_advance_coa
BEFORE INSERT ON employee_advances
FOR EACH ROW
EXECUTE FUNCTION assign_employee_advance_coa();

-- Add comment
COMMENT ON FUNCTION get_or_create_employee_advance_coa IS 'Automatically creates or retrieves COA account code for employee advance (e.g., 1-1009-001 for first employee)';

-- Backfill employee_number for existing employees that don't have one
WITH numbered_employees AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as row_num
  FROM employees
  WHERE employee_number IS NULL OR employee_number = ''
)
UPDATE employees e
SET employee_number = 'EMP' || LPAD(ne.row_num::TEXT, 5, '0')
FROM numbered_employees ne
WHERE e.id = ne.id;

-- Ensure all future employees get an employee_number
DROP FUNCTION IF EXISTS generate_employee_number() CASCADE;

CREATE OR REPLACE FUNCTION generate_employee_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.employee_number IS NULL OR NEW.employee_number = '' THEN
    NEW.employee_number := 'EMP' || LPAD(
      (SELECT COALESCE(MAX(SUBSTRING(employee_number FROM 4)::INTEGER), 0) + 1 
       FROM employees 
       WHERE employee_number ~ '^EMP[0-9]+$')::TEXT, 
      5, '0'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_employee_number ON employees;
CREATE TRIGGER set_employee_number
  BEFORE INSERT ON employees
  FOR EACH ROW
  EXECUTE FUNCTION generate_employee_number();

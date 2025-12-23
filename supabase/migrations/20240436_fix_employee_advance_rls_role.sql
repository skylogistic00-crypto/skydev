-- Fix RLS policies for employee_advances to use role column
-- The users table uses role column (not role_name)

-- Drop existing policies
DROP POLICY IF EXISTS "Finance can view all advances" ON employee_advances;
DROP POLICY IF EXISTS "Finance can create advances" ON employee_advances;
DROP POLICY IF EXISTS "Finance can update advances" ON employee_advances;

-- Recreate with correct column name
CREATE POLICY "Finance can view all advances"
ON employee_advances FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'finance', 'accounting_staff', 'super_admin')
  )
);

CREATE POLICY "Finance can create advances"
ON employee_advances FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'finance', 'accounting_staff', 'super_admin')
  )
);

CREATE POLICY "Finance can update advances"
ON employee_advances FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'finance', 'accounting_staff', 'super_admin')
  )
);

-- Also fix policies for related tables
DROP POLICY IF EXISTS "Finance can view all settlements" ON employee_advance_settlements;
DROP POLICY IF EXISTS "Users can create settlements" ON employee_advance_settlements;

CREATE POLICY "Finance can view all settlements"
ON employee_advance_settlements FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'finance', 'accounting_staff', 'super_admin')
  )
);

CREATE POLICY "Users can create settlements"
ON employee_advance_settlements FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM employee_advances
    WHERE employee_advances.id = employee_advance_settlements.advance_id
    AND employee_advances.employee_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'finance', 'accounting_staff', 'super_admin')
  )
);

-- Fix policies for returns table
DROP POLICY IF EXISTS "Finance can view all returns" ON employee_advance_returns;
DROP POLICY IF EXISTS "Users can create returns" ON employee_advance_returns;

CREATE POLICY "Finance can view all returns"
ON employee_advance_returns FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'finance', 'accounting_staff', 'super_admin')
  )
);

CREATE POLICY "Users can create returns"
ON employee_advance_returns FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM employee_advances
    WHERE employee_advances.id = employee_advance_returns.advance_id
    AND employee_advances.employee_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'finance', 'accounting_staff', 'super_admin')
  )
);

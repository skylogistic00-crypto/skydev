-- Update payroll RLS policies to use role_name instead of role

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view payroll" ON payroll;
DROP POLICY IF EXISTS "HR can insert payroll" ON payroll;
DROP POLICY IF EXISTS "HR can update payroll" ON payroll;
DROP POLICY IF EXISTS "HR can delete payroll" ON payroll;

-- Recreate policies with role_name
CREATE POLICY "Users can view payroll"
  ON payroll FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.id = payroll.employee_id
      AND e.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role_name IN ('super_admin', 'admin', 'hr_manager', 'hr_staff')
    )
  );

CREATE POLICY "HR can insert payroll"
  ON payroll FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role_name IN ('super_admin', 'admin', 'hr_manager', 'hr_staff')
    )
  );

CREATE POLICY "HR can update payroll"
  ON payroll FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role_name IN ('super_admin', 'admin', 'hr_manager', 'hr_staff')
    )
  );

CREATE POLICY "HR can delete payroll"
  ON payroll FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role_name IN ('super_admin', 'admin', 'hr_manager')
    )
  );

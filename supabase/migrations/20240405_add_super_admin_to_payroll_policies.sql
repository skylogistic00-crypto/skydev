-- Add super_admin role to payroll policies

DROP POLICY IF EXISTS "HR can insert payroll" ON payroll;
DROP POLICY IF EXISTS "HR can update payroll" ON payroll;
DROP POLICY IF EXISTS "HR can delete payroll" ON payroll;

CREATE POLICY "HR can insert payroll"
  ON payroll FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'admin', 'hr_manager', 'hr_staff')
    )
  );

CREATE POLICY "HR can update payroll"
  ON payroll FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'admin', 'hr_manager', 'hr_staff')
    )
  );

CREATE POLICY "HR can delete payroll"
  ON payroll FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'admin', 'hr_manager')
    )
  );

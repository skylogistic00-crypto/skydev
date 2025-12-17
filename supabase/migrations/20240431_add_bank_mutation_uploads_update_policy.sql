-- Add UPDATE policy for bank_mutation_uploads table
DROP POLICY IF EXISTS "bank_mutation_uploads_update_policy" ON bank_mutation_uploads;
CREATE POLICY "bank_mutation_uploads_update_policy" ON bank_mutation_uploads
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('super_admin', 'admin', 'accounting_manager', 'accounting_staff')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('super_admin', 'admin', 'accounting_manager', 'accounting_staff')
    )
  );

-- Add DELETE policy for bank_mutation_uploads table (optional but useful)
DROP POLICY IF EXISTS "bank_mutation_uploads_delete_policy" ON bank_mutation_uploads;
CREATE POLICY "bank_mutation_uploads_delete_policy" ON bank_mutation_uploads
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('super_admin', 'admin')
    )
  );

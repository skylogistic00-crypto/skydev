-- Add missing columns to bank_mutations if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bank_mutations' AND column_name = 'mapping_status') THEN
    ALTER TABLE bank_mutations ADD COLUMN mapping_status TEXT DEFAULT 'auto';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bank_mutations' AND column_name = 'approval_status') THEN
    ALTER TABLE bank_mutations ADD COLUMN approval_status TEXT DEFAULT 'waiting';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bank_mutations' AND column_name = 'pp') THEN
    ALTER TABLE bank_mutations ADD COLUMN pp TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bank_mutations' AND column_name = 'kas_bank') THEN
    ALTER TABLE bank_mutations ADD COLUMN kas_bank TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bank_mutations' AND column_name = 'pos') THEN
    ALTER TABLE bank_mutations ADD COLUMN pos TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bank_mutations' AND column_name = 'akun') THEN
    ALTER TABLE bank_mutations ADD COLUMN akun TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bank_mutations' AND column_name = 'sub_akun') THEN
    ALTER TABLE bank_mutations ADD COLUMN sub_akun TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bank_mutations' AND column_name = 'pic') THEN
    ALTER TABLE bank_mutations ADD COLUMN pic TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bank_mutations' AND column_name = 'journal_entry_id') THEN
    ALTER TABLE bank_mutations ADD COLUMN journal_entry_id UUID;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bank_mutations' AND column_name = 'approved_by') THEN
    ALTER TABLE bank_mutations ADD COLUMN approved_by UUID;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bank_mutations' AND column_name = 'approved_at') THEN
    ALTER TABLE bank_mutations ADD COLUMN approved_at TIMESTAMPTZ;
  END IF;
END $$;

ALTER TABLE bank_mutations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bank_mutations_select_policy" ON bank_mutations;
CREATE POLICY "bank_mutations_select_policy" ON bank_mutations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('super_admin', 'admin', 'accounting_manager', 'accounting_staff')
    )
  );

DROP POLICY IF EXISTS "bank_mutations_insert_policy" ON bank_mutations;
CREATE POLICY "bank_mutations_insert_policy" ON bank_mutations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('super_admin', 'admin', 'accounting_manager', 'accounting_staff')
    )
  );

DROP POLICY IF EXISTS "bank_mutations_update_policy" ON bank_mutations;
CREATE POLICY "bank_mutations_update_policy" ON bank_mutations
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

DROP POLICY IF EXISTS "bank_mutations_delete_policy" ON bank_mutations;
CREATE POLICY "bank_mutations_delete_policy" ON bank_mutations
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('super_admin', 'admin')
    )
  );

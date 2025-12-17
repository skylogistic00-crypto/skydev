-- Create bank_mutations table if not exists
CREATE TABLE IF NOT EXISTS bank_mutations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id UUID,
  bank_account_id UUID REFERENCES chart_of_accounts(id),
  bank_account_code TEXT,
  bank_account_name TEXT,
  mutation_date DATE,
  description TEXT,
  debit DECIMAL(18,2) DEFAULT 0,
  credit DECIMAL(18,2) DEFAULT 0,
  balance DECIMAL(18,2) DEFAULT 0,
  pp TEXT,
  kas_bank TEXT,
  pos TEXT,
  akun TEXT,
  sub_akun TEXT,
  pic TEXT,
  mapping_status TEXT DEFAULT 'auto' CHECK (mapping_status IN ('auto', 'corrected', 'approved')),
  approval_status TEXT DEFAULT 'waiting' CHECK (approval_status IN ('waiting', 'approved', 'rejected')),
  suggested_account_id UUID REFERENCES chart_of_accounts(id),
  journal_entry_id UUID REFERENCES journal_entries(id),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bank_mutations_upload_id ON bank_mutations(upload_id);
CREATE INDEX IF NOT EXISTS idx_bank_mutations_approval_status ON bank_mutations(approval_status);
CREATE INDEX IF NOT EXISTS idx_bank_mutations_mapping_status ON bank_mutations(mapping_status);
CREATE INDEX IF NOT EXISTS idx_bank_mutations_mutation_date ON bank_mutations(mutation_date);

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

CREATE TABLE IF NOT EXISTS bank_mutation_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT,
  file_url TEXT,
  bank_account_id UUID REFERENCES chart_of_accounts(id),
  bank_account_code TEXT,
  bank_account_name TEXT,
  total_rows INTEGER DEFAULT 0,
  processed_rows INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE bank_mutation_uploads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bank_mutation_uploads_select_policy" ON bank_mutation_uploads;
CREATE POLICY "bank_mutation_uploads_select_policy" ON bank_mutation_uploads
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('super_admin', 'admin', 'accounting_manager', 'accounting_staff')
    )
  );

DROP POLICY IF EXISTS "bank_mutation_uploads_insert_policy" ON bank_mutation_uploads;
CREATE POLICY "bank_mutation_uploads_insert_policy" ON bank_mutation_uploads
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('super_admin', 'admin', 'accounting_manager', 'accounting_staff')
    )
  );

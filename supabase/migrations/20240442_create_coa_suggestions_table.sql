-- Create coa_suggestions table for COA Engine analysis results
CREATE TABLE IF NOT EXISTS coa_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  intent_code TEXT,
  parent_account TEXT,
  suggested_account_name TEXT,
  suggested_account_code TEXT,
  confidence DECIMAL(3,2) DEFAULT 0,
  reasoning TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  flow_type TEXT,
  trans_type TEXT,
  usage_role TEXT,
  financial_category TEXT,
  action_taken TEXT,
  selected_account_code TEXT,
  intent TEXT
);

-- Enable RLS
ALTER TABLE coa_suggestions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view coa_suggestions"
  ON coa_suggestions FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert coa_suggestions"
  ON coa_suggestions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can update coa_suggestions"
  ON coa_suggestions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'accounting_manager')
    )
  );

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE coa_suggestions;

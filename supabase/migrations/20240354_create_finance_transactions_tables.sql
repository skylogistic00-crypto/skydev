-- Finance Transactions Table
CREATE TABLE IF NOT EXISTS finance_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_name TEXT NOT NULL,
  merchant TEXT NOT NULL,
  category TEXT NOT NULL,
  date_trans DATE NOT NULL,
  description TEXT,
  amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  ppn NUMERIC(15,2) NOT NULL DEFAULT 0,
  total NUMERIC(15,2) NOT NULL DEFAULT 0,
  file_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  entity_id UUID
);

-- Finance Transaction Breakdown Table
CREATE TABLE IF NOT EXISTS finance_transaction_breakdown (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES finance_transactions(id) ON DELETE CASCADE,
  qty INTEGER NOT NULL DEFAULT 1,
  price NUMERIC(15,2) NOT NULL DEFAULT 0,
  subtotal NUMERIC(15,2) NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Finance Approvals Table
CREATE TABLE IF NOT EXISTS finance_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES finance_transactions(id) ON DELETE CASCADE,
  level TEXT NOT NULL,
  status TEXT NOT NULL,
  approved_by UUID REFERENCES auth.users(id),
  approved_by_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_finance_transactions_status ON finance_transactions(status);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_category ON finance_transactions(category);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_date ON finance_transactions(date_trans);
CREATE INDEX IF NOT EXISTS idx_finance_breakdown_transaction ON finance_transaction_breakdown(transaction_id);
CREATE INDEX IF NOT EXISTS idx_finance_approvals_transaction ON finance_approvals(transaction_id);

-- Create storage bucket for finance documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('finance-documents', 'finance-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "Finance documents are publicly accessible" ON storage.objects;
CREATE POLICY "Finance documents are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'finance-documents');

DROP POLICY IF EXISTS "Authenticated users can upload finance documents" ON storage.objects;
CREATE POLICY "Authenticated users can upload finance documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'finance-documents' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update their finance documents" ON storage.objects;
CREATE POLICY "Users can update their finance documents"
ON storage.objects FOR UPDATE
USING (bucket_id = 'finance-documents' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can delete their finance documents" ON storage.objects;
CREATE POLICY "Users can delete their finance documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'finance-documents' AND auth.role() = 'authenticated');

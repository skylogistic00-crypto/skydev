CREATE TABLE IF NOT EXISTS purchase_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number VARCHAR(50) UNIQUE NOT NULL,
  requester_id UUID REFERENCES auth.users(id),
  requester_name VARCHAR(255) NOT NULL,
  department VARCHAR(100),
  request_date DATE NOT NULL DEFAULT CURRENT_DATE,
  needed_date DATE,
  item_description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit VARCHAR(50),
  estimated_price DECIMAL(15,2),
  total_amount DECIMAL(15,2),
  purpose TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_purchase_requests_requester ON purchase_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_status ON purchase_requests(status);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_date ON purchase_requests(request_date);

ALTER TABLE purchase_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own purchase requests" ON purchase_requests;
CREATE POLICY "Users can view their own purchase requests"
ON purchase_requests FOR SELECT
USING (auth.uid() = requester_id OR EXISTS (
  SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('super_admin', 'accounting_manager')
));

DROP POLICY IF EXISTS "Users can create purchase requests" ON purchase_requests;
CREATE POLICY "Users can create purchase requests"
ON purchase_requests FOR INSERT
WITH CHECK (auth.uid() = requester_id);

DROP POLICY IF EXISTS "Users can update their own purchase requests" ON purchase_requests;
CREATE POLICY "Users can update their own purchase requests"
ON purchase_requests FOR UPDATE
USING (auth.uid() = requester_id OR EXISTS (
  SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('super_admin', 'accounting_manager')
));

alter publication supabase_realtime add table purchase_requests;
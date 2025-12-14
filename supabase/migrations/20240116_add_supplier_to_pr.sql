CREATE TABLE IF NOT EXISTS "skema_PR" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_date DATE NOT NULL,
  name VARCHAR(255) NOT NULL,
  item_name TEXT NOT NULL,
  qty INTEGER NOT NULL,
  unit_price DECIMAL(15,2) NOT NULL,
  shipping_cost DECIMAL(15,2) DEFAULT 0,
  total_amount DECIMAL(15,2) NOT NULL,
  requester_id UUID REFERENCES auth.users(id),
  status VARCHAR(50) DEFAULT 'PENDING',
  email VARCHAR(255),
  tax DECIMAL(15,2) DEFAULT 0,
  barcode VARCHAR(255),
  notes TEXT,
  supplier_id UUID REFERENCES suppliers(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_skema_pr_requester ON "skema_PR"(requester_id);
CREATE INDEX IF NOT EXISTS idx_skema_pr_status ON "skema_PR"(status);
CREATE INDEX IF NOT EXISTS idx_skema_pr_supplier ON "skema_PR"(supplier_id);

ALTER TABLE "skema_PR" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own purchase requests" ON "skema_PR";
CREATE POLICY "Users can view their own purchase requests"
ON "skema_PR" FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users can create purchase requests" ON "skema_PR";
CREATE POLICY "Users can create purchase requests"
ON "skema_PR" FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update purchase requests" ON "skema_PR";
CREATE POLICY "Users can update purchase requests"
ON "skema_PR" FOR UPDATE
USING (true);

alter publication supabase_realtime add table "skema_PR";
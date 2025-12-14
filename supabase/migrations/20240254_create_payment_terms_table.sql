CREATE TABLE IF NOT EXISTS payment_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  term_name TEXT NOT NULL UNIQUE,
  days INTEGER NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE payment_terms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations on payment_terms" ON payment_terms;
CREATE POLICY "Allow all operations on payment_terms" ON payment_terms
  FOR ALL USING (true) WITH CHECK (true);

INSERT INTO payment_terms (term_name, days, description) VALUES
  ('Net 7', 7, 'Payment due within 7 days'),
  ('Net 14', 14, 'Payment due within 14 days'),
  ('Net 30', 30, 'Payment due within 30 days'),
  ('Net 45', 45, 'Payment due within 45 days'),
  ('Net 60', 60, 'Payment due within 60 days'),
  ('Net 90', 90, 'Payment due within 90 days'),
  ('COD', 0, 'Cash on Delivery'),
  ('Due on Receipt', 0, 'Payment due immediately upon receipt')
ON CONFLICT (term_name) DO NOTHING;

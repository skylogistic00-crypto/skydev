CREATE TABLE IF NOT EXISTS loan_installments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  installment_number INTEGER NOT NULL,
  due_date DATE NOT NULL,
  principal_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  interest_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  late_fee DECIMAL(15,2) DEFAULT 0,
  total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  paid_amount DECIMAL(15,2) DEFAULT 0,
  payment_date DATE,
  status VARCHAR(20) DEFAULT 'Belum Bayar' CHECK (status IN ('Belum Bayar', 'Terlambat', 'Lunas', 'Sebagian')),
  remaining_balance DECIMAL(15,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loan_installments_loan_id ON loan_installments(loan_id);
CREATE INDEX IF NOT EXISTS idx_loan_installments_due_date ON loan_installments(due_date);
CREATE INDEX IF NOT EXISTS idx_loan_installments_status ON loan_installments(status);

ALTER TABLE loan_installments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON loan_installments;
CREATE POLICY "Enable read access for all users" ON loan_installments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON loan_installments;
CREATE POLICY "Enable insert for authenticated users only" ON loan_installments FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for authenticated users only" ON loan_installments;
CREATE POLICY "Enable update for authenticated users only" ON loan_installments FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON loan_installments;
CREATE POLICY "Enable delete for authenticated users only" ON loan_installments FOR DELETE USING (true);

CREATE OR REPLACE FUNCTION update_loan_installment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_loan_installment_timestamp ON loan_installments;
CREATE TRIGGER update_loan_installment_timestamp
  BEFORE UPDATE ON loan_installments
  FOR EACH ROW
  EXECUTE FUNCTION update_loan_installment_timestamp();

CREATE OR REPLACE FUNCTION calculate_late_fee(
  p_due_date DATE,
  p_payment_date DATE,
  p_installment_amount DECIMAL
)
RETURNS DECIMAL AS $$
DECLARE
  v_days_late INTEGER;
  v_late_fee DECIMAL;
BEGIN
  IF p_payment_date IS NULL OR p_payment_date <= p_due_date THEN
    RETURN 0;
  END IF;
  
  v_days_late := p_payment_date - p_due_date;
  v_late_fee := p_installment_amount * 0.001 * v_days_late;
  
  RETURN v_late_fee;
END;
$$ LANGUAGE plpgsql;

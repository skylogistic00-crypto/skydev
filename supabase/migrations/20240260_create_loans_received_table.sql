CREATE TABLE IF NOT EXISTS loans_received (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  loan_date DATE NOT NULL,
  loan_number TEXT UNIQUE,
  
  lender_name TEXT NOT NULL,
  lender_type TEXT CHECK (lender_type IN ('Bank', 'Individu', 'Perusahaan', 'Lainnya')),
  
  principal_amount NUMERIC(15,2) NOT NULL,
  interest_rate NUMERIC(5,2) DEFAULT 0,
  loan_term_months INTEGER,
  
  payment_schedule TEXT CHECK (payment_schedule IN ('Bulanan', 'Triwulan', 'Tahunan', 'Jatuh Tempo')),
  maturity_date DATE,
  
  total_paid NUMERIC(15,2) DEFAULT 0,
  remaining_balance NUMERIC(15,2),
  
  status TEXT DEFAULT 'Aktif' CHECK (status IN ('Aktif', 'Lunas', 'Jatuh Tempo')),
  
  coa_cash_code TEXT NOT NULL,
  coa_loan_code TEXT NOT NULL,
  
  purpose TEXT,
  notes TEXT,
  journal_ref TEXT,
  
  CONSTRAINT fk_coa_cash FOREIGN KEY (coa_cash_code) REFERENCES chart_of_accounts(account_code),
  CONSTRAINT fk_coa_loan FOREIGN KEY (coa_loan_code) REFERENCES chart_of_accounts(account_code)
);

CREATE INDEX idx_loans_received_date ON loans_received(loan_date);
CREATE INDEX idx_loans_received_lender ON loans_received(lender_name);
CREATE INDEX idx_loans_received_status ON loans_received(status);
CREATE INDEX idx_loans_received_number ON loans_received(loan_number);

DROP POLICY IF EXISTS loans_received_select ON loans_received;
CREATE POLICY loans_received_select ON loans_received FOR SELECT USING (true);

DROP POLICY IF EXISTS loans_received_insert ON loans_received;
CREATE POLICY loans_received_insert ON loans_received FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS loans_received_update ON loans_received;
CREATE POLICY loans_received_update ON loans_received FOR UPDATE USING (true);

DROP POLICY IF EXISTS loans_received_delete ON loans_received;
CREATE POLICY loans_received_delete ON loans_received FOR DELETE USING (true);

ALTER TABLE loans_received ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION generate_loan_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.loan_number IS NULL THEN
    NEW.loan_number := 'LOAN-' || TO_CHAR(NEW.loan_date, 'YYYYMMDD') || '-' || LPAD(nextval('loans_received_id_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_loan_number ON loans_received;
CREATE TRIGGER set_loan_number
  BEFORE INSERT ON loans_received
  FOR EACH ROW
  EXECUTE FUNCTION generate_loan_number();

CREATE OR REPLACE FUNCTION update_remaining_balance()
RETURNS TRIGGER AS $$
BEGIN
  NEW.remaining_balance := NEW.principal_amount - COALESCE(NEW.total_paid, 0);
  
  IF NEW.remaining_balance <= 0 THEN
    NEW.status := 'Lunas';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS calculate_remaining_balance ON loans_received;
CREATE TRIGGER calculate_remaining_balance
  BEFORE INSERT OR UPDATE ON loans_received
  FOR EACH ROW
  EXECUTE FUNCTION update_remaining_balance();

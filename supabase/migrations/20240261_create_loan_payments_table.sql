CREATE TABLE IF NOT EXISTS loan_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  payment_date DATE NOT NULL,
  loan_id UUID NOT NULL,
  
  payment_amount NUMERIC(15,2) NOT NULL,
  principal_amount NUMERIC(15,2) NOT NULL,
  interest_amount NUMERIC(15,2) DEFAULT 0,
  
  payment_method TEXT CHECK (payment_method IN ('Tunai', 'Bank', 'Transfer')),
  
  bank_name TEXT,
  account_number TEXT,
  
  coa_cash_code TEXT NOT NULL,
  coa_loan_code TEXT NOT NULL,
  coa_interest_code TEXT,
  
  notes TEXT,
  reference_number TEXT,
  journal_ref TEXT,
  
  CONSTRAINT fk_loan FOREIGN KEY (loan_id) REFERENCES loans_received(id) ON DELETE CASCADE,
  CONSTRAINT fk_coa_cash FOREIGN KEY (coa_cash_code) REFERENCES chart_of_accounts(account_code),
  CONSTRAINT fk_coa_loan FOREIGN KEY (coa_loan_code) REFERENCES chart_of_accounts(account_code),
  CONSTRAINT fk_coa_interest FOREIGN KEY (coa_interest_code) REFERENCES chart_of_accounts(account_code)
);

CREATE INDEX idx_loan_payments_date ON loan_payments(payment_date);
CREATE INDEX idx_loan_payments_loan_id ON loan_payments(loan_id);
CREATE INDEX idx_loan_payments_journal_ref ON loan_payments(journal_ref);

DROP POLICY IF EXISTS loan_payments_select ON loan_payments;
CREATE POLICY loan_payments_select ON loan_payments FOR SELECT USING (true);

DROP POLICY IF EXISTS loan_payments_insert ON loan_payments;
CREATE POLICY loan_payments_insert ON loan_payments FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS loan_payments_update ON loan_payments;
CREATE POLICY loan_payments_update ON loan_payments FOR UPDATE USING (true);

DROP POLICY IF EXISTS loan_payments_delete ON loan_payments;
CREATE POLICY loan_payments_delete ON loan_payments FOR DELETE USING (true);

ALTER TABLE loan_payments ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION update_loan_total_paid()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE loans_received
    SET total_paid = COALESCE(total_paid, 0) + NEW.principal_amount
    WHERE id = NEW.loan_id;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE loans_received
    SET total_paid = COALESCE(total_paid, 0) - OLD.principal_amount + NEW.principal_amount
    WHERE id = NEW.loan_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE loans_received
    SET total_paid = COALESCE(total_paid, 0) - OLD.principal_amount
    WHERE id = OLD.loan_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_loan_total_paid ON loan_payments;
CREATE TRIGGER sync_loan_total_paid
  AFTER INSERT OR UPDATE OR DELETE ON loan_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_loan_total_paid();

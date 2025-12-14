CREATE TABLE IF NOT EXISTS cash_receipts_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  transaction_date DATE NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('Penerimaan', 'Pengeluaran')),
  
  category TEXT,
  source_destination TEXT,
  
  amount NUMERIC(15,2) NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('Tunai', 'Bank', 'Transfer')),
  
  bank_name TEXT,
  account_number TEXT,
  
  coa_cash_code TEXT NOT NULL,
  coa_contra_code TEXT NOT NULL,
  
  description TEXT,
  reference_number TEXT,
  journal_ref TEXT,
  
  CONSTRAINT fk_coa_cash FOREIGN KEY (coa_cash_code) REFERENCES chart_of_accounts(account_code),
  CONSTRAINT fk_coa_contra FOREIGN KEY (coa_contra_code) REFERENCES chart_of_accounts(account_code)
);

CREATE INDEX idx_cash_receipts_payments_date ON cash_receipts_payments(transaction_date);
CREATE INDEX idx_cash_receipts_payments_type ON cash_receipts_payments(transaction_type);
CREATE INDEX idx_cash_receipts_payments_category ON cash_receipts_payments(category);
CREATE INDEX idx_cash_receipts_payments_journal_ref ON cash_receipts_payments(journal_ref);

DROP POLICY IF EXISTS cash_receipts_payments_select ON cash_receipts_payments;
CREATE POLICY cash_receipts_payments_select ON cash_receipts_payments FOR SELECT USING (true);

DROP POLICY IF EXISTS cash_receipts_payments_insert ON cash_receipts_payments;
CREATE POLICY cash_receipts_payments_insert ON cash_receipts_payments FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS cash_receipts_payments_update ON cash_receipts_payments;
CREATE POLICY cash_receipts_payments_update ON cash_receipts_payments FOR UPDATE USING (true);

DROP POLICY IF EXISTS cash_receipts_payments_delete ON cash_receipts_payments;
CREATE POLICY cash_receipts_payments_delete ON cash_receipts_payments FOR DELETE USING (true);

ALTER TABLE cash_receipts_payments ENABLE ROW LEVEL SECURITY;

DROP TABLE IF EXISTS loan_payments CASCADE;
DROP TABLE IF EXISTS loans_received CASCADE;

CREATE TABLE IF NOT EXISTS loans (
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
  total_interest_paid NUMERIC(15,2) DEFAULT 0,
  remaining_balance NUMERIC(15,2),
  
  status TEXT DEFAULT 'Aktif' CHECK (status IN ('Aktif', 'Lunas', 'Jatuh Tempo', 'Menunggak')),
  
  coa_cash_code TEXT NOT NULL,
  coa_loan_code TEXT NOT NULL,
  coa_interest_code TEXT,
  
  purpose TEXT,
  notes TEXT,
  journal_ref TEXT,
  
  payment_history JSONB DEFAULT '[]'::jsonb,
  
  CONSTRAINT fk_coa_cash FOREIGN KEY (coa_cash_code) REFERENCES chart_of_accounts(account_code),
  CONSTRAINT fk_coa_loan FOREIGN KEY (coa_loan_code) REFERENCES chart_of_accounts(account_code),
  CONSTRAINT fk_coa_interest FOREIGN KEY (coa_interest_code) REFERENCES chart_of_accounts(account_code)
);

CREATE INDEX idx_loans_date ON loans(loan_date);
CREATE INDEX idx_loans_lender ON loans(lender_name);
CREATE INDEX idx_loans_status ON loans(status);
CREATE INDEX idx_loans_number ON loans(loan_number);
CREATE INDEX idx_loans_maturity ON loans(maturity_date);

DROP POLICY IF EXISTS loans_select ON loans;
CREATE POLICY loans_select ON loans FOR SELECT USING (true);

DROP POLICY IF EXISTS loans_insert ON loans;
CREATE POLICY loans_insert ON loans FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS loans_update ON loans;
CREATE POLICY loans_update ON loans FOR UPDATE USING (true);

DROP POLICY IF EXISTS loans_delete ON loans;
CREATE POLICY loans_delete ON loans FOR DELETE USING (true);

ALTER TABLE loans ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION generate_loan_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.loan_number IS NULL THEN
    NEW.loan_number := 'LOAN-' || TO_CHAR(NEW.loan_date, 'YYYYMMDD') || '-' || LPAD(EXTRACT(EPOCH FROM NOW())::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_loan_number ON loans;
CREATE TRIGGER set_loan_number
  BEFORE INSERT ON loans
  FOR EACH ROW
  EXECUTE FUNCTION generate_loan_number();

CREATE OR REPLACE FUNCTION update_loan_balance()
RETURNS TRIGGER AS $$
BEGIN
  NEW.remaining_balance := NEW.principal_amount - COALESCE(NEW.total_paid, 0);
  
  IF NEW.remaining_balance <= 0 THEN
    NEW.status := 'Lunas';
    NEW.remaining_balance := 0;
  ELSIF NEW.maturity_date IS NOT NULL AND NEW.maturity_date < CURRENT_DATE AND NEW.remaining_balance > 0 THEN
    NEW.status := 'Jatuh Tempo';
  ELSE
    NEW.status := 'Aktif';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS calculate_loan_balance ON loans;
CREATE TRIGGER calculate_loan_balance
  BEFORE INSERT OR UPDATE ON loans
  FOR EACH ROW
  EXECUTE FUNCTION update_loan_balance();

CREATE OR REPLACE FUNCTION add_loan_payment(
  p_loan_id UUID,
  p_payment_date DATE,
  p_principal_amount NUMERIC,
  p_interest_amount NUMERIC DEFAULT 0,
  p_payment_method TEXT DEFAULT 'Tunai',
  p_bank_name TEXT DEFAULT NULL,
  p_reference_number TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_loan RECORD;
  v_payment JSONB;
  v_journal_ref TEXT;
BEGIN
  SELECT * INTO v_loan FROM loans WHERE id = p_loan_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Loan not found';
  END IF;
  
  v_journal_ref := 'LPAY-' || TO_CHAR(p_payment_date, 'YYYYMMDD') || '-' || LPAD(EXTRACT(EPOCH FROM NOW())::TEXT, 6, '0');
  
  v_payment := jsonb_build_object(
    'payment_date', p_payment_date,
    'principal_amount', p_principal_amount,
    'interest_amount', p_interest_amount,
    'total_payment', p_principal_amount + p_interest_amount,
    'payment_method', p_payment_method,
    'bank_name', p_bank_name,
    'reference_number', p_reference_number,
    'notes', p_notes,
    'journal_ref', v_journal_ref,
    'timestamp', NOW()
  );
  
  UPDATE loans
  SET 
    total_paid = COALESCE(total_paid, 0) + p_principal_amount,
    total_interest_paid = COALESCE(total_interest_paid, 0) + p_interest_amount,
    payment_history = COALESCE(payment_history, '[]'::jsonb) || v_payment,
    updated_at = NOW()
  WHERE id = p_loan_id;
  
  INSERT INTO journal_entries (
    journal_ref,
    debit_account,
    credit_account,
    debit,
    credit,
    description,
    tanggal,
    jenis_transaksi
  ) VALUES (
    v_journal_ref,
    v_loan.coa_loan_code,
    v_loan.coa_cash_code,
    p_principal_amount,
    p_principal_amount,
    'Pembayaran Pinjaman - ' || v_loan.lender_name,
    p_payment_date,
    'Pembayaran Pinjaman'
  );
  
  IF p_interest_amount > 0 THEN
    INSERT INTO journal_entries (
      journal_ref,
      debit_account,
      credit_account,
      debit,
      credit,
      description,
      tanggal,
      jenis_transaksi
    ) VALUES (
      v_journal_ref,
      v_loan.coa_interest_code,
      v_loan.coa_cash_code,
      p_interest_amount,
      p_interest_amount,
      'Bunga Pinjaman - ' || v_loan.lender_name,
      p_payment_date,
      'Pembayaran Pinjaman'
    );
  END IF;
  
  RETURN v_payment;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE VIEW vw_loan_summary AS
SELECT 
  l.*,
  l.principal_amount - COALESCE(l.total_paid, 0) as sisa_pokok,
  CASE 
    WHEN l.status = 'Lunas' THEN 'Sudah Lunas'
    WHEN l.remaining_balance > 0 THEN 'Sisa: Rp ' || TO_CHAR(l.remaining_balance, 'FM999,999,999,999')
    ELSE 'Lunas'
  END as status_pembayaran,
  jsonb_array_length(COALESCE(l.payment_history, '[]'::jsonb)) as jumlah_pembayaran,
  (SELECT SUM((p->>'principal_amount')::numeric) 
   FROM jsonb_array_elements(l.payment_history) p) as total_principal_dibayar,
  (SELECT SUM((p->>'interest_amount')::numeric) 
   FROM jsonb_array_elements(l.payment_history) p) as total_bunga_dibayar
FROM loans l;

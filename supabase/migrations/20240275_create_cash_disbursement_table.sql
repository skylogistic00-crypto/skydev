CREATE TABLE IF NOT EXISTS cash_disbursement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Transaction Details
  transaction_date DATE NOT NULL,
  document_number TEXT UNIQUE,
  
  -- Payment Information
  payment_method TEXT CHECK (payment_method IN ('Tunai', 'Transfer Bank', 'Cek', 'Giro')),
  bank_account TEXT,
  
  -- Disbursement Details
  payee_name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  
  -- Amount
  amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
  
  -- COA Mapping
  coa_expense_code TEXT,
  coa_cash_code TEXT,
  
  -- Supporting Documents
  attachment_url TEXT,
  
  -- Approval System
  approval_status TEXT DEFAULT 'waiting_approval' CHECK (approval_status IN ('waiting_approval', 'approved', 'rejected')),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Journal Reference
  journal_ref TEXT,
  
  -- Metadata
  notes TEXT,
  created_by UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cash_disbursement_date ON cash_disbursement(transaction_date);
CREATE INDEX IF NOT EXISTS idx_cash_disbursement_approval ON cash_disbursement(approval_status);
CREATE INDEX IF NOT EXISTS idx_cash_disbursement_doc_number ON cash_disbursement(document_number);

-- RLS Policies
ALTER TABLE cash_disbursement ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for authenticated users" 
ON cash_disbursement 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Auto-generate document number
CREATE OR REPLACE FUNCTION generate_cash_disbursement_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.document_number IS NULL THEN
    NEW.document_number := 'CD-' || TO_CHAR(NEW.transaction_date, 'YYYYMMDD') || '-' || LPAD(NEXTVAL('cash_disbursement_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS cash_disbursement_seq START 1;

CREATE TRIGGER set_cash_disbursement_number
BEFORE INSERT ON cash_disbursement
FOR EACH ROW
EXECUTE FUNCTION generate_cash_disbursement_number();

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_cash_disbursement_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cash_disbursement_timestamp
BEFORE UPDATE ON cash_disbursement
FOR EACH ROW
EXECUTE FUNCTION update_cash_disbursement_timestamp();

COMMENT ON TABLE cash_disbursement IS 'Tabel untuk mencatat pengeluaran kas perusahaan';
COMMENT ON COLUMN cash_disbursement.payee_name IS 'Nama penerima pembayaran';
COMMENT ON COLUMN cash_disbursement.approval_status IS 'Status persetujuan: waiting_approval, approved, rejected';

ALTER TABLE cash_disbursement
ADD COLUMN IF NOT EXISTS coa_id UUID REFERENCES chart_of_accounts(id);

CREATE INDEX IF NOT EXISTS idx_cash_disbursement_coa_id ON cash_disbursement(coa_id);

COMMENT ON COLUMN cash_disbursement.coa_id IS 'Reference to Chart of Accounts for expense categorization';

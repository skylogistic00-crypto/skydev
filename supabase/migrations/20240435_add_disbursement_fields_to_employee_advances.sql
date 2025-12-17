-- Add disbursement method and related fields to employee_advances
ALTER TABLE employee_advances
ADD COLUMN IF NOT EXISTS disbursement_method TEXT DEFAULT 'Kas' CHECK (disbursement_method IN ('Kas', 'Bank')),
ADD COLUMN IF NOT EXISTS disbursement_account_id UUID,
ADD COLUMN IF NOT EXISTS disbursement_date DATE,
ADD COLUMN IF NOT EXISTS reference_number TEXT;

-- Add foreign key for bank accounts if disbursement_method is Bank
ALTER TABLE employee_advances
ADD CONSTRAINT fk_bank_account_id 
FOREIGN KEY (disbursement_account_id) 
REFERENCES chart_of_accounts(id) ON DELETE SET NULL;

-- Update the view to include new fields
DROP VIEW IF EXISTS vw_employee_advance_summary;

CREATE VIEW vw_employee_advance_summary 
WITH (security_invoker = true)
AS
SELECT 
  ea.id,
  ea.advance_number,
  ea.employee_id,
  ea.employee_name,
  ea.advance_date,
  ea.amount as advance_amount,
  ea.remaining_balance,
  ea.status,
  ea.coa_account_code,
  ea.disbursement_method,
  ea.disbursement_account_id,
  ea.disbursement_date,
  ea.reference_number,
  COALESCE(SUM(eas.total), 0) as total_settled,
  COALESCE(SUM(ear.amount), 0) as total_returned,
  COUNT(DISTINCT eas.id) as settlement_count,
  COUNT(DISTINCT ear.id) as return_count,
  ea.created_at,
  ea.updated_at
FROM employee_advances ea
LEFT JOIN employee_advance_settlements eas ON ea.id = eas.advance_id
LEFT JOIN employee_advance_returns ear ON ea.id = ear.advance_id
GROUP BY ea.id, ea.advance_number, ea.employee_id, ea.employee_name, 
         ea.advance_date, ea.amount, ea.remaining_balance, ea.status, 
         ea.coa_account_code, ea.disbursement_method, ea.disbursement_account_id,
         ea.disbursement_date, ea.reference_number, ea.created_at, ea.updated_at;

GRANT SELECT ON vw_employee_advance_summary TO authenticated;

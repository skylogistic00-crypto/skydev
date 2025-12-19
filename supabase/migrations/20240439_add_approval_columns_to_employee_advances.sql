-- Add approval columns to employee_advances table
ALTER TABLE employee_advances
ADD COLUMN IF NOT EXISTS manager_approval TEXT CHECK (manager_approval IN ('approved', 'rejected')),
ADD COLUMN IF NOT EXISTS finance_approval TEXT CHECK (finance_approval IN ('approved', 'rejected'));

-- Update the view to include approval columns
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
  ea.amount,
  ea.remaining_balance,
  ea.status,
  ea.coa_account_code,
  ea.disbursement_method,
  ea.disbursement_account_id,
  ea.disbursement_date,
  ea.reference_number,
  ea.manager_approval,
  ea.finance_approval,
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
         ea.disbursement_date, ea.reference_number, ea.manager_approval, 
         ea.finance_approval, ea.created_at, ea.updated_at;

-- Grant select permission to authenticated users
GRANT SELECT ON vw_employee_advance_summary TO authenticated;

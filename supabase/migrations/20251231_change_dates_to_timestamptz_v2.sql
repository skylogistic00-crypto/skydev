DROP VIEW IF EXISTS vw_employee_advance_summary;

ALTER TABLE public.employee_advances
ALTER COLUMN advance_date TYPE timestamptz
USING (advance_date::timestamptz);

ALTER TABLE public.employee_advances_top_up
ALTER COLUMN top_up_date TYPE timestamptz
USING (top_up_date::timestamptz);

ALTER TABLE public.employee_advance_settlements
ALTER COLUMN settlement_date TYPE timestamptz
USING (settlement_date::timestamptz);

ALTER TABLE public.cash_disbursement
ALTER COLUMN transaction_date TYPE timestamptz
USING (transaction_date::timestamptz);

ALTER TABLE public.cash_and_bank_receipts
ALTER COLUMN transaction_date TYPE timestamptz
USING (transaction_date::timestamptz);

CREATE VIEW vw_employee_advance_summary 
WITH (security_invoker = true)
AS
SELECT 
  ea.id,
  ea.advance_number,
  ea.employee_id,
  ea.employee_name,
  ea.advance_date,
  ea.total_saldo as amount,
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
         ea.advance_date, ea.total_saldo, ea.remaining_balance, ea.status, 
         ea.coa_account_code, ea.disbursement_method, ea.disbursement_account_id,
         ea.disbursement_date, ea.reference_number, ea.manager_approval, 
         ea.finance_approval, ea.created_at, ea.updated_at;

GRANT SELECT ON vw_employee_advance_summary TO authenticated;

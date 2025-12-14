DROP VIEW IF EXISTS vw_trial_balance_per_account CASCADE;

CREATE VIEW vw_trial_balance_per_account AS
SELECT 
  gl.account_code,
  coa.account_name,
  coa.account_type,
  gl.date AS entry_date,
  SUM(gl.debit - gl.credit) AS balance
FROM general_ledger gl
LEFT JOIN chart_of_accounts coa ON gl.account_code = coa.account_code
GROUP BY gl.account_code, coa.account_name, coa.account_type, gl.date
ORDER BY gl.account_code, gl.date;

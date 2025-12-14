CREATE OR REPLACE VIEW vw_profit_and_loss AS
SELECT 
  coa.account_code,
  coa.account_name,
  coa.account_type,
  COALESCE(SUM(gl.debit), 0) as debit,
  COALESCE(SUM(gl.credit), 0) as credit,
  CASE 
    WHEN coa.account_type IN ('Pendapatan') THEN 
      COALESCE(SUM(gl.credit), 0) - COALESCE(SUM(gl.debit), 0)
    WHEN coa.account_type IN ('Beban Pokok Penjualan', 'Beban Operasional') THEN 
      COALESCE(SUM(gl.debit), 0) - COALESCE(SUM(gl.credit), 0)
    ELSE 0
  END as balance
FROM chart_of_accounts coa
LEFT JOIN general_ledger gl ON coa.account_code = gl.account_code
WHERE coa.account_type IN ('Pendapatan', 'Beban Pokok Penjualan', 'Beban Operasional')
GROUP BY coa.account_code, coa.account_name, coa.account_type
HAVING (COALESCE(SUM(gl.debit), 0) - COALESCE(SUM(gl.credit), 0)) != 0 
   OR (COALESCE(SUM(gl.credit), 0) - COALESCE(SUM(gl.debit), 0)) != 0
ORDER BY 
  CASE coa.account_type
    WHEN 'Pendapatan' THEN 1
    WHEN 'Beban Pokok Penjualan' THEN 2
    WHEN 'Beban Operasional' THEN 3
  END,
  coa.account_code;

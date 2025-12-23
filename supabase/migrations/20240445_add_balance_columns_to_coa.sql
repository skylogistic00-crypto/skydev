-- Add balance columns to chart_of_accounts and populate from general_ledger
-- No triggers - manual calculation only

-- Add columns to chart_of_accounts
ALTER TABLE chart_of_accounts 
  ADD COLUMN IF NOT EXISTS total_debit DECIMAL(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_credit DECIMAL(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS saldo DECIMAL(15,2) DEFAULT 0;

COMMENT ON COLUMN chart_of_accounts.total_debit IS 'Total debit dari general_ledger untuk akun ini';
COMMENT ON COLUMN chart_of_accounts.total_credit IS 'Total credit dari general_ledger untuk akun ini';
COMMENT ON COLUMN chart_of_accounts.saldo IS 'Saldo akun (debit - credit untuk Debit normal, credit - debit untuk Kredit normal)';

-- Create function to update COA balances from general_ledger (manual call only)
CREATE OR REPLACE FUNCTION update_coa_balances_from_gl()
RETURNS TABLE(
  acc_code TEXT,
  tot_debit DECIMAL(15,2),
  tot_credit DECIMAL(15,2),
  balance DECIMAL(15,2),
  updated_count INTEGER
) AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  -- Update all accounts with data from general_ledger
  UPDATE chart_of_accounts coa
  SET 
    total_debit = COALESCE(gl_summary.sum_debit, 0),
    total_credit = COALESCE(gl_summary.sum_credit, 0),
    saldo = CASE 
      WHEN coa.normal_balance = 'Debit' THEN 
        COALESCE(gl_summary.sum_debit, 0) - COALESCE(gl_summary.sum_credit, 0)
      ELSE 
        COALESCE(gl_summary.sum_credit, 0) - COALESCE(gl_summary.sum_debit, 0)
    END,
    updated_at = NOW()
  FROM (
    SELECT 
      account_code,
      SUM(debit) as sum_debit,
      SUM(credit) as sum_credit
    FROM general_ledger
    GROUP BY account_code
  ) gl_summary
  WHERE coa.account_code = gl_summary.account_code;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  -- Return summary of updated accounts
  RETURN QUERY
  SELECT 
    coa.account_code as acc_code,
    coa.total_debit as tot_debit,
    coa.total_credit as tot_credit,
    coa.saldo as balance,
    v_count as updated_count
  FROM chart_of_accounts coa
  WHERE coa.total_debit > 0 OR coa.total_credit > 0
  ORDER BY coa.account_code;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_coa_balances_from_gl() IS 'Manually update COA balances from general_ledger. Call this after transactions are posted. No automatic triggers.';

-- Initial population of balances
SELECT update_coa_balances_from_gl();

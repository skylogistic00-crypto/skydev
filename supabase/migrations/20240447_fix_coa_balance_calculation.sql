-- Fix COA balance calculation - ensure it works regardless of normal_balance field

-- Drop and recreate the function with better logic
DROP FUNCTION IF EXISTS update_coa_balances_from_gl();

CREATE OR REPLACE FUNCTION update_coa_balances_from_gl()
RETURNS TEXT AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  -- Update all accounts with data from general_ledger
  UPDATE chart_of_accounts coa
  SET 
    total_debit = COALESCE(gl_summary.sum_debit, 0),
    total_credit = COALESCE(gl_summary.sum_credit, 0),
    saldo = COALESCE(gl_summary.sum_debit, 0) - COALESCE(gl_summary.sum_credit, 0),
    updated_at = NOW()
  FROM (
    SELECT 
      gl.account_code,
      SUM(gl.debit) as sum_debit,
      SUM(gl.credit) as sum_credit
    FROM general_ledger gl
    WHERE gl.account_code IS NOT NULL AND gl.account_code != ''
    GROUP BY gl.account_code
  ) gl_summary
  WHERE coa.account_code = gl_summary.account_code;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  RETURN 'Updated ' || v_count || ' accounts from general_ledger';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_coa_balances_from_gl() IS 'Update COA balances from general_ledger. Saldo = Debit - Credit for all accounts.';

-- Run the update
SELECT update_coa_balances_from_gl();

-- Show results
SELECT 
  account_code,
  account_name,
  total_debit,
  total_credit,
  saldo
FROM chart_of_accounts 
WHERE total_debit > 0 OR total_credit > 0
ORDER BY account_code
LIMIT 20;

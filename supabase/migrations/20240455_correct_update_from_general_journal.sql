-- Update COA balances from general_journal_lines (correct table)

DROP FUNCTION IF EXISTS update_coa_balances_from_journal();

CREATE OR REPLACE FUNCTION update_coa_balances_from_journal()
RETURNS TEXT AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  -- Update all accounts with data from general_journal_lines
  WITH journal_summary AS (
    SELECT 
      account_code,
      SUM(debit) as sum_debit,
      SUM(credit) as sum_credit
    FROM general_journal_lines
    WHERE account_code IS NOT NULL 
      AND account_code != ''
    GROUP BY account_code
  )
  UPDATE chart_of_accounts coa
  SET 
    total_debit = COALESCE(js.sum_debit, 0),
    total_credit = COALESCE(js.sum_credit, 0),
    saldo = COALESCE(js.sum_debit, 0) - COALESCE(js.sum_credit, 0),
    updated_at = NOW()
  FROM journal_summary js
  WHERE coa.account_code = js.account_code;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  RETURN 'Updated ' || v_count || ' accounts from general_journal_lines';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_coa_balances_from_journal() IS 'Update COA balances from general_journal_lines. Call after posting journals.';

-- Run the update
SELECT update_coa_balances_from_journal() as result;

-- Show updated accounts
SELECT 
  account_code,
  account_name,
  total_debit,
  total_credit,
  saldo,
  account_type
FROM chart_of_accounts 
WHERE total_debit > 0 OR total_credit > 0 OR saldo != 0
ORDER BY account_code;

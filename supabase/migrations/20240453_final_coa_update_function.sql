-- Update COA balances from all journal entries (including NULL status)

DROP FUNCTION IF EXISTS update_coa_balances_from_journal();

CREATE OR REPLACE FUNCTION update_coa_balances_from_journal()
RETURNS TEXT AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  -- Update all accounts with data from journal_entry_lines
  -- Include all journals (NULL status treated as posted)
  WITH journal_summary AS (
    SELECT 
      jel.account_code,
      SUM(jel.debit) as sum_debit,
      SUM(jel.credit) as sum_credit
    FROM journal_entry_lines jel
    WHERE jel.account_code IS NOT NULL 
      AND jel.account_code != ''
    GROUP BY jel.account_code
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
  
  RETURN 'Updated ' || v_count || ' accounts from journal_entry_lines';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_coa_balances_from_journal() IS 'Update COA balances from all journal entry lines. Call after posting journals.';

-- Run the update
SELECT update_coa_balances_from_journal() as result;

-- Show updated accounts
SELECT 
  account_code,
  account_name,
  total_debit,
  total_credit,
  saldo
FROM chart_of_accounts 
WHERE total_debit > 0 OR total_credit > 0 OR saldo != 0
ORDER BY account_code;

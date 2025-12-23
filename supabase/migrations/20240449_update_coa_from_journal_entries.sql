-- Update COA balances from journal_entry_lines (not general_ledger)

DROP FUNCTION IF EXISTS update_coa_balances_from_gl();
DROP FUNCTION IF EXISTS update_coa_balances_from_journal();

CREATE OR REPLACE FUNCTION update_coa_balances_from_journal()
RETURNS TEXT AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  -- Update all accounts with data from journal_entry_lines
  -- Only include posted journal entries
  UPDATE chart_of_accounts coa
  SET 
    total_debit = COALESCE(journal_summary.sum_debit, 0),
    total_credit = COALESCE(journal_summary.sum_credit, 0),
    saldo = COALESCE(journal_summary.sum_debit, 0) - COALESCE(journal_summary.sum_credit, 0),
    updated_at = NOW()
  FROM (
    SELECT 
      jel.account_code::TEXT,
      SUM(jel.debit) as sum_debit,
      SUM(jel.credit) as sum_credit
    FROM journal_entry_lines jel
    INNER JOIN journal_entries je ON jel.journal_entry_id = je.id
    WHERE jel.account_code IS NOT NULL 
      AND jel.account_code != ''
      AND je.status = 'posted'
    GROUP BY jel.account_code
  ) journal_summary
  WHERE coa.account_code::TEXT = journal_summary.account_code;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  RETURN 'Updated ' || v_count || ' accounts from journal_entry_lines (posted journals only)';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_coa_balances_from_journal() IS 'Update COA balances from posted journal entries. Call manually after posting journals.';

-- Run the update
SELECT update_coa_balances_from_journal();

-- Show updated accounts
SELECT 
  account_code,
  account_name,
  total_debit,
  total_credit,
  saldo,
  account_type
FROM chart_of_accounts 
WHERE total_debit > 0 OR total_credit > 0
ORDER BY account_code;

-- FINAL: Update COA balances from journal_entries table directly
-- Data ada di journal_entries itu sendiri (tidak ada lines table terpisah)

DROP FUNCTION IF EXISTS update_coa_balances_from_journal() CASCADE;

CREATE OR REPLACE FUNCTION update_coa_balances_from_journal()
RETURNS TEXT AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  -- Update all accounts with data directly from journal_entries
  WITH journal_summary AS (
    SELECT 
      je.account_code,
      SUM(COALESCE(je.debit, 0)) as sum_debit,
      SUM(COALESCE(je.credit, 0)) as sum_credit
    FROM journal_entries je
    WHERE je.account_code IS NOT NULL 
      AND je.account_code != ''
      AND (je.approval_status IS NULL OR je.approval_status = 'approved')
    GROUP BY je.account_code
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
  
  RETURN 'Successfully updated ' || v_count || ' accounts from journal_entries';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_coa_balances_from_journal() IS 'Update COA balances from journal_entries (approved entries). Call manually: SELECT update_coa_balances_from_journal();';

-- Run the update immediately
SELECT update_coa_balances_from_journal() as result;

-- Show all updated accounts with their balances
SELECT 
  coa.account_code,
  coa.account_name,
  coa.account_type,
  coa.total_debit,
  coa.total_credit,
  coa.saldo
FROM chart_of_accounts coa
WHERE coa.total_debit > 0 OR coa.total_credit > 0 OR coa.saldo != 0
ORDER BY coa.account_code;

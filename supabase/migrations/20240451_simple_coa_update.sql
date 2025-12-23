-- Simplified approach: Update COA balances directly without subquery join

DROP FUNCTION IF EXISTS update_coa_balances_from_journal();

CREATE OR REPLACE FUNCTION update_coa_balances_from_journal()
RETURNS TABLE(account TEXT, updated TEXT) AS $$
DECLARE
  rec RECORD;
  v_debit DECIMAL(15,2);
  v_credit DECIMAL(15,2);
  v_count INTEGER := 0;
BEGIN
  -- Loop through each account in journal_entry_lines
  FOR rec IN 
    SELECT DISTINCT jel.account_code
    FROM journal_entry_lines jel
    INNER JOIN journal_entries je ON jel.journal_entry_id = je.id
    WHERE jel.account_code IS NOT NULL 
      AND jel.account_code != ''
      AND je.status = 'posted'
  LOOP
    -- Calculate totals for this account
    SELECT 
      COALESCE(SUM(jel.debit), 0),
      COALESCE(SUM(jel.credit), 0)
    INTO v_debit, v_credit
    FROM journal_entry_lines jel
    INNER JOIN journal_entries je ON jel.journal_entry_id = je.id
    WHERE jel.account_code = rec.account_code
      AND je.status = 'posted';
    
    -- Update chart_of_accounts
    UPDATE chart_of_accounts
    SET 
      total_debit = v_debit,
      total_credit = v_credit,
      saldo = v_debit - v_credit,
      updated_at = NOW()
    WHERE account_code = rec.account_code;
    
    IF FOUND THEN
      v_count := v_count + 1;
      RETURN QUERY SELECT rec.account_code, ('Debit: ' || v_debit || ' Credit: ' || v_credit)::TEXT;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Updated % accounts', v_count;
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Run the function
SELECT * FROM update_coa_balances_from_journal();

-- Fix trigger to use journal_entries instead of journal_entry_lines

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS trigger_update_coa_after_journal ON journal_entry_lines;
DROP FUNCTION IF EXISTS trigger_update_coa_balance() CASCADE;

-- Recreate trigger function to update COA balance from journal_entries
CREATE OR REPLACE FUNCTION trigger_update_coa_balance()
RETURNS TRIGGER AS $$
DECLARE
  v_line RECORD;
BEGIN
  -- Handle journal_entries changes by updating all affected accounts
  -- Get all account_codes from lines of this journal entry
  FOR v_line IN 
    SELECT DISTINCT account_code 
    FROM journal_entry_lines
    WHERE journal_entry_id = COALESCE(NEW.id, OLD.id)
  LOOP
    -- Update each affected account
    PERFORM update_single_coa_balance(v_line.account_code);
  END LOOP;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create helper function to update single account balance
CREATE OR REPLACE FUNCTION update_single_coa_balance(p_account_code TEXT)
RETURNS void AS $$
DECLARE
  v_total_debit DECIMAL(15,2);
  v_total_credit DECIMAL(15,2);
  v_balance DECIMAL(15,2);
  v_normal_balance TEXT;
BEGIN
  -- Get the normal_balance for this account
  SELECT normal_balance INTO v_normal_balance
  FROM chart_of_accounts
  WHERE account_code = p_account_code;
  
  -- Calculate totals for the account
  SELECT 
    COALESCE(SUM(debit), 0),
    COALESCE(SUM(credit), 0)
  INTO v_total_debit, v_total_credit
  FROM journal_entry_lines
  WHERE account_code = p_account_code;
  
  -- Calculate balance based on normal_balance
  IF v_normal_balance = 'Debit' THEN
    v_balance := v_total_debit - v_total_credit;
  ELSE
    v_balance := v_total_credit - v_total_debit;
  END IF;
  
  -- Update chart_of_accounts
  UPDATE chart_of_accounts
  SET 
    debit = v_total_debit,
    credit = v_total_credit,
    total_amount = v_balance,
    updated_at = NOW()
  WHERE account_code = p_account_code;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on journal_entries (not journal_entry_lines)
CREATE TRIGGER trigger_update_coa_after_journal
  AFTER INSERT OR UPDATE OR DELETE ON journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_coa_balance();

COMMENT ON FUNCTION update_single_coa_balance(TEXT) IS 'Updates balance for a single COA account from journal_entry_lines';
COMMENT ON FUNCTION trigger_update_coa_balance() IS 'Trigger function on journal_entries to update related COA balances';

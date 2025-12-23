-- Create function to update chart_of_accounts balances from journal entries
-- This function aggregates debit and credit from journal_entry_lines and updates total_amount

-- First, add debit, credit, and total_amount columns to chart_of_accounts if they don't exist
ALTER TABLE chart_of_accounts 
  ADD COLUMN IF NOT EXISTS debit DECIMAL(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS credit DECIMAL(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_amount DECIMAL(15,2) DEFAULT 0;

COMMENT ON COLUMN chart_of_accounts.debit IS 'Total debit dari semua transaksi';
COMMENT ON COLUMN chart_of_accounts.credit IS 'Total credit dari semua transaksi';
COMMENT ON COLUMN chart_of_accounts.total_amount IS 'Total saldo akun (debit - credit untuk akun Debit normal, credit - debit untuk akun Kredit normal)';

-- Drop existing function first
DROP FUNCTION IF EXISTS update_coa_balance_from_journal() CASCADE;

-- Create function to recalculate COA balances
CREATE OR REPLACE FUNCTION update_coa_balance_from_journal()
RETURNS void AS $$
DECLARE
  v_account RECORD;
  v_total_debit DECIMAL(15,2);
  v_total_credit DECIMAL(15,2);
  v_balance DECIMAL(15,2);
BEGIN
  -- Loop through all accounts in chart_of_accounts
  FOR v_account IN 
    SELECT account_code, normal_balance 
    FROM chart_of_accounts 
    WHERE is_postable = true
  LOOP
    -- Sum debit and credit from journal_entry_lines for this account
    SELECT 
      COALESCE(SUM(debit), 0),
      COALESCE(SUM(credit), 0)
    INTO v_total_debit, v_total_credit
    FROM journal_entry_lines
    WHERE account_code = v_account.account_code;
    
    -- Calculate balance based on normal_balance
    IF v_account.normal_balance = 'Debit' THEN
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
    WHERE account_code = v_account.account_code;
  END LOOP;
  
  RAISE NOTICE 'COA balances updated successfully';
END;
$$ LANGUAGE plpgsql;

-- Create trigger function to update specific account after journal entry
CREATE OR REPLACE FUNCTION trigger_update_coa_balance()
RETURNS TRIGGER AS $$
DECLARE
  v_total_debit DECIMAL(15,2);
  v_total_credit DECIMAL(15,2);
  v_balance DECIMAL(15,2);
  v_normal_balance TEXT;
BEGIN
  -- Get the normal_balance for this account
  SELECT normal_balance INTO v_normal_balance
  FROM chart_of_accounts
  WHERE account_code = COALESCE(NEW.account_code, OLD.account_code);
  
  -- Calculate totals for the affected account
  SELECT 
    COALESCE(SUM(debit), 0),
    COALESCE(SUM(credit), 0)
  INTO v_total_debit, v_total_credit
  FROM journal_entry_lines
  WHERE account_code = COALESCE(NEW.account_code, OLD.account_code);
  
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
  WHERE account_code = COALESCE(NEW.account_code, OLD.account_code);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_update_coa_after_journal ON journal_entry_lines;

-- Create trigger on journal_entry_lines
CREATE TRIGGER trigger_update_coa_after_journal
  AFTER INSERT OR UPDATE OR DELETE ON journal_entry_lines
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_coa_balance();

-- Initial calculation for all existing data
SELECT update_coa_balance_from_journal();

COMMENT ON FUNCTION update_coa_balance_from_journal() IS 'Recalculates all COA balances from journal_entry_lines';
COMMENT ON FUNCTION trigger_update_coa_balance() IS 'Trigger function to update COA balance when journal entry lines change';

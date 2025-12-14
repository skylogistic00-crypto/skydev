-- Migration: Fix Setoran Modal creating 3 rows instead of 2 in journal_entries

-- Drop existing trigger
DROP TRIGGER IF EXISTS trigger_sync_journal_to_gl ON journal_entries CASCADE;
DROP FUNCTION IF EXISTS sync_journal_to_gl() CASCADE;

-- Create improved trigger that creates 2 separate rows (debit and credit)
CREATE OR REPLACE FUNCTION sync_journal_to_gl()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert DEBIT line to general_ledger
  IF NEW.debit > 0 THEN
    INSERT INTO general_ledger (
      journal_entry_id,
      account_code,
      account_name,
      account_type,
      date,
      description,
      debit,
      credit,
      debit_account,
      credit_account
    ) VALUES (
      NEW.id,
      COALESCE(NEW.debit_account, NEW.account_code, ''),
      COALESCE(NEW.account_name, ''),
      COALESCE(NEW.account_type, ''),
      COALESCE(NEW.tanggal, NEW.transaction_date, CURRENT_DATE),
      COALESCE(NEW.description, ''),
      COALESCE(NEW.debit, 0),
      0, -- credit is 0 for debit line
      COALESCE(NEW.debit_account, NEW.account_code, ''),
      COALESCE(NEW.credit_account, '')
    );
  END IF;

  -- Insert CREDIT line to general_ledger
  IF NEW.credit > 0 THEN
    INSERT INTO general_ledger (
      journal_entry_id,
      account_code,
      account_name,
      account_type,
      date,
      description,
      debit,
      credit,
      debit_account,
      credit_account
    ) VALUES (
      NEW.id,
      COALESCE(NEW.credit_account, ''),
      COALESCE(NEW.account_name, ''),
      COALESCE(NEW.account_type, ''),
      COALESCE(NEW.tanggal, NEW.transaction_date, CURRENT_DATE),
      COALESCE(NEW.description, ''),
      0, -- debit is 0 for credit line
      COALESCE(NEW.credit, 0),
      COALESCE(NEW.debit_account, NEW.account_code, ''),
      COALESCE(NEW.credit_account, '')
    );
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error syncing to GL: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER trigger_sync_journal_to_gl
  AFTER INSERT ON journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION sync_journal_to_gl();

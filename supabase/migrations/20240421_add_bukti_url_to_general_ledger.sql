-- Migration: Add bukti_url to general_ledger and update trigger

-- 1. Add bukti_url column to general_ledger
ALTER TABLE general_ledger 
  ADD COLUMN IF NOT EXISTS bukti_url TEXT;

-- 2. Drop existing trigger
DROP TRIGGER IF EXISTS trigger_sync_journal_to_gl ON journal_entries CASCADE;
DROP FUNCTION IF EXISTS sync_journal_to_gl() CASCADE;

-- 3. Create improved trigger that includes bukti_url
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
      credit_account,
      bukti_url
    ) VALUES (
      NEW.id,
      COALESCE(NEW.debit_account, NEW.account_code, ''),
      COALESCE(NEW.account_name, ''),
      COALESCE(NEW.account_type, ''),
      COALESCE(NEW.tanggal, NEW.transaction_date, CURRENT_DATE),
      COALESCE(NEW.description, ''),
      COALESCE(NEW.debit, 0),
      0,
      COALESCE(NEW.debit_account, NEW.account_code, ''),
      COALESCE(NEW.credit_account, ''),
      COALESCE(NEW.bukti_url, '')
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
      credit_account,
      bukti_url
    ) VALUES (
      NEW.id,
      COALESCE(NEW.credit_account, ''),
      COALESCE(NEW.account_name, ''),
      COALESCE(NEW.account_type, ''),
      COALESCE(NEW.tanggal, NEW.transaction_date, CURRENT_DATE),
      COALESCE(NEW.description, ''),
      0,
      COALESCE(NEW.credit, 0),
      COALESCE(NEW.debit_account, NEW.account_code, ''),
      COALESCE(NEW.credit_account, ''),
      COALESCE(NEW.bukti_url, '')
    );
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error syncing to GL: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create trigger
CREATE TRIGGER trigger_sync_journal_to_gl
  AFTER INSERT ON journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION sync_journal_to_gl();

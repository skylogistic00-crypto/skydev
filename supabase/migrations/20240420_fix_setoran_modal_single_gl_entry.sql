-- Migration: Fix Setoran Modal to create only 2 rows total (not 4)
-- Problem: Code inserts 2 rows in journal_entries (debit + credit)
-- Previous trigger was creating 2 GL rows per journal_entries row = 4 total
-- Solution: Trigger should create 1 GL row per journal_entries row = 2 total

DROP TRIGGER IF EXISTS trigger_sync_journal_to_gl ON journal_entries CASCADE;
DROP FUNCTION IF EXISTS sync_journal_to_gl() CASCADE;

-- Create trigger function that creates 1 GL entry per journal_entries row
CREATE OR REPLACE FUNCTION sync_journal_to_gl()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert 1 row to general_ledger per journal_entries row
  IF NEW.account_code IS NOT NULL AND NEW.account_code != '' THEN
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
      COALESCE(NEW.account_code, ''),
      COALESCE(NEW.account_name, ''),
      COALESCE(NEW.account_type, ''),
      COALESCE(NEW.tanggal, NEW.transaction_date, CURRENT_DATE),
      COALESCE(NEW.description, ''),
      COALESCE(NEW.debit, 0),
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

-- Create trigger (fires once per INSERT)
CREATE TRIGGER trigger_sync_journal_to_gl
  AFTER INSERT ON journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION sync_journal_to_gl();

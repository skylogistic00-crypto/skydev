-- Migration: Fix general_ledger trigger to include account_type

DROP TRIGGER IF EXISTS trigger_sync_journal_to_gl ON journal_entries CASCADE;
DROP FUNCTION IF EXISTS sync_journal_to_gl() CASCADE;

CREATE OR REPLACE FUNCTION sync_journal_to_gl()
RETURNS TRIGGER AS $$
BEGIN
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
    COALESCE(NEW.account_code, NEW.debit_account, ''),
    COALESCE(NEW.account_name, ''),
    COALESCE(NEW.account_type, ''),
    COALESCE(NEW.tanggal, NEW.transaction_date, CURRENT_DATE),
    COALESCE(NEW.description, ''),
    COALESCE(NEW.debit, 0),
    COALESCE(NEW.credit, 0),
    COALESCE(NEW.debit_account, NEW.account_code, ''),
    COALESCE(NEW.credit_account, '')
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error syncing to GL: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_sync_journal_to_gl
  AFTER INSERT ON journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION sync_journal_to_gl();

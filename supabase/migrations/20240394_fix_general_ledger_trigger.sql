-- Migration: Fix general_ledger trigger to handle debit_account and credit_account columns

-- 1. First, add debit_account and credit_account columns to general_ledger if not exists
ALTER TABLE general_ledger 
  ADD COLUMN IF NOT EXISTS debit_account TEXT,
  ADD COLUMN IF NOT EXISTS credit_account TEXT;

-- 2. Drop existing trigger and function
DROP TRIGGER IF EXISTS trigger_sync_journal_to_gl ON journal_entries CASCADE;
DROP FUNCTION IF EXISTS sync_journal_to_gl() CASCADE;

-- 3. Create improved trigger function that handles all required columns
CREATE OR REPLACE FUNCTION sync_journal_to_gl()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO general_ledger (
    journal_entry_id,
    account_code,
    account_name,
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

-- 4. Create trigger
CREATE TRIGGER trigger_sync_journal_to_gl
  AFTER INSERT ON journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION sync_journal_to_gl();

-- 5. Make debit_account nullable in general_ledger to prevent future errors
ALTER TABLE general_ledger 
  ALTER COLUMN debit_account DROP NOT NULL;

-- 6. Also make credit_account nullable if it has NOT NULL constraint
ALTER TABLE general_ledger 
  ALTER COLUMN credit_account DROP NOT NULL;

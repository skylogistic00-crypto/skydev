-- Migration: Add approval_status check to sync_journal_to_gl trigger
-- This prevents journal entries from being synced to general_ledger before approval

-- 1. Add approval_status column to journal_entries if not exists
ALTER TABLE journal_entries 
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'approved' 
CHECK (approval_status IN ('waiting_approval', 'approved', 'rejected', 'posted'));

-- 2. Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_journal_entries_approval_status ON journal_entries(approval_status);

-- 3. Drop existing trigger and function
DROP TRIGGER IF EXISTS trigger_sync_journal_to_gl ON journal_entries CASCADE;
DROP FUNCTION IF EXISTS sync_journal_to_gl() CASCADE;

-- 4. Create improved trigger function with approval_status check
CREATE OR REPLACE FUNCTION sync_journal_to_gl()
RETURNS TRIGGER AS $$
BEGIN
  -- Only sync to general_ledger if approval_status is 'approved' or 'posted'
  IF NEW.approval_status NOT IN ('approved', 'posted') THEN
    RAISE LOG 'Skipping GL sync for journal_entry % with approval_status: %', NEW.id, NEW.approval_status;
    RETURN NEW;
  END IF;

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
      0,
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
      0,
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

-- 5. Create trigger
CREATE TRIGGER trigger_sync_journal_to_gl
  AFTER INSERT ON journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION sync_journal_to_gl();

-- 6. Also create trigger for UPDATE to handle approval status changes
DROP TRIGGER IF EXISTS trigger_sync_journal_to_gl_on_update ON journal_entries CASCADE;
CREATE TRIGGER trigger_sync_journal_to_gl_on_update
  AFTER UPDATE OF approval_status ON journal_entries
  FOR EACH ROW
  WHEN (OLD.approval_status != NEW.approval_status AND NEW.approval_status IN ('approved', 'posted'))
  EXECUTE FUNCTION sync_journal_to_gl();

COMMENT ON COLUMN journal_entries.approval_status IS 'Status persetujuan: waiting_approval, approved, rejected, posted';

-- Create trigger for cash_disbursement to automatically create journal entries
-- This trigger creates 2 rows (debit and credit) per disbursement record
-- Same structure as cash_and_bank_receipts trigger

-- Drop any existing trigger and function
DROP TRIGGER IF EXISTS trigger_create_journal_from_cash_disbursement ON cash_disbursement CASCADE;
DROP FUNCTION IF EXISTS create_journal_from_cash_disbursement() CASCADE;

-- Create the trigger function
CREATE OR REPLACE FUNCTION create_journal_from_cash_disbursement()
RETURNS TRIGGER AS $$
DECLARE
  v_journal_number TEXT;
  v_seq_num INTEGER;
  v_exists_check INTEGER;
BEGIN
  -- Only run if status is approved and not already processed
  IF NEW.approval_status = 'approved' AND (
    TG_OP = 'INSERT' OR 
    (OLD IS NOT NULL AND (OLD.approval_status IS NULL OR OLD.approval_status != 'approved'))
  ) THEN
    
    -- Check if journal entries already exist for this disbursement
    SELECT COUNT(*) INTO v_exists_check
    FROM journal_entries
    WHERE reference_type = 'cash_disbursement' AND reference_id = NEW.id;
    
    IF v_exists_check > 0 THEN
      RAISE NOTICE 'Journal entries already exist for disbursement ID: %. Skipping.', NEW.id;
      RETURN NEW;
    END IF;
    
    -- Generate journal number
    v_seq_num := NEXTVAL('journal_entries_seq');
    v_journal_number := 'JE-CD-' || TO_CHAR(NEW.transaction_date, 'YYYYMMDD') || '-' || LPAD(v_seq_num::TEXT, 6, '0');
    
    -- Validate that we have account codes
    IF NEW.debit_account_code IS NULL AND NEW.coa_expense_code IS NULL THEN
      RAISE EXCEPTION 'Cannot create journal entry: No debit account code specified for disbursement ID: %', NEW.id;
    END IF;
    
    IF NEW.credit_account_code IS NULL AND NEW.coa_cash_code IS NULL THEN
      RAISE EXCEPTION 'Cannot create journal entry: No credit account code specified for disbursement ID: %', NEW.id;
    END IF;
    
    -- Insert DEBIT Entry (Expense - Asset/Expense increases)
    INSERT INTO journal_entries (
      tanggal,
      entry_date,
      journal_number,
      journal_ref,
      debit_account,
      debit_account_name,
      credit_account,
      credit_account_name,
      debit,
      credit,
      amount,
      description,
      reference_number,
      jenis_transaksi,
      reference_type,
      reference_id,
      bukti_url
    ) VALUES (
      NEW.transaction_date,
      NEW.transaction_date,
      v_journal_number,
      v_journal_number,
      COALESCE(NEW.debit_account_code, NEW.coa_expense_code),
      NEW.debit_account_name,
      NULL,
      NULL,
      NEW.amount,
      0,
      NEW.amount,
      NEW.description,
      NEW.document_number,
      COALESCE(NEW.transaction_type, 'Pengeluaran'),
      'cash_disbursement',
      NEW.id,
      NEW.bukti
    );
    
    -- Insert CREDIT Entry (Cash/Bank - Asset decreases)
    INSERT INTO journal_entries (
      tanggal,
      entry_date,
      journal_number,
      journal_ref,
      debit_account,
      debit_account_name,
      credit_account,
      credit_account_name,
      debit,
      credit,
      amount,
      description,
      reference_number,
      jenis_transaksi,
      reference_type,
      reference_id,
      bukti_url
    ) VALUES (
      NEW.transaction_date,
      NEW.transaction_date,
      v_journal_number,
      v_journal_number,
      NULL,
      NULL,
      COALESCE(NEW.credit_account_code, NEW.coa_cash_code),
      NEW.credit_account_name,
      0,
      NEW.amount,
      NEW.amount,
      NEW.description,
      NEW.document_number,
      COALESCE(NEW.transaction_type, 'Pengeluaran'),
      'cash_disbursement',
      NEW.id,
      NEW.bukti
    );
    
    -- Update journal_ref
    UPDATE cash_disbursement
    SET journal_ref = v_journal_number
    WHERE id = NEW.id;
    
    RAISE NOTICE 'Created journal entries for disbursement ID: % with journal number: %', NEW.id, v_journal_number;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_create_journal_from_cash_disbursement
  AFTER INSERT OR UPDATE ON cash_disbursement
  FOR EACH ROW
  EXECUTE FUNCTION create_journal_from_cash_disbursement();

COMMENT ON FUNCTION create_journal_from_cash_disbursement() 
IS 'Create 2 journal entry lines (debit and credit) for approved cash disbursements based on debit_account_code/name and credit_account_code/name';

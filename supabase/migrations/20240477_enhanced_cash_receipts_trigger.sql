-- Enhanced trigger that's more robust
CREATE OR REPLACE FUNCTION create_journal_from_cash_receipts()
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
    
    -- Check if journal entries already exist for this receipt
    SELECT COUNT(*) INTO v_exists_check
    FROM journal_entries
    WHERE reference_type = 'cash_receipts' AND reference_id = NEW.id;
    
    IF v_exists_check > 0 THEN
      RAISE NOTICE 'Journal entries already exist for receipt ID: %. Skipping.', NEW.id;
      RETURN NEW;
    END IF;
    
    -- Generate journal number
    v_seq_num := NEXTVAL('journal_entries_seq');
    v_journal_number := 'JE-CR-' || TO_CHAR(NEW.transaction_date, 'YYYYMMDD') || '-' || LPAD(v_seq_num::TEXT, 6, '0');
    
    -- Validate that we have account codes
    IF NEW.debit_account_code IS NULL AND NEW.coa_cash_code IS NULL THEN
      RAISE EXCEPTION 'Cannot create journal entry: No debit account code specified for receipt ID: %', NEW.id;
    END IF;
    
    IF NEW.credit_account_code IS NULL AND NEW.coa_contra_code IS NULL THEN
      RAISE EXCEPTION 'Cannot create journal entry: No credit account code specified for receipt ID: %', NEW.id;
    END IF;
    
    -- Insert DEBIT Entry (Bank/Cash - Asset increases)
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
      COALESCE(NEW.debit_account_code, NEW.coa_cash_code),
      NEW.debit_account_name,
      NULL,
      NULL,
      NEW.amount,
      0,
      NEW.amount,
      NEW.description,
      NEW.reference_number,
      'Penerimaan',
      'cash_receipts',
      NEW.id,
      NEW.bukti
    );
    
    -- Insert CREDIT Entry (Revenue/Liability)
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
      COALESCE(NEW.credit_account_code, NEW.coa_contra_code),
      NEW.credit_account_name,
      0,
      NEW.amount,
      NEW.amount,
      NEW.description,
      NEW.reference_number,
      'Penerimaan',
      'cash_receipts',
      NEW.id,
      NEW.bukti
    );
    
    -- Update journal_ref
    UPDATE cash_and_bank_receipts
    SET journal_ref = v_journal_number
    WHERE id = NEW.id;
    
    RAISE NOTICE 'Created journal entries for receipt ID: % with journal number: %', NEW.id, v_journal_number;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure trigger is attached
DROP TRIGGER IF EXISTS trigger_create_journal_from_cash_receipts ON cash_and_bank_receipts;

CREATE TRIGGER trigger_create_journal_from_cash_receipts
  AFTER INSERT OR UPDATE ON cash_and_bank_receipts
  FOR EACH ROW
  EXECUTE FUNCTION create_journal_from_cash_receipts();

COMMENT ON FUNCTION create_journal_from_cash_receipts() 
IS 'Create 2 journal entry lines (debit and credit) for approved cash receipts based on debit_account_code/name and credit_account_code/name';

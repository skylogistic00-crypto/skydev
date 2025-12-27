-- Update trigger untuk menggunakan debit_account_code dan credit_account_code
-- Prioritas: debit/credit_account_code > coa_cash_code/coa_contra_code

CREATE OR REPLACE FUNCTION create_journal_from_cash_receipts()
RETURNS TRIGGER AS $$
DECLARE
  v_journal_number TEXT;
  v_cash_account_name TEXT;
  v_contra_account_name TEXT;
BEGIN
  -- Hanya jalankan jika status berubah menjadi approved
  IF NEW.approval_status = 'approved' AND (OLD.approval_status IS NULL OR OLD.approval_status != 'approved') THEN
    
    -- Generate journal number
    v_journal_number := 'JE-CR-' || TO_CHAR(NEW.transaction_date, 'YYYYMMDD') || '-' || LPAD(NEXTVAL('journal_entries_seq')::TEXT, 4, '0');
    
    -- Get account names from chart_of_accounts
    SELECT account_name INTO v_cash_account_name
    FROM chart_of_accounts
    WHERE account_code = COALESCE(NEW.debit_account_code, NEW.coa_cash_code);
    
    SELECT account_name INTO v_contra_account_name
    FROM chart_of_accounts
    WHERE account_code = COALESCE(NEW.credit_account_code, NEW.coa_contra_code);
    
    -- Insert DEBIT Entry (Cash/Bank)
    INSERT INTO journal_entries (
      tanggal,
      entry_date,
      journal_number,
      debit_account,
      debit_account_name,
      credit_account,
      credit_account_name,
      amount,
      description,
      reference_number,
      jenis_transaksi,
      source_table,
      source_id
    ) VALUES (
      NEW.transaction_date,
      NEW.transaction_date,
      v_journal_number,
      COALESCE(NEW.debit_account_code, NEW.coa_cash_code),
      COALESCE(NEW.debit_account_name, v_cash_account_name, NEW.coa_cash_code),
      NULL,
      NULL,
      NEW.amount,
      NEW.description,
      NEW.reference_number,
      'Pendapatan',
      'cash_and_bank_receipts',
      NEW.id
    );
    
    -- Insert CREDIT Entry (Revenue/Contra Account)
    INSERT INTO journal_entries (
      tanggal,
      entry_date,
      journal_number,
      debit_account,
      debit_account_name,
      credit_account,
      credit_account_name,
      amount,
      description,
      reference_number,
      jenis_transaksi,
      source_table,
      source_id
    ) VALUES (
      NEW.transaction_date,
      NEW.transaction_date,
      v_journal_number,
      NULL,
      NULL,
      COALESCE(NEW.credit_account_code, NEW.coa_contra_code),
      COALESCE(NEW.credit_account_name, v_contra_account_name, NEW.coa_contra_code),
      NEW.amount,
      NEW.description,
      NEW.reference_number,
      'Pendapatan',
      'cash_and_bank_receipts',
      NEW.id
    );
    
    -- Update journal_ref di cash_and_bank_receipts
    UPDATE cash_and_bank_receipts
    SET journal_ref = v_journal_number
    WHERE id = NEW.id;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_journal_from_cash_receipts() IS 'Create 2 journal entries using debit_account_code and credit_account_code from cash_and_bank_receipts';

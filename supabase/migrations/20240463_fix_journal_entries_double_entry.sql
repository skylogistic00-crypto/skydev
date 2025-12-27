-- Fix trigger untuk membuat 2 baris journal entries (debit dan credit terpisah)

CREATE OR REPLACE FUNCTION create_journal_from_cash_disbursement()
RETURNS TRIGGER AS $$
DECLARE
  v_journal_number TEXT;
  v_expense_account_name TEXT;
  v_cash_account_name TEXT;
BEGIN
  -- Hanya jalankan jika status berubah menjadi approved
  IF NEW.approval_status = 'approved' AND (OLD.approval_status IS NULL OR OLD.approval_status != 'approved') THEN
    
    -- Generate journal number
    v_journal_number := 'JE-CD-' || TO_CHAR(NEW.transaction_date, 'YYYYMMDD') || '-' || LPAD(NEXTVAL('journal_entries_seq')::TEXT, 4, '0');
    
    -- Get account names from chart_of_accounts
    SELECT account_name INTO v_expense_account_name
    FROM chart_of_accounts
    WHERE account_code = NEW.coa_expense_code;
    
    SELECT account_name INTO v_cash_account_name
    FROM chart_of_accounts
    WHERE account_code = NEW.coa_cash_code;
    
    -- Insert DEBIT Entry (Expense)
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
      NEW.coa_expense_code,
      COALESCE(v_expense_account_name, NEW.coa_expense_code),
      NULL,
      NULL,
      NEW.amount,
      NEW.description,
      NEW.document_number,
      'Pengeluaran',
      'cash_disbursement',
      NEW.id
    );
    
    -- Insert CREDIT Entry (Cash/Bank)
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
      NEW.coa_cash_code,
      COALESCE(v_cash_account_name, NEW.coa_cash_code),
      NEW.amount,
      NEW.description,
      NEW.document_number,
      'Pengeluaran',
      'cash_disbursement',
      NEW.id
    );
    
    -- Update journal_ref di cash_disbursement
    UPDATE cash_disbursement
    SET journal_ref = v_journal_number
    WHERE id = NEW.id;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


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

COMMENT ON FUNCTION create_journal_from_cash_disbursement() IS 'Automatically create 2 journal entries (debit & credit) when cash_disbursement is approved';
COMMENT ON FUNCTION create_journal_from_cash_receipts() IS 'Automatically create 2 journal entries (debit & credit) when cash_and_bank_receipts is approved';

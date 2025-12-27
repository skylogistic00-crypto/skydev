-- Final fix untuk trigger cash_and_bank_receipts:
-- 1. Tambahkan bukti_url support
-- 2. Gunakan timestamp untuk unique journal_number
-- 3. Hapus dependency ke kolom category

CREATE OR REPLACE FUNCTION create_journal_from_cash_receipts()
RETURNS TRIGGER AS $$
DECLARE
  v_journal_number TEXT;
  v_cash_account_name TEXT;
  v_contra_account_name TEXT;
  v_seq_num INTEGER;
BEGIN
  -- Hanya jalankan jika status berubah menjadi approved
  IF NEW.approval_status = 'approved' AND (OLD.approval_status IS NULL OR OLD.approval_status != 'approved') THEN
    
    -- Generate unique sequence number
    v_seq_num := NEXTVAL('journal_entries_seq');
    
    -- Generate journal number with timestamp for extra uniqueness
    v_journal_number := 'JE-CR-' || TO_CHAR(NEW.transaction_date, 'YYYYMMDD') || '-' || LPAD(v_seq_num::TEXT, 6, '0') || '-' || EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT;
    
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
      source_id,
      bukti_url
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
      NEW.id,
      NEW.bukti
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
      source_id,
      bukti_url
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
      NEW.id,
      NEW.bukti
    );
    
    -- Update journal_ref di cash_and_bank_receipts
    UPDATE cash_and_bank_receipts
    SET journal_ref = v_journal_number
    WHERE id = NEW.id;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_journal_from_cash_receipts() IS 'Create 2 journal entries with bukti_url, using debit/credit_account_code, with timestamp-based unique journal_number';

-- Manually create journal entries to test if the table structure is correct
DO $$
DECLARE
  rec RECORD;
  v_journal_number TEXT;
  v_seq_num INTEGER;
BEGIN
  -- Delete existing journal entries from cash_receipts
  DELETE FROM journal_entries WHERE reference_type = 'cash_receipts';
  
  -- Loop through all approved cash receipts
  FOR rec IN 
    SELECT * FROM cash_and_bank_receipts 
    WHERE approval_status = 'approved'
    ORDER BY transaction_date
  LOOP
    -- Generate journal number
    v_seq_num := NEXTVAL('journal_entries_seq');
    v_journal_number := 'JE-CR-' || TO_CHAR(rec.transaction_date, 'YYYYMMDD') || '-' || LPAD(v_seq_num::TEXT, 6, '0');
    
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
      amount,
      description,
      reference_number,
      jenis_transaksi,
      reference_type,
      reference_id,
      bukti_url
    ) VALUES (
      rec.transaction_date,
      rec.transaction_date,
      v_journal_number,
      v_journal_number,
      rec.debit_account_code,
      rec.debit_account_name,
      NULL,
      NULL,
      rec.amount,
      rec.description,
      rec.reference_number,
      'Penerimaan',
      'cash_receipts',
      rec.id,
      rec.bukti
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
      amount,
      description,
      reference_number,
      jenis_transaksi,
      reference_type,
      reference_id,
      bukti_url
    ) VALUES (
      rec.transaction_date,
      rec.transaction_date,
      v_journal_number,
      v_journal_number,
      NULL,
      NULL,
      rec.credit_account_code,
      rec.credit_account_name,
      rec.amount,
      rec.description,
      rec.reference_number,
      'Penerimaan',
      'cash_receipts',
      rec.id,
      rec.bukti
    );
    
    -- Update journal_ref
    UPDATE cash_and_bank_receipts
    SET journal_ref = v_journal_number
    WHERE id = rec.id;
    
    RAISE NOTICE 'Created journal entries for receipt ID: % with journal number: %', rec.id, v_journal_number;
  END LOOP;
END $$;

-- Verify results
SELECT 
  'Records processed' as status,
  COUNT(DISTINCT reference_id) as cash_receipts_count,
  COUNT(*) as journal_entries_count
FROM journal_entries
WHERE reference_type = 'cash_receipts';

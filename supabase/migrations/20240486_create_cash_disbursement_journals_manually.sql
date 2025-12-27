-- Populate account names from chart_of_accounts
UPDATE cash_disbursement cd
SET 
  debit_account_name = (
    SELECT account_name 
    FROM chart_of_accounts 
    WHERE account_code = cd.debit_account_code 
    LIMIT 1
  ),
  credit_account_name = (
    SELECT account_name 
    FROM chart_of_accounts 
    WHERE account_code = cd.credit_account_code 
    LIMIT 1
  )
WHERE debit_account_code IS NOT NULL 
  AND (debit_account_name IS NULL OR credit_account_name IS NULL);

-- Manually create journal entries for existing approved records
DO $$
DECLARE
  rec RECORD;
  v_journal_number TEXT;
  v_seq_num INTEGER;
BEGIN
  -- Delete existing journal entries from cash_disbursement
  DELETE FROM journal_entries WHERE reference_type = 'cash_disbursement';
  
  -- Loop through all approved cash disbursements
  FOR rec IN 
    SELECT * FROM cash_disbursement 
    WHERE approval_status = 'approved'
      AND debit_account_code IS NOT NULL
      AND credit_account_code IS NOT NULL
    ORDER BY transaction_date
  LOOP
    -- Generate journal number
    v_seq_num := NEXTVAL('journal_entries_seq');
    v_journal_number := 'JE-CD-' || TO_CHAR(rec.transaction_date, 'YYYYMMDD') || '-' || LPAD(v_seq_num::TEXT, 6, '0');
    
    -- Insert DEBIT Entry (Expense account)
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
      rec.transaction_date,
      rec.transaction_date,
      v_journal_number,
      v_journal_number,
      rec.debit_account_code,
      rec.debit_account_name,
      NULL,
      NULL,
      rec.amount,
      0,
      rec.amount,
      rec.description,
      rec.document_number,
      COALESCE(rec.transaction_type, rec.category, 'Pengeluaran'),
      'cash_disbursement',
      rec.id,
      rec.attachment_url
    );
    
    -- Insert CREDIT Entry (Bank/Cash account)
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
      rec.transaction_date,
      rec.transaction_date,
      v_journal_number,
      v_journal_number,
      NULL,
      NULL,
      rec.credit_account_code,
      rec.credit_account_name,
      0,
      rec.amount,
      rec.amount,
      rec.description,
      rec.document_number,
      COALESCE(rec.transaction_type, rec.category, 'Pengeluaran'),
      'cash_disbursement',
      rec.id,
      rec.attachment_url
    );
    
    -- Update journal_ref
    UPDATE cash_disbursement
    SET journal_ref = v_journal_number
    WHERE id = rec.id;
    
    RAISE NOTICE 'Created journal entries for disbursement ID: % with journal number: %', rec.id, v_journal_number;
  END LOOP;
END $$;

-- Verify results
SELECT 
  'Records processed' as status,
  COUNT(DISTINCT reference_id) as disbursement_count,
  COUNT(*) as journal_entries_count,
  SUM(debit) as total_debit,
  SUM(credit) as total_credit
FROM journal_entries
WHERE reference_type = 'cash_disbursement';

-- Show the journal entries details
SELECT 
  journal_number,
  tanggal,
  debit_account,
  debit_account_name,
  credit_account,
  credit_account_name,
  debit,
  credit,
  amount,
  description,
  jenis_transaksi,
  reference_type
FROM journal_entries
WHERE reference_type = 'cash_disbursement'
ORDER BY journal_number, debit DESC NULLS LAST;

-- Fix the trigger to prevent re-triggering from UPDATE within the trigger itself
DROP TRIGGER IF EXISTS trigger_create_journal_from_cash_disbursement ON cash_disbursement CASCADE;
DROP FUNCTION IF EXISTS create_journal_from_cash_disbursement() CASCADE;

CREATE OR REPLACE FUNCTION create_journal_from_cash_disbursement()
RETURNS TRIGGER AS $$
DECLARE
  v_journal_number TEXT;
  v_seq_num INTEGER;
  v_exists_check INTEGER;
  v_debit_code TEXT;
  v_debit_name TEXT;
  v_credit_code TEXT;
  v_credit_name TEXT;
BEGIN
  -- Only run if status is approved and not already processed
  IF NEW.approval_status = 'approved' THEN
    
    -- Check if journal entries already exist for this disbursement
    SELECT COUNT(*) INTO v_exists_check
    FROM journal_entries
    WHERE reference_type = 'cash_disbursement' AND reference_id = NEW.id;
    
    IF v_exists_check > 0 THEN
      RAISE NOTICE 'Journal entries already exist for disbursement ID: %. Skipping.', NEW.id;
      RETURN NEW;
    END IF;
    
    -- Determine debit account (expense account)
    v_debit_code := COALESCE(NEW.debit_account_code, NEW.account_code);
    v_debit_name := COALESCE(NEW.debit_account_name, NEW.account_name);
    
    -- If still null, try to get from chart_of_accounts based on category
    IF v_debit_code IS NULL AND NEW.category IS NOT NULL THEN
      SELECT account_code, account_name INTO v_debit_code, v_debit_name
      FROM chart_of_accounts
      WHERE LOWER(account_name) LIKE '%' || LOWER(NEW.category) || '%'
        AND account_code LIKE '6-%'
      LIMIT 1;
    END IF;
    
    -- Determine credit account (cash/bank account)
    v_credit_code := COALESCE(NEW.credit_account_code, NEW.bank_account);
    v_credit_name := NEW.credit_account_name;
    
    -- If credit_name is null, try to get from chart_of_accounts
    IF v_credit_code IS NOT NULL AND v_credit_name IS NULL THEN
      SELECT account_name INTO v_credit_name
      FROM chart_of_accounts
      WHERE account_code = v_credit_code
      LIMIT 1;
    END IF;
    
    -- Validate that we have account codes
    IF v_debit_code IS NULL THEN
      RAISE EXCEPTION 'Cannot create journal entry: No debit account code specified for disbursement ID: %. NEW.debit_account_code = %, NEW.account_code = %', 
        NEW.id, NEW.debit_account_code, NEW.account_code;
    END IF;
    
    IF v_credit_code IS NULL THEN
      RAISE EXCEPTION 'Cannot create journal entry: No credit account code specified for disbursement ID: %. NEW.credit_account_code = %, NEW.bank_account = %', 
        NEW.id, NEW.credit_account_code, NEW.bank_account;
    END IF;
    
    -- Generate journal number
    v_seq_num := NEXTVAL('journal_entries_seq');
    v_journal_number := 'JE-CD-' || TO_CHAR(NEW.transaction_date, 'YYYYMMDD') || '-' || LPAD(v_seq_num::TEXT, 6, '0');
    
    -- Insert DEBIT Entry (Expense - increases)
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
      v_debit_code,
      v_debit_name,
      NULL,
      NULL,
      NEW.amount,
      0,
      NEW.amount,
      COALESCE(NEW.description, 'Pengeluaran Kas/Bank'),
      NEW.document_number,
      COALESCE(NEW.transaction_type, 'Pengeluaran'),
      'cash_disbursement',
      NEW.id,
      NEW.bukti
    );
    
    -- Insert CREDIT Entry (Cash/Bank - decreases)
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
      v_credit_code,
      v_credit_name,
      0,
      NEW.amount,
      NEW.amount,
      COALESCE(NEW.description, 'Pengeluaran Kas/Bank'),
      NEW.document_number,
      COALESCE(NEW.transaction_type, 'Pengeluaran'),
      'cash_disbursement',
      NEW.id,
      NEW.bukti
    );
    
    -- REMOVED UPDATE to prevent re-triggering
    -- The journal_ref will be NULL, but that's acceptable
    -- Or we can use a separate UPDATE statement outside the trigger
    
    RAISE NOTICE 'Created journal entries for disbursement ID: % with journal number: %', NEW.id, v_journal_number;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger ONLY on INSERT (not UPDATE)
CREATE TRIGGER trigger_create_journal_from_cash_disbursement
  AFTER INSERT ON cash_disbursement
  FOR EACH ROW
  WHEN (NEW.approval_status = 'approved')
  EXECUTE FUNCTION create_journal_from_cash_disbursement();

-- Delete existing duplicate journal entries (keep only the first 2 for each disbursement)
WITH ranked_journals AS (
  SELECT 
    id,
    reference_id,
    journal_number,
    ROW_NUMBER() OVER (PARTITION BY reference_id, journal_number ORDER BY created_at) as rn
  FROM journal_entries
  WHERE reference_type = 'cash_disbursement'
    AND created_at > NOW() - INTERVAL '1 hour'
)
DELETE FROM journal_entries
WHERE id IN (
  SELECT id FROM ranked_journals WHERE rn > 1
);

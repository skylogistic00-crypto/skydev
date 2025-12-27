-- Drop ALL trigger functions that might be creating journal entries
DROP TRIGGER IF EXISTS trigger_create_journal_from_cash_disbursement ON cash_disbursement CASCADE;
DROP TRIGGER IF EXISTS trigger_update_journal_from_cash_disbursement ON cash_disbursement CASCADE;
DROP TRIGGER IF EXISTS trigger_cash_disbursement_journal ON cash_disbursement CASCADE;
DROP TRIGGER IF EXISTS trg_cash_disbursement_journal ON cash_disbursement CASCADE;

DROP TRIGGER IF EXISTS trigger_create_journal_from_cash_receipts ON cash_and_bank_receipts CASCADE;
DROP TRIGGER IF EXISTS trigger_update_journal_from_cash_receipts ON cash_and_bank_receipts CASCADE;
DROP TRIGGER IF EXISTS trigger_cash_receipts_journal ON cash_and_bank_receipts CASCADE;
DROP TRIGGER IF EXISTS trg_cash_receipts_journal ON cash_and_bank_receipts CASCADE;

-- Drop the functions
DROP FUNCTION IF EXISTS create_journal_from_cash_disbursement() CASCADE;
DROP FUNCTION IF EXISTS create_journal_from_cash_receipts() CASCADE;

-- Recreate ONLY the cash_disbursement function (simplified)
CREATE OR REPLACE FUNCTION create_journal_from_cash_disbursement()
RETURNS TRIGGER AS $$
DECLARE
  v_journal_number TEXT;
  v_seq_num INTEGER;
  v_debit_code TEXT;
  v_debit_name TEXT;
  v_credit_code TEXT;
  v_credit_name TEXT;
BEGIN
  -- Only process if approved
  IF NEW.approval_status != 'approved' THEN
    RETURN NEW;
  END IF;
  
  -- Check if already processed
  IF EXISTS (
    SELECT 1 FROM journal_entries 
    WHERE reference_type = 'cash_disbursement' 
    AND reference_id = NEW.id
  ) THEN
    RETURN NEW;
  END IF;
  
  -- Get accounts
  v_debit_code := COALESCE(NEW.debit_account_code, NEW.account_code);
  v_debit_name := COALESCE(NEW.debit_account_name, NEW.account_name);
  v_credit_code := COALESCE(NEW.credit_account_code, NEW.bank_account);
  v_credit_name := NEW.credit_account_name;
  
  IF v_debit_code IS NULL OR v_credit_code IS NULL THEN
    RAISE EXCEPTION 'Missing account codes for disbursement ID: %', NEW.id;
  END IF;
  
  -- Generate journal number
  v_seq_num := NEXTVAL('journal_entries_seq');
  v_journal_number := 'JE-CD-' || TO_CHAR(NEW.transaction_date, 'YYYYMMDD') || '-' || LPAD(v_seq_num::TEXT, 6, '0');
  
  -- Insert DEBIT
  INSERT INTO journal_entries (
    tanggal, entry_date, journal_number, journal_ref,
    debit_account, debit_account_name, debit, credit,
    amount, description, reference_type, reference_id
  ) VALUES (
    NEW.transaction_date, NEW.transaction_date, v_journal_number, v_journal_number,
    v_debit_code, v_debit_name, NEW.amount, 0,
    NEW.amount, COALESCE(NEW.description, 'Pengeluaran'), 'cash_disbursement', NEW.id
  );
  
  -- Insert CREDIT
  INSERT INTO journal_entries (
    tanggal, entry_date, journal_number, journal_ref,
    credit_account, credit_account_name, debit, credit,
    amount, description, reference_type, reference_id
  ) VALUES (
    NEW.transaction_date, NEW.transaction_date, v_journal_number, v_journal_number,
    v_credit_code, v_credit_name, 0, NEW.amount,
    NEW.amount, COALESCE(NEW.description, 'Pengeluaran'), 'cash_disbursement', NEW.id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate ONLY the cash_receipts function (simplified)
CREATE OR REPLACE FUNCTION create_journal_from_cash_receipts()
RETURNS TRIGGER AS $$
DECLARE
  v_journal_number TEXT;
  v_seq_num INTEGER;
  v_debit_code TEXT;
  v_debit_name TEXT;
  v_credit_code TEXT;
  v_credit_name TEXT;
BEGIN
  -- Only process if approved
  IF NEW.approval_status != 'approved' THEN
    RETURN NEW;
  END IF;
  
  -- Check if already processed
  IF EXISTS (
    SELECT 1 FROM journal_entries 
    WHERE reference_type = 'cash_receipts' 
    AND reference_id = NEW.id
  ) THEN
    RETURN NEW;
  END IF;
  
  -- Get accounts
  v_debit_code := COALESCE(NEW.debit_account_code, NEW.bank_account);
  v_debit_name := NEW.debit_account_name;
  v_credit_code := COALESCE(NEW.credit_account_code, NEW.account_code);
  v_credit_name := COALESCE(NEW.credit_account_name, NEW.account_name);
  
  IF v_debit_code IS NULL OR v_credit_code IS NULL THEN
    RAISE EXCEPTION 'Missing account codes for receipt ID: %', NEW.id;
  END IF;
  
  -- Generate journal number
  v_seq_num := NEXTVAL('journal_entries_seq');
  v_journal_number := 'JE-CR-' || TO_CHAR(NEW.transaction_date, 'YYYYMMDD') || '-' || LPAD(v_seq_num::TEXT, 6, '0');
  
  -- Insert DEBIT
  INSERT INTO journal_entries (
    tanggal, entry_date, journal_number, journal_ref,
    debit_account, debit_account_name, debit, credit,
    amount, description, reference_type, reference_id
  ) VALUES (
    NEW.transaction_date, NEW.transaction_date, v_journal_number, v_journal_number,
    v_debit_code, v_debit_name, NEW.amount, 0,
    NEW.amount, COALESCE(NEW.description, 'Penerimaan'), 'cash_receipts', NEW.id
  );
  
  -- Insert CREDIT
  INSERT INTO journal_entries (
    tanggal, entry_date, journal_number, journal_ref,
    credit_account, credit_account_name, debit, credit,
    amount, description, reference_type, reference_id
  ) VALUES (
    NEW.transaction_date, NEW.transaction_date, v_journal_number, v_journal_number,
    v_credit_code, v_credit_name, 0, NEW.amount,
    NEW.amount, COALESCE(NEW.description, 'Penerimaan'), 'cash_receipts', NEW.id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create ONLY these two triggers
CREATE TRIGGER trigger_create_journal_from_cash_disbursement
  AFTER INSERT ON cash_disbursement
  FOR EACH ROW
  WHEN (NEW.approval_status = 'approved')
  EXECUTE FUNCTION create_journal_from_cash_disbursement();

CREATE TRIGGER trigger_create_journal_from_cash_receipts
  AFTER INSERT ON cash_and_bank_receipts
  FOR EACH ROW
  WHEN (NEW.approval_status = 'approved')
  EXECUTE FUNCTION create_journal_from_cash_receipts();

-- Delete duplicate journal entries from the last hour
WITH duplicates AS (
  SELECT id, 
    ROW_NUMBER() OVER (PARTITION BY reference_type, reference_id, journal_number ORDER BY created_at) as rn
  FROM journal_entries
  WHERE created_at > NOW() - INTERVAL '1 hour'
)
DELETE FROM journal_entries
WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);

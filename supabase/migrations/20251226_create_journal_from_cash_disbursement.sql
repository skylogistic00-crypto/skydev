CREATE OR REPLACE FUNCTION create_journal_from_cash_disbursement()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.approval_status NOT IN ('approved', 'posted') THEN
    RETURN NEW;
  END IF;

  DELETE FROM journal_entries
  WHERE source_table = 'cash_disbursement'
    AND source_id = NEW.id;

  INSERT INTO journal_entries (
    source_table,
    source_id,
    journal_ref,
    account_code,
    account_name,
    debit_account_code,
    debit_account_name,
    credit_account_code,
    credit_account_name,
    debit,
    credit,
    amount,
    transaction_type,
    transaction_date,
    approval_status,
    description,
    bukti
  ) VALUES (
    'cash_disbursement',
    NEW.id,
    COALESCE(NEW.journal_ref, NEW.id::text),
    NEW.debit_account_code,
    NEW.debit_account_name,
    NEW.debit_account_code,
    NEW.debit_account_name,
    NEW.credit_account_code,
    NEW.credit_account_name,
    NEW.amount,
    0,
    NEW.amount,
    NEW.transaction_type,
    NEW.transaction_date,
    NEW.approval_status,
    NEW.description,
    NEW.bukti
  );

  INSERT INTO journal_entries (
    source_table,
    source_id,
    journal_ref,
    account_code,
    account_name,
    debit_account_code,
    debit_account_name,
    credit_account_code,
    credit_account_name,
    debit,
    credit,
    amount,
    transaction_type,
    transaction_date,
    approval_status,
    description,
    bukti
  ) VALUES (
    'cash_disbursement',
    NEW.id,
    COALESCE(NEW.journal_ref, NEW.id::text),
    NEW.credit_account_code,
    NEW.credit_account_name,
    NEW.debit_account_code,
    NEW.debit_account_name,
    NEW.credit_account_code,
    NEW.credit_account_name,
    0,
    NEW.amount,
    NEW.amount,
    NEW.transaction_type,
    NEW.transaction_date,
    NEW.approval_status,
    NEW.description,
    NEW.bukti
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_journal_from_cash_disbursement ON cash_disbursement;
CREATE TRIGGER trigger_journal_from_cash_disbursement
AFTER INSERT OR UPDATE ON cash_disbursement
FOR EACH ROW
EXECUTE FUNCTION create_journal_from_cash_disbursement();

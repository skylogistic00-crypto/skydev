CREATE OR REPLACE FUNCTION create_journal_from_employee_advances()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.journal_ref IS NULL OR NEW.journal_ref = '' THEN
    RETURN NEW;
  END IF;

  IF NEW.debit_account_code IS NULL OR NEW.credit_account_code IS NULL THEN
    RETURN NEW;
  END IF;

  DELETE FROM journal_entries
  WHERE source_table = 'employee_advances'
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
    'employee_advances',
    NEW.id,
    NEW.journal_ref,
    NEW.debit_account_code,
    NEW.debit_account_name,
    NEW.debit_account_code,
    NEW.debit_account_name,
    NEW.credit_account_code,
    NEW.credit_account_name,
    NEW.amount,
    0,
    NEW.amount,
    'Uang Muka',
    COALESCE(NEW.disbursement_date, NEW.advance_date),
    CASE
      WHEN NEW.status IN ('waiting_approval', 'approved', 'rejected', 'posted') THEN NEW.status
      WHEN NEW.status IN ('draft', 'disbursed') THEN 'approved'
      ELSE 'approved'
    END,
    COALESCE(NEW.notes, ''),
    COALESCE(NEW.bukti, NEW.bukti_url)
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
    'employee_advances',
    NEW.id,
    NEW.journal_ref,
    NEW.credit_account_code,
    NEW.credit_account_name,
    NEW.debit_account_code,
    NEW.debit_account_name,
    NEW.credit_account_code,
    NEW.credit_account_name,
    0,
    NEW.amount,
    NEW.amount,
    'Uang Muka',
    COALESCE(NEW.disbursement_date, NEW.advance_date),
    CASE
      WHEN NEW.status IN ('waiting_approval', 'approved', 'rejected', 'posted') THEN NEW.status
      WHEN NEW.status IN ('draft', 'disbursed') THEN 'approved'
      ELSE 'approved'
    END,
    COALESCE(NEW.notes, ''),
    COALESCE(NEW.bukti, NEW.bukti_url)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_journal_from_employee_advances ON employee_advances;
CREATE TRIGGER trigger_journal_from_employee_advances
AFTER UPDATE OF journal_ref, debit_account_code, debit_account_name, credit_account_code, credit_account_name, amount, disbursement_date, advance_date, status, notes
ON employee_advances
FOR EACH ROW
WHEN (
  NEW.journal_ref IS NOT NULL
  AND NEW.journal_ref <> ''
  AND NEW.debit_account_code IS NOT NULL
  AND NEW.credit_account_code IS NOT NULL
)
EXECUTE FUNCTION create_journal_from_employee_advances();

DROP TRIGGER IF EXISTS trigger_journal_from_employee_advances ON employee_advances;
DROP FUNCTION IF EXISTS create_journal_from_employee_advances();

CREATE OR REPLACE FUNCTION create_journal_from_employee_advances()
RETURNS TRIGGER AS $$
DECLARE
  v_journal_number TEXT;
  v_seq_num INTEGER;
BEGIN
  IF NEW.status = 'disbursed' AND (OLD.status IS NULL OR OLD.status != 'disbursed') THEN
    IF NEW.debit_account_code IS NULL OR NEW.credit_account_code IS NULL THEN
      RETURN NEW;
    END IF;

    v_seq_num := NEXTVAL('journal_entries_seq');
    v_journal_number := 'JE-EA-' || TO_CHAR(COALESCE(NEW.disbursement_date, NEW.advance_date), 'YYYYMMDD') || '-' || LPAD(v_seq_num::TEXT, 6, '0') || '-' || EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT;

    DELETE FROM journal_entries
    WHERE source_table = 'employee_advances'
      AND source_id = NEW.id;

    INSERT INTO journal_entries (
      source_table,
      source_id,
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
      bukti,
      bukti_url,
      journal_number
    ) VALUES (
      'employee_advances',
      NEW.id,
      NEW.debit_account_code,
      COALESCE(NEW.debit_account_name, NEW.debit_account_code),
      NEW.debit_account_code,
      COALESCE(NEW.debit_account_name, NEW.debit_account_code),
      NEW.credit_account_code,
      COALESCE(NEW.credit_account_name, NEW.credit_account_code),
      NEW.amount,
      0,
      NEW.amount,
      'Uang Muka',
      COALESCE(NEW.disbursement_date, NEW.advance_date),
      'approved',
      COALESCE(NEW.notes, ''),
      COALESCE(NEW.bukti, NEW.bukti_url),
      NEW.bukti_url,
      v_journal_number
    );

    INSERT INTO journal_entries (
      source_table,
      source_id,
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
      bukti,
      bukti_url,
      journal_number
    ) VALUES (
      'employee_advances',
      NEW.id,
      NEW.credit_account_code,
      COALESCE(NEW.credit_account_name, NEW.credit_account_code),
      NEW.debit_account_code,
      COALESCE(NEW.debit_account_name, NEW.debit_account_code),
      NEW.credit_account_code,
      COALESCE(NEW.credit_account_name, NEW.credit_account_code),
      0,
      NEW.amount,
      NEW.amount,
      'Uang Muka',
      COALESCE(NEW.disbursement_date, NEW.advance_date),
      'approved',
      COALESCE(NEW.notes, ''),
      COALESCE(NEW.bukti, NEW.bukti_url),
      NEW.bukti_url,
      v_journal_number
    );

    UPDATE employee_advances
    SET journal_ref = v_journal_number
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_journal_from_employee_advances
AFTER UPDATE OF status, debit_account_code, debit_account_name, credit_account_code, credit_account_name, amount, disbursement_date, advance_date, notes, reference_number, bukti_url, bukti
ON employee_advances
FOR EACH ROW
EXECUTE FUNCTION create_journal_from_employee_advances();

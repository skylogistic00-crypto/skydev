DROP TRIGGER IF EXISTS trigger_journal_from_employee_advances ON employee_advances;
DROP FUNCTION IF EXISTS create_journal_from_employee_advances();

CREATE OR REPLACE FUNCTION create_journal_from_employee_advances()
RETURNS TRIGGER AS $$
DECLARE
  v_journal_number TEXT;
  v_seq_num INTEGER;
BEGIN
  IF NEW.status = 'disbursed' AND (OLD.status IS NULL OR OLD.status != 'disbursed') THEN
    v_seq_num := NEXTVAL('journal_entries_seq');
    v_journal_number := 'JE-EA-' || TO_CHAR(COALESCE(NEW.disbursement_date, NEW.advance_date), 'YYYYMMDD') || '-' || LPAD(v_seq_num::TEXT, 6, '0') || '-' || EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT;

    DELETE FROM journal_entries
    WHERE source_table = 'employee_advances'
      AND source_id = NEW.id;

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
      COALESCE(NEW.disbursement_date, NEW.advance_date),
      COALESCE(NEW.disbursement_date, NEW.advance_date),
      v_journal_number,
      NEW.debit_account_code,
      COALESCE(NEW.debit_account_name, NEW.debit_account_code),
      NULL,
      NULL,
      NEW.amount,
      COALESCE(NEW.notes, ''),
      NEW.reference_number,
      'Uang Muka',
      'employee_advances',
      NEW.id,
      COALESCE(NEW.bukti, NEW.bukti_url)
    );

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
      COALESCE(NEW.disbursement_date, NEW.advance_date),
      COALESCE(NEW.disbursement_date, NEW.advance_date),
      v_journal_number,
      NULL,
      NULL,
      NEW.credit_account_code,
      COALESCE(NEW.credit_account_name, NEW.credit_account_code),
      NEW.amount,
      COALESCE(NEW.notes, ''),
      NEW.reference_number,
      'Uang Muka',
      'employee_advances',
      NEW.id,
      COALESCE(NEW.bukti, NEW.bukti_url)
    );

    UPDATE employee_advances
    SET journal_ref = v_journal_number
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_journal_from_employee_advances
AFTER UPDATE ON employee_advances
FOR EACH ROW
EXECUTE FUNCTION create_journal_from_employee_advances();

-- Create/replace trigger to create journal entries when bank_mutations is approved

-- 1) Function to create journal entry from bank mutation
DROP FUNCTION IF EXISTS public.create_journal_entry_from_bank_mutation() CASCADE;
CREATE OR REPLACE FUNCTION public.create_journal_entry_from_bank_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_journal_ref TEXT;
  v_counterparty_code TEXT;
  v_counterparty_name TEXT;
  v_bank_code TEXT;
  v_bank_name TEXT;
  v_amount NUMERIC;
BEGIN
  -- Only on transition to approved
  IF TG_OP <> 'UPDATE' OR NEW.approval_status <> 'approved' OR COALESCE(OLD.approval_status, '') = 'approved' THEN
    RETURN NEW;
  END IF;

  -- Prevent duplicates
  IF NEW.journal_entry_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Amount: prefer debit/credit columns if present, otherwise fallback to amount
  v_amount := COALESCE(NULLIF(NEW.debit, 0), NULLIF(NEW.credit, 0), NEW.amount, 0);

  -- Determine bank COA (use bank_account_code if available, otherwise bank_account_number)
  v_bank_code := COALESCE(NEW.bank_account_code, NEW.bank_account_number);
  IF v_bank_code IS NULL THEN
    RAISE EXCEPTION 'bank_mutations bank account code is NULL (bank_mutation_id=%)', NEW.id;
  END IF;

  SELECT account_name
    INTO v_bank_name
  FROM chart_of_accounts
  WHERE account_code = v_bank_code
  LIMIT 1;

  v_bank_name := COALESCE(v_bank_name, NEW.bank_account_name, 'Bank');

  -- Determine counterparty account code from mapping result
  -- Prefer suggested_account_id; fallback to NEW.akun (string) if it contains an account_code
  IF NEW.suggested_account_id IS NOT NULL THEN
    SELECT account_code, account_name
      INTO v_counterparty_code, v_counterparty_name
    FROM chart_of_accounts
    WHERE id = NEW.suggested_account_id;
  ELSE
    v_counterparty_code := NEW.akun;
    IF v_counterparty_code IS NOT NULL THEN
      SELECT account_name
        INTO v_counterparty_name
      FROM chart_of_accounts
      WHERE account_code = v_counterparty_code
      LIMIT 1;
    END IF;
  END IF;

  IF v_counterparty_code IS NULL THEN
    RAISE EXCEPTION 'No counterparty account found for bank_mutation_id=% (suggested_account_id/akun is NULL)', NEW.id;
  END IF;

  v_counterparty_name := COALESCE(v_counterparty_name, 'Counterparty');

  -- Journal ref
  v_journal_ref := 'BM-' || SUBSTRING(NEW.id::TEXT, 1, 8);

  -- Insert 2 lines into journal_entries (debit & credit) using same journal_ref
  -- Convention:
  -- - If debit > 0 => Bank is DEBIT, Counterparty is CREDIT
  -- - Else if credit > 0 => Bank is CREDIT, Counterparty is DEBIT
  IF COALESCE(NEW.debit, 0) > 0 OR (COALESCE(NEW.debit, 0) = 0 AND COALESCE(NEW.credit, 0) = 0) THEN
    -- Debit bank, credit counterparty
    INSERT INTO journal_entries (
      journal_ref,
      debit_account,
      credit_account,
      account_code,
      account_name,
      debit,
      credit,
      description,
      tanggal,
      jenis_transaksi,
      approval_status
    ) VALUES
    (
      v_journal_ref,
      v_bank_code,
      v_counterparty_code,
      v_bank_code,
      v_bank_name,
      v_amount,
      0,
      COALESCE(NEW.description, ''),
      COALESCE(NEW.mutation_date, NEW.transaction_date, CURRENT_DATE),
      'Bank Mutation',
      'approved'
    ),
    (
      v_journal_ref,
      v_bank_code,
      v_counterparty_code,
      v_counterparty_code,
      v_counterparty_name,
      0,
      v_amount,
      COALESCE(NEW.description, ''),
      COALESCE(NEW.mutation_date, NEW.transaction_date, CURRENT_DATE),
      'Bank Mutation',
      'approved'
    );
  ELSE
    -- Credit bank, debit counterparty
    INSERT INTO journal_entries (
      journal_ref,
      debit_account,
      credit_account,
      account_code,
      account_name,
      debit,
      credit,
      description,
      tanggal,
      jenis_transaksi,
      approval_status
    ) VALUES
    (
      v_journal_ref,
      v_counterparty_code,
      v_bank_code,
      v_counterparty_code,
      v_counterparty_name,
      v_amount,
      0,
      COALESCE(NEW.description, ''),
      COALESCE(NEW.mutation_date, NEW.transaction_date, CURRENT_DATE),
      'Bank Mutation',
      'approved'
    ),
    (
      v_journal_ref,
      v_counterparty_code,
      v_bank_code,
      v_bank_code,
      v_bank_name,
      0,
      v_amount,
      COALESCE(NEW.description, ''),
      COALESCE(NEW.mutation_date, NEW.transaction_date, CURRENT_DATE),
      'Bank Mutation',
      'approved'
    );
  END IF;

  -- Link bank_mutation to journal_entries by journal_ref (pick first row id)
  UPDATE bank_mutations
  SET journal_entry_id = (
    SELECT id FROM journal_entries WHERE journal_ref = v_journal_ref ORDER BY created_at ASC LIMIT 1
  )
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

-- 2) Trigger
DROP TRIGGER IF EXISTS trigger_create_journal_from_bank_mutations ON bank_mutations;
CREATE TRIGGER trigger_create_journal_from_bank_mutations
AFTER UPDATE OF approval_status ON bank_mutations
FOR EACH ROW
WHEN (OLD.approval_status IS DISTINCT FROM NEW.approval_status AND NEW.approval_status = 'approved')
EXECUTE FUNCTION public.create_journal_entry_from_bank_mutation();

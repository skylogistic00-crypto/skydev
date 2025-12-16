DROP FUNCTION IF EXISTS post_journal_bank_mutation(UUID);

CREATE OR REPLACE FUNCTION post_journal_bank_mutation(p_bank_mutation_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_mutation RECORD;
  v_bank_coa_id UUID;
  v_expense_coa_id UUID;
  v_journal_ref TEXT;
BEGIN
  SELECT * INTO v_mutation
  FROM bank_mutations
  WHERE id = p_bank_mutation_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bank mutation not found: %', p_bank_mutation_id;
  END IF;

  SELECT id INTO v_bank_coa_id
  FROM chart_of_accounts
  WHERE account_code = v_mutation.bank_account_number
  LIMIT 1;

  IF v_bank_coa_id IS NULL THEN
    RAISE EXCEPTION 'Bank account not found in COA: %', v_mutation.bank_account_number;
  END IF;

  v_journal_ref := 'BM-' || SUBSTRING(p_bank_mutation_id::TEXT, 1, 8);

  INSERT INTO journal_entries (
    journal_ref,
    debit_account,
    credit_account,
    account_code,
    account_name,
    account_type,
    debit,
    credit,
    description,
    tanggal,
    jenis_transaksi,
    approval_status
  )
  VALUES (
    v_journal_ref,
    '6-1100',
    v_mutation.bank_account_number,
    '6-1100',
    'Beban Operasional',
    'Beban',
    v_mutation.amount,
    v_mutation.amount,
    v_mutation.description,
    v_mutation.transaction_date,
    'Pengeluaran Bank',
    'approved'
  );

  UPDATE bank_mutations
  SET status = 'posted',
      posted_at = NOW()
  WHERE id = p_bank_mutation_id;
END;
$$;


CREATE OR REPLACE FUNCTION public.post_journal_bank_mutation(p_bank_mutation_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_mutation RECORD;
  v_draft RECORD;
  v_journal_ref TEXT;
  v_count INT;
BEGIN
  SELECT * INTO v_mutation
  FROM public.bank_mutations
  WHERE id = p_bank_mutation_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bank mutation not found: %', p_bank_mutation_id;
  END IF;

  SELECT d.* INTO v_draft
  FROM public.bank_mutation_journal_drafts d
  WHERE d.bank_mutation_id = p_bank_mutation_id
  ORDER BY d.created_at DESC
  LIMIT 1;

  IF NOT FOUND OR v_draft.draft_lines IS NULL OR jsonb_typeof(v_draft.draft_lines) <> 'array' THEN
    RAISE EXCEPTION 'Journal draft not found or invalid draft_lines for bank mutation: %', p_bank_mutation_id;
  END IF;

  v_count := jsonb_array_length(v_draft.draft_lines);

  IF (v_count % 2) <> 0 THEN
    RAISE EXCEPTION 'draft_lines must contain an even number of rows (pairs). Found: %', v_count;
  END IF;

  v_journal_ref := 'BM-' || SUBSTRING(p_bank_mutation_id::TEXT, 1, 8);

  WITH lines AS (
    SELECT
      ord::int AS idx,
      value AS line
    FROM jsonb_array_elements(v_draft.draft_lines) WITH ORDINALITY t(value, ord)
  ),
  paired AS (
    SELECT
      l1.idx AS idx,
      l1.line AS line,
      l2.line AS counter
    FROM lines l1
    JOIN lines l2
      ON l2.idx = l1.idx + 1
    WHERE (l1.idx % 2) = 1

    UNION ALL

    SELECT
      l2.idx AS idx,
      l2.line AS line,
      l1.line AS counter
    FROM lines l1
    JOIN lines l2
      ON l2.idx = l1.idx + 1
    WHERE (l1.idx % 2) = 1
  )
  INSERT INTO public.journal_entries (
    journal_ref,
    account_id,
    account_code,
    account_name,
    debit,
    credit,
    description,
    tanggal,
    transaction_type,
    approval_status,
    debit_account_code,
    debit_account_name,
    credit_account_code,
    credit_account_name
  )
  SELECT
    v_journal_ref,
    COALESCE(
      NULLIF(p.line->>'coa_id', '')::uuid,
      (SELECT id FROM public.chart_of_accounts WHERE account_code = (p.line->>'coa_code') LIMIT 1)
    ) AS account_id,
    COALESCE(p.line->>'coa_code', '') AS account_code,
    COALESCE(p.line->>'coa_name', '') AS account_name,
    COALESCE((p.line->>'debit')::numeric, 0) AS debit,
    COALESCE((p.line->>'credit')::numeric, 0) AS credit,
    COALESCE(p.line->>'description', v_mutation.description) AS description,
    v_mutation.mutation_date AS tanggal,
    COALESCE(v_mutation.transaction_type, p.line->>'transaction_type', NULL) AS transaction_type,
    'approved' AS approval_status,
    CASE WHEN COALESCE((p.line->>'debit')::numeric, 0) > 0 THEN COALESCE(p.line->>'coa_code', '') ELSE COALESCE(p.counter->>'coa_code', '') END AS debit_account_code,
    CASE WHEN COALESCE((p.line->>'debit')::numeric, 0) > 0 THEN COALESCE(p.line->>'coa_name', '') ELSE COALESCE(p.counter->>'coa_name', '') END AS debit_account_name,
    CASE WHEN COALESCE((p.line->>'credit')::numeric, 0) > 0 THEN COALESCE(p.line->>'coa_code', '') ELSE COALESCE(p.counter->>'coa_code', '') END AS credit_account_code,
    CASE WHEN COALESCE((p.line->>'credit')::numeric, 0) > 0 THEN COALESCE(p.line->>'coa_name', '') ELSE COALESCE(p.counter->>'coa_name', '') END AS credit_account_name
  FROM paired p;

  UPDATE public.bank_mutations
  SET status = 'posted',
      posted_at = NOW()
  WHERE id = p_bank_mutation_id;
END;
$$;

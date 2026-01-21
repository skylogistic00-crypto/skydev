CREATE OR REPLACE FUNCTION public.post_journal_bank_mutation(p_bank_mutation_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_mutation RECORD;
  v_draft RECORD;
  v_line JSONB;
  v_coa_id UUID;
  v_journal_ref TEXT;
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

  v_journal_ref := 'BM-' || SUBSTRING(p_bank_mutation_id::TEXT, 1, 8);

  FOR v_line IN
    SELECT value FROM jsonb_array_elements(v_draft.draft_lines) AS t(value)
  LOOP
    v_coa_id := NULL;

    IF (v_line ? 'coa_id') AND NULLIF(v_line->>'coa_id', '') IS NOT NULL THEN
      v_coa_id := (v_line->>'coa_id')::uuid;
    ELSIF (v_line ? 'coa_code') AND NULLIF(v_line->>'coa_code', '') IS NOT NULL THEN
      SELECT id INTO v_coa_id
      FROM public.chart_of_accounts
      WHERE account_code = (v_line->>'coa_code')
      LIMIT 1;
    END IF;

    IF v_coa_id IS NULL THEN
      RAISE EXCEPTION 'COA not found for draft line (coa_id=% coa_code=%)', v_line->>'coa_id', v_line->>'coa_code';
    END IF;

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
      approval_status
    )
    VALUES (
      v_journal_ref,
      v_coa_id,
      COALESCE(v_line->>'coa_code', ''),
      COALESCE(v_line->>'coa_name', ''),
      COALESCE((v_line->>'debit')::numeric, 0),
      COALESCE((v_line->>'credit')::numeric, 0),
      COALESCE(v_line->>'description', v_mutation.description),
      v_mutation.mutation_date,
      COALESCE(v_mutation.transaction_type, v_line->>'transaction_type', NULL),
      'approved'
    );
  END LOOP;

  UPDATE public.bank_mutations
  SET status = 'posted',
      posted_at = NOW()
  WHERE id = p_bank_mutation_id;
END;
$$;

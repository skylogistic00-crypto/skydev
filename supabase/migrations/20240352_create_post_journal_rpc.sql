-- Create RPC function to post cash disbursement to journal
CREATE OR REPLACE FUNCTION post_cash_disbursement_to_journal(p_disbursement_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_disbursement RECORD;
  v_journal_ref TEXT;
  v_entry_count INT := 0;
BEGIN
  -- Get disbursement data
  SELECT * INTO v_disbursement
  FROM cash_disbursement
  WHERE id = p_disbursement_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Cash disbursement not found'
    );
  END IF;
  
  -- Check if already posted
  IF v_disbursement.journal_ref IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Journal already posted for this disbursement'
    );
  END IF;
  
  -- Generate journal reference
  v_journal_ref := 'CD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || SUBSTRING(p_disbursement_id::TEXT, 1, 8);
  
  -- Create debit entry (expense account)
  INSERT INTO journal_entries (
    tanggal,
    journal_ref,
    account_code,
    account_name,
    debit,
    credit,
    keterangan,
    reference_type,
    reference_id,
    created_by,
    status
  )
  VALUES (
    v_disbursement.transaction_date,
    v_journal_ref,
    COALESCE(v_disbursement.account_code, v_disbursement.coa_expense_code),
    COALESCE(v_disbursement.account_name, 'Beban'),
    v_disbursement.amount,
    0,
    v_disbursement.description || ' - ' || v_disbursement.payee_name,
    'cash_disbursement',
    p_disbursement_id,
    v_disbursement.created_by,
    'posted'
  );
  v_entry_count := v_entry_count + 1;
  
  -- Create credit entry (cash/bank account)
  INSERT INTO journal_entries (
    tanggal,
    journal_ref,
    account_code,
    account_name,
    debit,
    credit,
    keterangan,
    reference_type,
    reference_id,
    created_by,
    status
  )
  VALUES (
    v_disbursement.transaction_date,
    v_journal_ref,
    v_disbursement.coa_cash_code,
    CASE 
      WHEN v_disbursement.payment_method = 'Tunai' THEN 'Kas'
      ELSE 'Bank'
    END,
    0,
    v_disbursement.amount,
    v_disbursement.description || ' - ' || v_disbursement.payee_name,
    'cash_disbursement',
    p_disbursement_id,
    v_disbursement.created_by,
    'posted'
  );
  v_entry_count := v_entry_count + 1;
  
  -- If there's tax amount, create tax entry
  IF v_disbursement.tax_amount > 0 THEN
    INSERT INTO journal_entries (
      tanggal,
      journal_ref,
      account_code,
      account_name,
      debit,
      credit,
      keterangan,
      reference_type,
      reference_id,
      created_by,
      status
    )
    VALUES (
      v_disbursement.transaction_date,
      v_journal_ref,
      '1-1400',
      'Pajak Dibayar Dimuka',
      v_disbursement.tax_amount,
      0,
      'Pajak - ' || v_disbursement.description,
      'cash_disbursement',
      p_disbursement_id,
      v_disbursement.created_by,
      'posted'
    );
    v_entry_count := v_entry_count + 1;
  END IF;
  
  -- Update cash_disbursement with journal_ref
  UPDATE cash_disbursement
  SET journal_ref = v_journal_ref,
      approval_status = 'posted'
  WHERE id = p_disbursement_id;
  
  -- Return success result
  RETURN jsonb_build_object(
    'success', true,
    'journal_ref', v_journal_ref,
    'entries_created', v_entry_count,
    'message', 'Journal posted successfully'
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION post_cash_disbursement_to_journal(UUID) IS 'Post cash disbursement to journal entries';

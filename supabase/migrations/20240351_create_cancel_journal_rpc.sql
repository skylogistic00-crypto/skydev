-- Create RPC function to cancel journal by journal_ref and create reversal entry
CREATE OR REPLACE FUNCTION cancel_journal(p_journal_ref TEXT)
RETURNS JSONB AS $$
DECLARE
  v_original_journal RECORD;
  v_reversal_ref TEXT;
  v_reversal_count INT := 0;
BEGIN
  -- Get original journal entries by journal_ref
  FOR v_original_journal IN 
    SELECT * FROM journal_entries WHERE journal_ref = p_journal_ref
  LOOP
    -- Check if already cancelled
    IF v_original_journal.status = 'cancelled' THEN
      CONTINUE;
    END IF;
    
    -- Generate reversal reference
    v_reversal_ref := 'REV-' || p_journal_ref || '-' || TO_CHAR(NOW(), 'YYYYMMDD');
    
    -- Create reversal journal entry (swap debit and credit)
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
      CURRENT_DATE,
      v_reversal_ref,
      v_original_journal.account_code,
      v_original_journal.account_name,
      v_original_journal.credit,  -- Swap: original credit becomes debit
      v_original_journal.debit,   -- Swap: original debit becomes credit
      'REVERSAL: ' || COALESCE(v_original_journal.keterangan, ''),
      'reversal',
      v_original_journal.id,
      v_original_journal.created_by,
      'posted'
    );
    
    -- Update original journal status to cancelled
    UPDATE journal_entries
    SET status = 'cancelled',
        updated_at = NOW()
    WHERE id = v_original_journal.id;
    
    v_reversal_count := v_reversal_count + 1;
  END LOOP;
  
  IF v_reversal_count = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No journal entries found or all already cancelled'
    );
  END IF;
  
  -- Return success result
  RETURN jsonb_build_object(
    'success', true,
    'original_journal_ref', p_journal_ref,
    'reversal_journal_ref', v_reversal_ref,
    'reversed_count', v_reversal_count,
    'message', 'Journal cancelled and reversal created'
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cancel_journal(TEXT) IS 'Cancel journal entries by journal_ref and create reversal entries';

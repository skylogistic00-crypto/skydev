-- Drop any trigger that calls generate_journal function on cash_disbursement
DROP TRIGGER IF EXISTS trigger_generate_journal ON cash_disbursement;
DROP TRIGGER IF EXISTS generate_journal_trigger ON cash_disbursement;
DROP TRIGGER IF EXISTS trg_generate_journal ON cash_disbursement;
DROP TRIGGER IF EXISTS cash_disbursement_generate_journal ON cash_disbursement;
DROP TRIGGER IF EXISTS after_insert_generate_journal ON cash_disbursement;

-- Also drop the function if it exists (to clean up)
DROP FUNCTION IF EXISTS generate_journal(uuid);
DROP FUNCTION IF EXISTS generate_journal();

-- Create a dummy function to prevent errors if trigger still exists somewhere
CREATE OR REPLACE FUNCTION generate_journal(p_disbursement_id uuid)
RETURNS void AS $$
BEGIN
  -- This is a placeholder function
  -- Journal generation is now handled in the frontend
  RAISE NOTICE 'generate_journal called for disbursement_id: %, but journal is handled in frontend', p_disbursement_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_journal(uuid) IS 'Placeholder function - journal generation is handled in frontend';

-- Remove any trigger that validates bank in cash_disbursement
-- This error "Bank tidak boleh masuk cash_disbursement" comes from a trigger

-- Drop all possible validation triggers
DROP TRIGGER IF EXISTS validate_payment_method ON cash_disbursement;
DROP TRIGGER IF EXISTS check_payment_method ON cash_disbursement;
DROP TRIGGER IF EXISTS validate_bank_cash ON cash_disbursement;
DROP TRIGGER IF EXISTS check_bank_cash ON cash_disbursement;
DROP TRIGGER IF EXISTS prevent_bank_in_cash ON cash_disbursement;
DROP TRIGGER IF EXISTS validate_cash_only ON cash_disbursement;
DROP TRIGGER IF EXISTS enforce_cash_only ON cash_disbursement;

-- Drop all possible validation functions
DROP FUNCTION IF EXISTS validate_cash_disbursement_payment_method();
DROP FUNCTION IF EXISTS check_cash_disbursement_payment();
DROP FUNCTION IF EXISTS validate_bank_in_cash_disbursement();
DROP FUNCTION IF EXISTS prevent_bank_in_cash_disbursement();
DROP FUNCTION IF EXISTS enforce_cash_only_disbursement();

-- List all triggers on cash_disbursement and drop any that might be causing issues
DO $$
DECLARE
  trigger_rec RECORD;
BEGIN
  FOR trigger_rec IN 
    SELECT tgname 
    FROM pg_trigger 
    WHERE tgrelid = 'cash_disbursement'::regclass
    AND tgname NOT IN (
      'set_cash_disbursement_number',
      'update_cash_disbursement_timestamp',
      'auto_map_coa',
      'trigger_auto_fill_cash_disbursement_coa',
      'set_created_by_cash_disbursement'
    )
  LOOP
    EXECUTE 'DROP TRIGGER IF EXISTS ' || trigger_rec.tgname || ' ON cash_disbursement';
  END LOOP;
END $$;

-- Update constraint to allow Tunai only (remove Transfer Bank, Cek, Giro)
ALTER TABLE cash_disbursement DROP CONSTRAINT IF EXISTS cash_disbursement_payment_method_check;
ALTER TABLE cash_disbursement 
ADD CONSTRAINT cash_disbursement_payment_method_check 
CHECK (payment_method IS NULL OR payment_method IN ('Tunai', 'Cash', 'Kas'));

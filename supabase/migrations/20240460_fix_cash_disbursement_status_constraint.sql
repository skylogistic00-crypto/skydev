-- Fix cash_disbursement status constraint to allow 'draft', 'pending', 'posted', 'cancelled'
ALTER TABLE cash_disbursement DROP CONSTRAINT IF EXISTS cash_disbursement_status_check;
ALTER TABLE cash_disbursement DROP CONSTRAINT IF EXISTS cash_disbursement_payment_method_check;

-- Add proper status constraint if status column exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cash_disbursement' AND column_name = 'status') THEN
    ALTER TABLE cash_disbursement ADD CONSTRAINT cash_disbursement_status_check 
    CHECK (status IS NULL OR status IN ('draft', 'pending', 'posted', 'cancelled', 'void', 'approved'));
  END IF;
END $$;

-- Add proper payment_method constraint
ALTER TABLE cash_disbursement ADD CONSTRAINT cash_disbursement_payment_method_check 
CHECK (payment_method IS NULL OR payment_method IN ('Tunai', 'Transfer Bank', 'Cek', 'Giro', 'Transfer'));

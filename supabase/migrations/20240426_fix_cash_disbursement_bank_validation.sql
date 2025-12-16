-- Fix cash_disbursement to ONLY allow Tunai (KAS) payment method
-- Remove any trigger or constraint that blocks bank validation

-- Drop any existing validation trigger
DROP TRIGGER IF EXISTS validate_cash_disbursement_payment ON cash_disbursement;
DROP FUNCTION IF EXISTS validate_cash_disbursement_payment();

-- Drop any existing constraint on payment_method
ALTER TABLE cash_disbursement DROP CONSTRAINT IF EXISTS cash_disbursement_payment_method_check;

-- Add new constraint that ONLY allows Tunai (KAS)
ALTER TABLE cash_disbursement 
ADD CONSTRAINT cash_disbursement_payment_method_check 
CHECK (payment_method IN ('Tunai', 'Cash', 'Kas'));

-- Remove bank_account_id column if exists (cash_disbursement should not have bank)
-- Note: We keep the column but it should always be NULL for cash transactions
-- ALTER TABLE cash_disbursement DROP COLUMN IF EXISTS bank_account_id;

-- Add comment to clarify the table purpose
COMMENT ON TABLE cash_disbursement IS 'Tabel untuk mencatat pengeluaran KAS (TUNAI) perusahaan. TIDAK untuk transaksi Bank.';
COMMENT ON COLUMN cash_disbursement.payment_method IS 'Metode pembayaran: HANYA Tunai/Cash/Kas. Bank TIDAK diizinkan.';

-- Add late fee and tax fields to borrowers table
ALTER TABLE borrowers ADD COLUMN IF NOT EXISTS default_late_fee_percentage DECIMAL(5,2) DEFAULT 0.1;
ALTER TABLE borrowers ADD COLUMN IF NOT EXISTS default_tax_type VARCHAR(50);
ALTER TABLE borrowers ADD COLUMN IF NOT EXISTS default_tax_percentage DECIMAL(5,2) DEFAULT 0;

COMMENT ON COLUMN borrowers.default_late_fee_percentage IS 'Default late fee percentage per day for this borrower (e.g., 0.1 for 0.1% per day)';
COMMENT ON COLUMN borrowers.default_tax_type IS 'Default tax type for this borrower (PPh21, PPh23, PPN, etc.)';
COMMENT ON COLUMN borrowers.default_tax_percentage IS 'Default tax percentage for this borrower';

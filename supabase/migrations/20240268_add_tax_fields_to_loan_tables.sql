-- Add tax fields to loans table
ALTER TABLE loans ADD COLUMN IF NOT EXISTS tax_type VARCHAR(50);
ALTER TABLE loans ADD COLUMN IF NOT EXISTS tax_percentage DECIMAL(5,2) DEFAULT 0;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(15,2) DEFAULT 0;

COMMENT ON COLUMN loans.tax_type IS 'Type of tax (PPh21, PPh23, PPN, etc.)';
COMMENT ON COLUMN loans.tax_percentage IS 'Tax percentage applied';
COMMENT ON COLUMN loans.tax_amount IS 'Total tax amount';

-- Add tax fields to loan_installments table
ALTER TABLE loan_installments ADD COLUMN IF NOT EXISTS tax_type VARCHAR(50);
ALTER TABLE loan_installments ADD COLUMN IF NOT EXISTS tax_percentage DECIMAL(5,2) DEFAULT 0;
ALTER TABLE loan_installments ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(15,2) DEFAULT 0;

COMMENT ON COLUMN loan_installments.tax_type IS 'Type of tax applied to this installment';
COMMENT ON COLUMN loan_installments.tax_percentage IS 'Tax percentage for this installment';
COMMENT ON COLUMN loan_installments.tax_amount IS 'Tax amount for this installment';

-- Add tax fields to kas_transaksi table
ALTER TABLE kas_transaksi ADD COLUMN IF NOT EXISTS tax_type VARCHAR(50);
ALTER TABLE kas_transaksi ADD COLUMN IF NOT EXISTS tax_percentage DECIMAL(5,2) DEFAULT 0;
ALTER TABLE kas_transaksi ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(15,2) DEFAULT 0;

COMMENT ON COLUMN kas_transaksi.tax_type IS 'Type of tax (PPh21, PPh23, PPN, etc.)';
COMMENT ON COLUMN kas_transaksi.tax_percentage IS 'Tax percentage applied';
COMMENT ON COLUMN kas_transaksi.tax_amount IS 'Total tax amount';

-- Add tax fields to sales_transactions table
ALTER TABLE sales_transactions ADD COLUMN IF NOT EXISTS tax_type VARCHAR(50);
ALTER TABLE sales_transactions ADD COLUMN IF NOT EXISTS tax_percentage DECIMAL(5,2) DEFAULT 0;
ALTER TABLE sales_transactions ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(15,2) DEFAULT 0;

-- Add tax fields to purchase_transactions table (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'purchase_transactions') THEN
    ALTER TABLE purchase_transactions ADD COLUMN IF NOT EXISTS tax_type VARCHAR(50);
    ALTER TABLE purchase_transactions ADD COLUMN IF NOT EXISTS tax_percentage DECIMAL(5,2) DEFAULT 0;
    ALTER TABLE purchase_transactions ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(15,2) DEFAULT 0;
  END IF;
END $$;

-- Create function to auto-calculate tax
CREATE OR REPLACE FUNCTION calculate_tax(
  p_base_amount DECIMAL,
  p_tax_percentage DECIMAL
)
RETURNS DECIMAL AS $$
BEGIN
  IF p_tax_percentage IS NULL OR p_tax_percentage = 0 THEN
    RETURN 0;
  END IF;
  
  RETURN p_base_amount * (p_tax_percentage / 100);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-calculate tax on loan_installments
CREATE OR REPLACE FUNCTION auto_calculate_installment_tax()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tax_percentage IS NOT NULL AND NEW.tax_percentage > 0 THEN
    NEW.tax_amount := calculate_tax(
      NEW.principal_amount + NEW.interest_amount,
      NEW.tax_percentage
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_calculate_installment_tax ON loan_installments;
CREATE TRIGGER trigger_auto_calculate_installment_tax
  BEFORE INSERT OR UPDATE ON loan_installments
  FOR EACH ROW
  EXECUTE FUNCTION auto_calculate_installment_tax();

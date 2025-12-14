-- Add late fee related fields to loans table
ALTER TABLE loans ADD COLUMN IF NOT EXISTS late_fee_percentage DECIMAL(5,2) DEFAULT 0.1;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS late_fee_per_day DECIMAL(5,2) DEFAULT 0.1;

COMMENT ON COLUMN loans.late_fee_percentage IS 'Percentage of late fee per day (e.g., 0.1 for 0.1% per day)';
COMMENT ON COLUMN loans.late_fee_per_day IS 'Daily late fee percentage';

-- Add late fee fields to loan_installments table
ALTER TABLE loan_installments ADD COLUMN IF NOT EXISTS days_late INTEGER DEFAULT 0;
ALTER TABLE loan_installments ADD COLUMN IF NOT EXISTS late_fee_percentage DECIMAL(5,2) DEFAULT 0.1;
ALTER TABLE loan_installments ADD COLUMN IF NOT EXISTS actual_payment_date DATE;

COMMENT ON COLUMN loan_installments.days_late IS 'Number of days payment is late';
COMMENT ON COLUMN loan_installments.late_fee_percentage IS 'Percentage used to calculate late fee';
COMMENT ON COLUMN loan_installments.actual_payment_date IS 'Actual date when payment was made';

-- Update the calculate_late_fee function to use percentage from table
CREATE OR REPLACE FUNCTION calculate_late_fee(
  p_due_date DATE,
  p_payment_date DATE,
  p_installment_amount DECIMAL,
  p_late_fee_percentage DECIMAL DEFAULT 0.1
)
RETURNS DECIMAL AS $$
DECLARE
  v_days_late INTEGER;
  v_late_fee DECIMAL;
BEGIN
  IF p_payment_date IS NULL OR p_payment_date <= p_due_date THEN
    RETURN 0;
  END IF;
  
  v_days_late := p_payment_date - p_due_date;
  v_late_fee := p_installment_amount * (p_late_fee_percentage / 100) * v_days_late;
  
  RETURN v_late_fee;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-calculate late fee when payment is recorded
CREATE OR REPLACE FUNCTION auto_calculate_late_fee()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.actual_payment_date IS NOT NULL AND NEW.due_date IS NOT NULL THEN
    NEW.days_late := GREATEST(0, NEW.actual_payment_date - NEW.due_date);
    
    IF NEW.days_late > 0 THEN
      NEW.late_fee := calculate_late_fee(
        NEW.due_date,
        NEW.actual_payment_date,
        NEW.total_amount,
        COALESCE(NEW.late_fee_percentage, 0.1)
      );
      NEW.status := 'Terlambat';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_calculate_late_fee ON loan_installments;
CREATE TRIGGER trigger_auto_calculate_late_fee
  BEFORE INSERT OR UPDATE ON loan_installments
  FOR EACH ROW
  EXECUTE FUNCTION auto_calculate_late_fee();

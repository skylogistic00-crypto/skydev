CREATE SEQUENCE IF NOT EXISTS loans_number_seq START 1;

CREATE OR REPLACE FUNCTION generate_loan_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.loan_number IS NULL THEN
    NEW.loan_number := 'LOAN-' || TO_CHAR(NEW.loan_date, 'YYYYMMDD') || '-' || LPAD(nextval('loans_number_seq')::TEXT, 5, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_loan_number ON loans;
CREATE TRIGGER set_loan_number
  BEFORE INSERT ON loans
  FOR EACH ROW
  EXECUTE FUNCTION generate_loan_number();

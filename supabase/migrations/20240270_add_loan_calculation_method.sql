ALTER TABLE borrowers ADD COLUMN IF NOT EXISTS loan_calculation_method TEXT DEFAULT 'Anuitas' CHECK (loan_calculation_method IN ('Anuitas', 'Flat Rate'));

COMMENT ON COLUMN borrowers.loan_calculation_method IS 'Loan calculation method: Anuitas (annuity) or Flat Rate';

-- Force PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- Verify payroll table structure
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payroll' 
    AND column_name = 'absence_deduction'
  ) THEN
    ALTER TABLE payroll ADD COLUMN absence_deduction DECIMAL(15,2) DEFAULT 0;
  END IF;
END $$;

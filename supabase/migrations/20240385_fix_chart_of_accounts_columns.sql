-- Fix chart_of_accounts table structure
-- Add parent_code column if it doesn't exist with correct type

-- Drop the column if it exists with wrong type
ALTER TABLE chart_of_accounts DROP COLUMN IF EXISTS parent_code CASCADE;

-- Add parent_code with correct TEXT type
ALTER TABLE chart_of_accounts ADD COLUMN parent_code TEXT;

-- Ensure account_code is TEXT (should already be, but let's verify)
-- If it was somehow changed to timestamp, this will fix it
DO $$ 
BEGIN
  -- Check if account_code is not TEXT type
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'chart_of_accounts' 
    AND column_name = 'account_code' 
    AND data_type != 'text'
  ) THEN
    -- Drop and recreate with correct type
    ALTER TABLE chart_of_accounts DROP COLUMN account_code CASCADE;
    ALTER TABLE chart_of_accounts ADD COLUMN account_code TEXT NOT NULL UNIQUE;
  END IF;
END $$;

-- Add index for parent_code for better query performance
CREATE INDEX IF NOT EXISTS idx_coa_parent_code ON chart_of_accounts(parent_code);

-- Add foreign key constraint for parent_code referencing account_code
ALTER TABLE chart_of_accounts 
ADD CONSTRAINT fk_coa_parent_code 
FOREIGN KEY (parent_code) 
REFERENCES chart_of_accounts(account_code) 
ON DELETE SET NULL;

-- Add comments
COMMENT ON COLUMN chart_of_accounts.parent_code IS 'Kode akun parent untuk struktur hierarki COA';
COMMENT ON COLUMN chart_of_accounts.account_code IS 'Kode akun unik (format: 1-1100)';

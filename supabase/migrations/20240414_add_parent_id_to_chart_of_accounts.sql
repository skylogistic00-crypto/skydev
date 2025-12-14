-- Add parent_id column to chart_of_accounts and populate it based on parent_code

-- Step 1: Add parent_id column if it doesn't exist
ALTER TABLE chart_of_accounts 
ADD COLUMN IF NOT EXISTS parent_id UUID;

-- Step 2: Create index for better performance
CREATE INDEX IF NOT EXISTS idx_coa_parent_id ON chart_of_accounts(parent_id);

-- Step 3: Add foreign key constraint
ALTER TABLE chart_of_accounts 
DROP CONSTRAINT IF EXISTS fk_coa_parent_id;

ALTER TABLE chart_of_accounts 
ADD CONSTRAINT fk_coa_parent_id 
FOREIGN KEY (parent_id) 
REFERENCES chart_of_accounts(id) 
ON DELETE SET NULL;

-- Step 4: Populate parent_id based on parent_code
UPDATE chart_of_accounts coa1
SET parent_id = (
  SELECT coa2.id 
  FROM chart_of_accounts coa2 
  WHERE coa2.account_code = coa1.parent_code
)
WHERE coa1.parent_code IS NOT NULL;

-- Step 5: Add comment
COMMENT ON COLUMN chart_of_accounts.parent_id IS 'UUID reference to parent account based on parent_code';

-- Step 6: Create trigger to auto-update parent_id when parent_code changes
CREATE OR REPLACE FUNCTION update_parent_id_from_parent_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.parent_code IS NOT NULL THEN
    NEW.parent_id := (
      SELECT id 
      FROM chart_of_accounts 
      WHERE account_code = NEW.parent_code
    );
  ELSE
    NEW.parent_id := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_parent_id ON chart_of_accounts;

CREATE TRIGGER trg_update_parent_id
BEFORE INSERT OR UPDATE OF parent_code ON chart_of_accounts
FOR EACH ROW
EXECUTE FUNCTION update_parent_id_from_parent_code();

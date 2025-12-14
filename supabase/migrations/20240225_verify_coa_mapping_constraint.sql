-- Verify and fix the unique constraint on coa_category_mapping
-- This ensures ON CONFLICT clauses work properly

-- First, remove any duplicate rows that might prevent the constraint
DELETE FROM coa_category_mapping a
USING coa_category_mapping b
WHERE a.id > b.id
  AND a.service_category = b.service_category
  AND a.service_type = b.service_type;

-- Drop the constraint if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'coa_category_mapping_service_category_service_type_key'
  ) THEN
    ALTER TABLE coa_category_mapping 
    DROP CONSTRAINT coa_category_mapping_service_category_service_type_key;
  END IF;
END $$;

-- Recreate the unique constraint
ALTER TABLE coa_category_mapping 
ADD CONSTRAINT coa_category_mapping_service_category_service_type_key 
UNIQUE (service_category, service_type);

-- Verify the constraint exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'coa_category_mapping_service_category_service_type_key'
  ) THEN
    RAISE EXCEPTION 'Failed to create unique constraint on coa_category_mapping';
  END IF;
END $$;

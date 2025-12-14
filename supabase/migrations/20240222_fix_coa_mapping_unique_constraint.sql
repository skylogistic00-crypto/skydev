-- Ensure the unique constraint exists on coa_category_mapping
-- Drop and recreate the constraint to fix any issues

-- First, check if the constraint exists and drop it
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

-- Add the unique constraint
ALTER TABLE coa_category_mapping 
ADD CONSTRAINT coa_category_mapping_service_category_service_type_key 
UNIQUE (service_category, service_type);

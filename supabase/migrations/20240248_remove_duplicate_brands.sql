-- Remove duplicate brands, keep only the first occurrence
DELETE FROM brands a USING brands b
WHERE a.id > b.id 
AND a.brand_name = b.brand_name;

-- Add unique constraint to prevent future duplicates
ALTER TABLE brands 
ADD CONSTRAINT brands_brand_name_unique UNIQUE (brand_name);

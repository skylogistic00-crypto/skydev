-- Debug: Check and remove any problematic triggers on kas_transaksi

-- Drop any existing triggers that might have ON CONFLICT issues
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT tgname
    FROM pg_trigger
    WHERE tgrelid = 'kas_transaksi'::regclass
    AND tgname NOT LIKE 'RI_%'
    AND tgname NOT LIKE 'pg_%'
  ) LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON kas_transaksi CASCADE', r.tgname);
    RAISE NOTICE 'Dropped trigger: %', r.tgname;
  END LOOP;
END $$;

-- Ensure the table structure is correct
ALTER TABLE kas_transaksi 
  ALTER COLUMN service_category TYPE TEXT,
  ALTER COLUMN service_type TYPE TEXT;

-- Make sure there are no conflicting constraints
-- The table should NOT have a unique constraint on (service_category, service_type)
-- because multiple transactions can have the same category/type combination

-- Comprehensive cleanup of all journal_entries triggers and functions

-- 1. Drop ALL triggers on journal_entries (including system triggers that might have ON CONFLICT)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT tgname
    FROM pg_trigger
    WHERE tgrelid = 'journal_entries'::regclass
    AND tgname NOT LIKE 'RI_%'  -- Keep referential integrity triggers
    AND tgname NOT LIKE 'pg_%'  -- Keep postgres system triggers
  ) LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON journal_entries CASCADE', r.tgname);
    RAISE NOTICE 'Dropped trigger: %', r.tgname;
  END LOOP;
END $$;

-- 2. Drop ALL functions that might be related to journal_entries (only if they exist)
DO $$
BEGIN
  DROP FUNCTION IF EXISTS insert_journal_entries(JSONB) CASCADE;
  DROP FUNCTION IF EXISTS auto_post_journal_entry() CASCADE;
  DROP FUNCTION IF EXISTS create_journal_entry() CASCADE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Some functions did not exist: %', SQLERRM;
END $$;

-- 3. Recreate the insert_journal_entries function WITHOUT any ON CONFLICT
CREATE OR REPLACE FUNCTION insert_journal_entries(entries JSONB)
RETURNS void AS $$
DECLARE
  entry JSONB;
BEGIN
  FOR entry IN SELECT * FROM jsonb_array_elements(entries)
  LOOP
    INSERT INTO journal_entries (
      transaction_id,
      transaction_date,
      account_code,
      account_name,
      debit,
      credit,
      description,
      created_by,
      entry_date
    ) VALUES (
      (entry->>'transaction_id')::TEXT,
      COALESCE((entry->>'transaction_date')::DATE, CURRENT_DATE),
      COALESCE((entry->>'account_code')::TEXT, '1-1100'),
      COALESCE((entry->>'account_name')::TEXT, 'Unknown'),
      COALESCE((entry->>'debit')::DECIMAL, 0),
      COALESCE((entry->>'credit')::DECIMAL, 0),
      COALESCE((entry->>'description')::TEXT, ''),
      COALESCE((entry->>'created_by')::TEXT, 'system'),
      COALESCE((entry->>'transaction_date')::DATE, CURRENT_DATE)
    );
  END LOOP;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error inserting journal entries: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Grant execute permission
GRANT EXECUTE ON FUNCTION insert_journal_entries(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION insert_journal_entries(JSONB) TO anon;
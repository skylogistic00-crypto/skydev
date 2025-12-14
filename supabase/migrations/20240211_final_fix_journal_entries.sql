-- Drop ALL custom triggers on journal_entries
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT tgname
    FROM pg_trigger
    WHERE tgrelid = 'journal_entries'::regclass
    AND tgname LIKE 'trigger_%'
  ) LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON journal_entries CASCADE', r.tgname);
  END LOOP;
END $$;

-- Drop all related functions
DROP FUNCTION IF EXISTS sync_journal_to_general_ledger() CASCADE;

-- Recreate the RPC function with better error handling
CREATE OR REPLACE FUNCTION insert_journal_entries(entries JSONB)
RETURNS void AS $$
DECLARE
  entry JSONB;
BEGIN
  FOR entry IN SELECT * FROM jsonb_array_elements(entries)
  LOOP
    -- Simple INSERT without any ON CONFLICT
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

-- Simple fix: just recreate the RPC function without any triggers
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

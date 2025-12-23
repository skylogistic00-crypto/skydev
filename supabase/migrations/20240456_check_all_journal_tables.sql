-- Check if general_journal and general_journal_lines exist and have data

SELECT 
  table_name,
  EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = t.table_name
  ) as exists
FROM (
  VALUES 
    ('general_journal'),
    ('general_journal_lines'),
    ('journal_entries'),
    ('journal_entry_lines')
) AS t(table_name);

-- Count records in each table
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  -- general_journal
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'general_journal') THEN
    SELECT COUNT(*) INTO v_count FROM general_journal;
    RAISE NOTICE 'general_journal: % records', v_count;
  ELSE
    RAISE NOTICE 'general_journal: table does not exist';
  END IF;
  
  -- general_journal_lines
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'general_journal_lines') THEN
    SELECT COUNT(*) INTO v_count FROM general_journal_lines;
    RAISE NOTICE 'general_journal_lines: % records', v_count;
  ELSE
    RAISE NOTICE 'general_journal_lines: table does not exist';
  END IF;
END $$;

-- Sample data from general_journal_lines if exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'general_journal_lines') THEN
    EXECUTE 'SELECT account_code, account_name, debit, credit FROM general_journal_lines LIMIT 5';
  END IF;
END $$;

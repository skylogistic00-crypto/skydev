-- Check journal_entries columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'journal_entries'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if there's any data
SELECT COUNT(*) as total_entries,
       COUNT(CASE WHEN status = 'posted' THEN 1 END) as posted_entries
FROM journal_entries;

-- Sample data with types
SELECT 
  id,
  pg_typeof(id) as id_type,
  status,
  reference_number
FROM journal_entries
LIMIT 3;

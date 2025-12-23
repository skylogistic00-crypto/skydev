-- Direct query to check data

SELECT 
  'general_journal' as table_name,
  COUNT(*) as record_count
FROM general_journal
UNION ALL
SELECT 
  'general_journal_lines',
  COUNT(*)
FROM general_journal_lines
UNION ALL
SELECT 
  'journal_entries',
  COUNT(*)
FROM journal_entries
UNION ALL
SELECT 
  'journal_entry_lines',
  COUNT(*)
FROM journal_entry_lines;

-- Sample from general_journal_lines
SELECT 
  'Sample from general_journal_lines' as info,
  account_code,
  account_name,
  debit,
  credit
FROM general_journal_lines
LIMIT 10;

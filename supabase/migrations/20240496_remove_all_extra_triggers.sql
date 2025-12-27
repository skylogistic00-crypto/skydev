-- Check all triggers across key tables
SELECT 
  schemaname,
  tablename,
  t.tgname AS trigger_name,
  t.tgenabled AS enabled,
  p.proname AS function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
JOIN pg_tables tb ON t.tgrelid = tb.tablename::regclass
WHERE schemaname = 'public'
  AND tablename IN (
    'cash_disbursement', 
    'cash_receipts', 
    'journal_entries',
    'general_ledger',
    'kas_transaksi'
  )
  AND t.tgname NOT LIKE 'RI_%'  -- Exclude foreign key triggers
ORDER BY tablename, t.tgname;

-- Disable all triggers on journal_entries
DROP TRIGGER IF EXISTS trigger_sync_journal_to_gl ON journal_entries CASCADE;
DROP TRIGGER IF EXISTS trigger_update_coa_balance ON journal_entries CASCADE;
DROP TRIGGER IF EXISTS trigger_update_gl_from_journal ON journal_entries CASCADE;
DROP TRIGGER IF EXISTS trigger_journal_to_gl ON journal_entries CASCADE;

-- Disable all triggers on general_ledger
DROP TRIGGER IF EXISTS trigger_update_coa_from_gl ON general_ledger CASCADE;

-- Disable all triggers on kas_transaksi
DROP TRIGGER IF EXISTS trigger_generate_journal_from_kas ON kas_transaksi CASCADE;
DROP TRIGGER IF EXISTS trigger_create_journal_from_kas ON kas_transaksi CASCADE;

-- Keep only these triggers:
-- 1. trigger_create_journal_from_cash_disbursement on cash_disbursement
-- 2. trigger_create_journal_from_cash_receipts on cash_receipts

-- Verify remaining triggers
SELECT 
  tablename,
  t.tgname AS trigger_name,
  t.tgenabled AS enabled,
  p.proname AS function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
JOIN pg_tables tb ON t.tgrelid = tb.tablename::regclass
WHERE schemaname = 'public'
  AND tablename IN (
    'cash_disbursement', 
    'cash_receipts'
  )
  AND t.tgname NOT LIKE 'RI_%'
ORDER BY tablename, t.tgname;

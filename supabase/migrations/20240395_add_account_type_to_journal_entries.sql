-- Migration: Add account_type column to journal_entries table

ALTER TABLE journal_entries 
  ADD COLUMN IF NOT EXISTS account_type TEXT;

CREATE INDEX IF NOT EXISTS idx_journal_entries_account_type ON journal_entries(account_type);

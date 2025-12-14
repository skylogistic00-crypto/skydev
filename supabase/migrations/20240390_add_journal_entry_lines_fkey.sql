ALTER TABLE journal_entry_lines
ADD CONSTRAINT journal_entry_lines_account_code_fkey 
FOREIGN KEY (account_code) 
REFERENCES chart_of_accounts(account_code) 
ON DELETE RESTRICT 
ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_account_code_fkey 
ON journal_entry_lines(account_code);

ALTER TABLE journal_entries
ALTER COLUMN account_code TYPE text;

ALTER TABLE journal_entries
DROP CONSTRAINT IF EXISTS fk_journal_entries_account_backup;

DELETE FROM journal_entries je
WHERE NOT EXISTS (
  SELECT 1
  FROM chart_of_accounts coa
  WHERE coa.account_code = je.account_code
);

ALTER TABLE journal_entries
ADD CONSTRAINT fk_journal_entries_account
FOREIGN KEY (account_code)
REFERENCES chart_of_accounts(account_code);
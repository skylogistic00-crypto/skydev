DROP VIEW IF EXISTS journal_entries_remaining_balance CASCADE;

CREATE VIEW journal_entries_remaining_balance AS
SELECT
  je.*, 
  SUM(COALESCE(je.debit, 0) - COALESCE(je.credit, 0)) OVER (
    PARTITION BY je.account_code
    ORDER BY je.transaction_date ASC, je.created_at ASC, je.id ASC
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) AS remaining_balance
FROM journal_entries je;

GRANT SELECT ON journal_entries_remaining_balance TO authenticated;
GRANT SELECT ON journal_entries_remaining_balance TO anon;

ALTER VIEW journal_entries_remaining_balance SET (security_invoker = true);

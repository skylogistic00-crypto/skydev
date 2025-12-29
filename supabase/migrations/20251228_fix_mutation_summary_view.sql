-- Drop and recreate the view with correct columns
DROP VIEW IF EXISTS vw_mutation_summary_global;

CREATE VIEW vw_mutation_summary_global AS
SELECT
  COALESCE(SUM(debit::NUMERIC), 0) as total_in,
  COALESCE(SUM(credit::NUMERIC), 0) as total_out,
  COALESCE(SUM(debit::NUMERIC), 0) - COALESCE(SUM(credit::NUMERIC), 0) as saldo,
  COALESCE(COUNT(CASE WHEN debit::NUMERIC > 0 THEN 1 END), 0) as count_in,
  COALESCE(COUNT(CASE WHEN credit::NUMERIC > 0 THEN 1 END), 0) as count_out
FROM bank_mutations;

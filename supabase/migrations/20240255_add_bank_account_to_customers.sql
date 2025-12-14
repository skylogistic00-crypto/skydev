ALTER TABLE customers 
  ADD COLUMN IF NOT EXISTS bank_account_number TEXT,
  ADD COLUMN IF NOT EXISTS payment_term_id UUID REFERENCES payment_terms(id);

DROP VIEW IF EXISTS vw_customers;
CREATE VIEW vw_customers AS
SELECT 
  c.*,
  pt.term_name as payment_term_name,
  pt.days as payment_term_days
FROM customers c
LEFT JOIN payment_terms pt ON c.payment_term_id = pt.id;

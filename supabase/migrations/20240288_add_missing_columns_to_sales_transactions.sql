-- Add missing columns to sales_transactions table
ALTER TABLE sales_transactions 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS coa_cash_code TEXT,
ADD COLUMN IF NOT EXISTS coa_revenue_code TEXT,
ADD COLUMN IF NOT EXISTS coa_cogs_code TEXT,
ADD COLUMN IF NOT EXISTS coa_inventory_code TEXT,
ADD COLUMN IF NOT EXISTS coa_tax_code TEXT,
ADD COLUMN IF NOT EXISTS journal_ref TEXT;

COMMENT ON COLUMN sales_transactions.description IS 'Item description/variant';
COMMENT ON COLUMN sales_transactions.coa_cash_code IS 'Chart of Accounts code for cash/receivables';
COMMENT ON COLUMN sales_transactions.coa_revenue_code IS 'Chart of Accounts code for revenue';
COMMENT ON COLUMN sales_transactions.coa_cogs_code IS 'Chart of Accounts code for cost of goods sold';
COMMENT ON COLUMN sales_transactions.coa_inventory_code IS 'Chart of Accounts code for inventory';
COMMENT ON COLUMN sales_transactions.coa_tax_code IS 'Chart of Accounts code for tax payable';
COMMENT ON COLUMN sales_transactions.journal_ref IS 'Reference to journal entry';

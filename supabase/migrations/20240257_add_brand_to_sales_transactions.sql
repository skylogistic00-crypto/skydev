-- Add brand column to sales_transactions table
ALTER TABLE sales_transactions 
ADD COLUMN IF NOT EXISTS brand TEXT;

COMMENT ON COLUMN sales_transactions.brand IS 'Brand of the item sold';

-- Add ocr_id column to finance_transactions table to link with ocr_results
ALTER TABLE finance_transactions 
ADD COLUMN IF NOT EXISTS ocr_id UUID REFERENCES ocr_results(id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_finance_transactions_ocr_id ON finance_transactions(ocr_id);

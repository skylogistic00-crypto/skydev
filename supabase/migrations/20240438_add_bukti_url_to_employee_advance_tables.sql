-- Add bukti_url column to employee advance tables

-- Add bukti_url to employee_advances table
ALTER TABLE employee_advances
ADD COLUMN IF NOT EXISTS bukti_url TEXT;

-- Add bukti_url to employee_advance_settlements table (rename file_url to bukti_url for consistency)
ALTER TABLE employee_advance_settlements
ADD COLUMN IF NOT EXISTS bukti_url TEXT;

-- Add bukti_url to employee_advance_returns table
ALTER TABLE employee_advance_returns
ADD COLUMN IF NOT EXISTS bukti_url TEXT;

-- Add comments
COMMENT ON COLUMN employee_advances.bukti_url IS 'URL bukti foto transaksi pemberian uang muka';
COMMENT ON COLUMN employee_advance_settlements.bukti_url IS 'URL bukti foto struk/nota belanja';
COMMENT ON COLUMN employee_advance_returns.bukti_url IS 'URL bukti foto pengembalian uang';

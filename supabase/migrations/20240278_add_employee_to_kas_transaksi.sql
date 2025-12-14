ALTER TABLE kas_transaksi 
ADD COLUMN IF NOT EXISTS employee_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS employee_name TEXT;

CREATE INDEX IF NOT EXISTS idx_kas_transaksi_employee_id ON kas_transaksi(employee_id);

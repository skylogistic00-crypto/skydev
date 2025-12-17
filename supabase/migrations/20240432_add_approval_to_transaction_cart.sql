-- Add approval_status column to transaction_cart for bank transactions
ALTER TABLE transaction_cart ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'waiting_approval', 'approved', 'rejected'));

-- Add approved_by and approved_at columns
ALTER TABLE transaction_cart ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);
ALTER TABLE transaction_cart ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE transaction_cart ADD COLUMN IF NOT EXISTS rejected_by UUID REFERENCES auth.users(id);
ALTER TABLE transaction_cart ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ;
ALTER TABLE transaction_cart ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Add bukti column for receipt/proof upload
ALTER TABLE transaction_cart ADD COLUMN IF NOT EXISTS bukti TEXT;

-- Add account fields for journal entries
ALTER TABLE transaction_cart ADD COLUMN IF NOT EXISTS account_code TEXT;
ALTER TABLE transaction_cart ADD COLUMN IF NOT EXISTS account_name TEXT;
ALTER TABLE transaction_cart ADD COLUMN IF NOT EXISTS account_type TEXT;
ALTER TABLE transaction_cart ADD COLUMN IF NOT EXISTS credit_account_code TEXT;
ALTER TABLE transaction_cart ADD COLUMN IF NOT EXISTS credit_account_name TEXT;
ALTER TABLE transaction_cart ADD COLUMN IF NOT EXISTS credit_account_type TEXT;

-- Add employee fields
ALTER TABLE transaction_cart ADD COLUMN IF NOT EXISTS employee_id UUID;
ALTER TABLE transaction_cart ADD COLUMN IF NOT EXISTS employee_name TEXT;

-- Add loan fields
ALTER TABLE transaction_cart ADD COLUMN IF NOT EXISTS borrower_name TEXT;
ALTER TABLE transaction_cart ADD COLUMN IF NOT EXISTS loan_type TEXT;
ALTER TABLE transaction_cart ADD COLUMN IF NOT EXISTS interest_rate NUMERIC(5,2);
ALTER TABLE transaction_cart ADD COLUMN IF NOT EXISTS loan_term_months INTEGER;

-- Add expense account field
ALTER TABLE transaction_cart ADD COLUMN IF NOT EXISTS expense_account TEXT;
ALTER TABLE transaction_cart ADD COLUMN IF NOT EXISTS revenue_account TEXT;

-- Create index for approval_status
CREATE INDEX IF NOT EXISTS idx_transaction_cart_approval_status ON transaction_cart(approval_status);

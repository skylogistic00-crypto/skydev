-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expense_type TEXT NOT NULL CHECK (expense_type IN ('Entertain', 'Konsumsi', 'Meeting', 'Perjalanan Dinas')),
  description TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('Tunai', 'Transfer', 'Kartu Kredit')),
  coa_account_code TEXT NOT NULL,
  coa_account_name TEXT NOT NULL,
  department_id UUID REFERENCES departments(id),
  department_name TEXT,
  receipt_file_url TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'expenses'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE expenses;
  END IF;
END $$;

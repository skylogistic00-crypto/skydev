-- Employee Advance (Uang Muka Karyawan / Kas Bon) System
-- This migration creates the accounting logic for employee advances

-- 1. Add COA accounts for employee advances
INSERT INTO chart_of_accounts (account_code, account_name, account_type, level, is_header, normal_balance, description) VALUES
('1-1009', 'Uang Muka Karyawan', 'Aset', 2, true, 'Debit', 'Uang muka yang diberikan kepada karyawan (header)')
ON CONFLICT (account_code) DO UPDATE SET
  account_name = EXCLUDED.account_name,
  account_type = EXCLUDED.account_type,
  level = EXCLUDED.level,
  is_header = EXCLUDED.is_header,
  normal_balance = EXCLUDED.normal_balance,
  description = EXCLUDED.description,
  updated_at = NOW();

-- 2. Create table for employee advance tracking
CREATE TABLE IF NOT EXISTS employee_advances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES users(id) ON DELETE CASCADE,
  employee_name TEXT NOT NULL,
  advance_number TEXT UNIQUE NOT NULL,
  advance_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC(15,2) NOT NULL,
  coa_account_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'settled', 'partially_settled', 'returned')),
  remaining_balance NUMERIC(15,2) NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create table for advance settlements (when employee submits receipts)
CREATE TABLE IF NOT EXISTS employee_advance_settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advance_id UUID REFERENCES employee_advances(id) ON DELETE CASCADE,
  settlement_date DATE NOT NULL DEFAULT CURRENT_DATE,
  receipt_number TEXT,
  merchant TEXT,
  category TEXT,
  expense_account_code TEXT NOT NULL,
  expense_account_name TEXT,
  amount NUMERIC(15,2) NOT NULL,
  ppn NUMERIC(15,2) DEFAULT 0,
  total NUMERIC(15,2) NOT NULL,
  description TEXT,
  file_url TEXT,
  ocr_data JSONB,
  journal_entry_id UUID,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create table for advance returns (when employee returns remaining cash)
CREATE TABLE IF NOT EXISTS employee_advance_returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advance_id UUID REFERENCES employee_advances(id) ON DELETE CASCADE,
  return_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC(15,2) NOT NULL,
  payment_method TEXT DEFAULT 'Cash',
  notes TEXT,
  journal_entry_id UUID,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create function to generate advance number
CREATE OR REPLACE FUNCTION generate_advance_number()
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  year_month TEXT;
BEGIN
  year_month := TO_CHAR(CURRENT_DATE, 'YYYYMM');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(advance_number FROM 10) AS INTEGER)), 0) + 1
  INTO next_num
  FROM employee_advances
  WHERE advance_number LIKE 'ADV-' || year_month || '%';
  
  RETURN 'ADV-' || year_month || '-' || LPAD(next_num::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- 6. Create trigger to auto-generate advance number
CREATE OR REPLACE FUNCTION set_advance_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.advance_number IS NULL OR NEW.advance_number = '' THEN
    NEW.advance_number := generate_advance_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_advance_number
BEFORE INSERT ON employee_advances
FOR EACH ROW
EXECUTE FUNCTION set_advance_number();

-- 7. Create function to update advance balance
CREATE OR REPLACE FUNCTION update_advance_balance()
RETURNS TRIGGER AS $$
DECLARE
  total_settled NUMERIC(15,2);
  total_returned NUMERIC(15,2);
  advance_amount NUMERIC(15,2);
  new_balance NUMERIC(15,2);
  new_status TEXT;
BEGIN
  -- Get advance amount
  SELECT amount INTO advance_amount
  FROM employee_advances
  WHERE id = COALESCE(NEW.advance_id, OLD.advance_id);
  
  -- Calculate total settled
  SELECT COALESCE(SUM(total), 0) INTO total_settled
  FROM employee_advance_settlements
  WHERE advance_id = COALESCE(NEW.advance_id, OLD.advance_id);
  
  -- Calculate total returned
  SELECT COALESCE(SUM(amount), 0) INTO total_returned
  FROM employee_advance_returns
  WHERE advance_id = COALESCE(NEW.advance_id, OLD.advance_id);
  
  -- Calculate new balance
  new_balance := advance_amount - total_settled - total_returned;
  
  -- Determine new status
  IF new_balance = 0 THEN
    new_status := 'settled';
  ELSIF new_balance < advance_amount THEN
    new_status := 'partially_settled';
  ELSE
    new_status := 'pending';
  END IF;
  
  -- Update advance record
  UPDATE employee_advances
  SET 
    remaining_balance = new_balance,
    status = new_status,
    updated_at = NOW()
  WHERE id = COALESCE(NEW.advance_id, OLD.advance_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create triggers for balance updates
CREATE TRIGGER trigger_update_balance_on_settlement
AFTER INSERT OR UPDATE OR DELETE ON employee_advance_settlements
FOR EACH ROW
EXECUTE FUNCTION update_advance_balance();

CREATE TRIGGER trigger_update_balance_on_return
AFTER INSERT OR UPDATE OR DELETE ON employee_advance_returns
FOR EACH ROW
EXECUTE FUNCTION update_advance_balance();

-- 9. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_employee_advances_employee_id ON employee_advances(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_advances_status ON employee_advances(status);
CREATE INDEX IF NOT EXISTS idx_employee_advances_date ON employee_advances(advance_date);
CREATE INDEX IF NOT EXISTS idx_advance_settlements_advance_id ON employee_advance_settlements(advance_id);
CREATE INDEX IF NOT EXISTS idx_advance_returns_advance_id ON employee_advance_returns(advance_id);

-- 10. Enable RLS
ALTER TABLE employee_advances ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_advance_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_advance_returns ENABLE ROW LEVEL SECURITY;

-- 11. Create RLS policies
CREATE POLICY "Users can view their own advances"
ON employee_advances FOR SELECT
USING (employee_id = auth.uid() OR created_by = auth.uid());

CREATE POLICY "Finance can view all advances"
ON employee_advances FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'finance', 'accounting_staff')
  )
);

CREATE POLICY "Finance can create advances"
ON employee_advances FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'finance', 'accounting_staff')
  )
);

CREATE POLICY "Finance can update advances"
ON employee_advances FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'finance', 'accounting_staff')
  )
);

-- Settlements policies
CREATE POLICY "Users can view settlements"
ON employee_advance_settlements FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM employee_advances
    WHERE employee_advances.id = employee_advance_settlements.advance_id
    AND (employee_advances.employee_id = auth.uid() OR employee_advances.created_by = auth.uid())
  )
  OR
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'finance', 'accounting_staff')
  )
);

CREATE POLICY "Users can create settlements"
ON employee_advance_settlements FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM employee_advances
    WHERE employee_advances.id = employee_advance_settlements.advance_id
    AND employee_advances.employee_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'finance', 'accounting_staff')
  )
);

-- Returns policies
CREATE POLICY "Users can view returns"
ON employee_advance_returns FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM employee_advances
    WHERE employee_advances.id = employee_advance_returns.advance_id
    AND (employee_advances.employee_id = auth.uid() OR employee_advances.created_by = auth.uid())
  )
  OR
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'finance', 'accounting_staff')
  )
);

CREATE POLICY "Users can create returns"
ON employee_advance_returns FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM employee_advances
    WHERE employee_advances.id = employee_advance_returns.advance_id
    AND employee_advances.employee_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'finance', 'accounting_staff')
  )
);

-- 12. Create view for advance summary
CREATE OR REPLACE VIEW vw_employee_advance_summary AS
SELECT 
  ea.id,
  ea.advance_number,
  ea.employee_id,
  ea.employee_name,
  ea.advance_date,
  ea.amount as advance_amount,
  ea.remaining_balance,
  ea.status,
  ea.coa_account_code,
  COALESCE(SUM(eas.total), 0) as total_settled,
  COALESCE(SUM(ear.amount), 0) as total_returned,
  COUNT(DISTINCT eas.id) as settlement_count,
  COUNT(DISTINCT ear.id) as return_count,
  ea.created_at,
  ea.updated_at
FROM employee_advances ea
LEFT JOIN employee_advance_settlements eas ON ea.id = eas.advance_id
LEFT JOIN employee_advance_returns ear ON ea.id = ear.advance_id
GROUP BY ea.id, ea.advance_number, ea.employee_id, ea.employee_name, 
         ea.advance_date, ea.amount, ea.remaining_balance, ea.status, 
         ea.coa_account_code, ea.created_at, ea.updated_at;

-- 13. Add comments
COMMENT ON TABLE employee_advances IS 'Tracks employee cash advances (uang muka karyawan)';
COMMENT ON TABLE employee_advance_settlements IS 'Records when employees submit receipts to settle advances';
COMMENT ON TABLE employee_advance_returns IS 'Records when employees return unused advance money';
COMMENT ON COLUMN employee_advances.coa_account_code IS 'Dynamic COA account code for this employee (e.g., 1-1009-001 for Febri)';
COMMENT ON COLUMN employee_advances.remaining_balance IS 'Amount not yet settled or returned';

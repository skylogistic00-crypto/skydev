-- Refresh payroll table schema to ensure all columns are recognized
-- This migration ensures the schema cache is updated

-- Drop and recreate the payroll table with all required columns
DROP TABLE IF EXISTS payroll CASCADE;

CREATE TABLE payroll (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  period_month INTEGER NOT NULL CHECK (period_month >= 1 AND period_month <= 12),
  period_year INTEGER NOT NULL,
  
  -- Earnings
  basic_salary DECIMAL(15,2) NOT NULL,
  transport_allowance DECIMAL(15,2) DEFAULT 0,
  meal_allowance DECIMAL(15,2) DEFAULT 0,
  position_allowance DECIMAL(15,2) DEFAULT 0,
  other_allowances JSONB,
  
  -- Overtime
  overtime_hours DECIMAL(5,2) DEFAULT 0,
  overtime_pay DECIMAL(15,2) DEFAULT 0,
  
  -- Deductions
  late_deduction DECIMAL(15,2) DEFAULT 0,
  absence_deduction DECIMAL(15,2) DEFAULT 0,
  loan_deduction DECIMAL(15,2) DEFAULT 0,
  bpjs_kesehatan_deduction DECIMAL(15,2) DEFAULT 0,
  bpjs_ketenagakerjaan_deduction DECIMAL(15,2) DEFAULT 0,
  other_deductions JSONB,
  
  -- Tax
  tax_pph21 DECIMAL(15,2) DEFAULT 0,
  
  -- Totals
  gross_salary DECIMAL(15,2) NOT NULL,
  total_deductions DECIMAL(15,2) NOT NULL,
  net_salary DECIMAL(15,2) NOT NULL,
  
  -- Payment Info
  payment_date DATE,
  payment_method TEXT CHECK (payment_method IN ('transfer', 'cash', 'check')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'cancelled')),
  
  notes TEXT,
  slip_file_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(employee_id, period_month, period_year)
);

-- Enable RLS
ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view payroll"
  ON payroll FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.id = payroll.employee_id
      AND e.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'hr_manager', 'hr_staff')
    )
  );

CREATE POLICY "HR can insert payroll"
  ON payroll FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'hr_manager', 'hr_staff')
    )
  );

CREATE POLICY "HR can update payroll"
  ON payroll FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'hr_manager', 'hr_staff')
    )
  );

CREATE POLICY "HR can delete payroll"
  ON payroll FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'hr_manager')
    )
  );

-- Create indexes
CREATE INDEX idx_payroll_employee ON payroll(employee_id);
CREATE INDEX idx_payroll_period ON payroll(period_year, period_month);
CREATE INDEX idx_payroll_status ON payroll(payment_status);

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';

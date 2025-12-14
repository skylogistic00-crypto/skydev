-- Drop existing tables if needed (optional, comment out if you want to keep existing data)
-- DROP TABLE IF EXISTS performance_reviews CASCADE;
-- DROP TABLE IF EXISTS payroll CASCADE;
-- DROP TABLE IF EXISTS leave_requests CASCADE;
-- DROP TABLE IF EXISTS leave_balance CASCADE;
-- DROP TABLE IF EXISTS leave_types CASCADE;
-- DROP TABLE IF EXISTS attendance CASCADE;
-- DROP TABLE IF EXISTS employment_contracts CASCADE;
-- DROP TABLE IF EXISTS employees CASCADE;
-- DROP TABLE IF EXISTS positions CASCADE;
-- DROP TABLE IF EXISTS departments CASCADE;

-- Departments Table
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_name TEXT NOT NULL UNIQUE,
  description TEXT,
  head_of_department UUID REFERENCES users(id),
  budget DECIMAL(15,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Positions/Jabatan Table
CREATE TABLE IF NOT EXISTS positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position_name TEXT NOT NULL,
  department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
  level TEXT,
  min_salary DECIMAL(15,2),
  max_salary DECIMAL(15,2),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employees Table (Extended)
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  employee_number TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  birth_date DATE,
  birth_place TEXT,
  gender TEXT CHECK (gender IN ('Laki-laki', 'Perempuan')),
  religion TEXT,
  marital_status TEXT CHECK (marital_status IN ('Belum Menikah', 'Menikah', 'Cerai')),
  address TEXT,
  city TEXT,
  province TEXT,
  postal_code TEXT,
  
  -- Identity Documents
  ktp_number TEXT,
  ktp_file_url TEXT,
  npwp_number TEXT,
  npwp_file_url TEXT,
  bpjs_kesehatan TEXT,
  bpjs_ketenagakerjaan TEXT,
  
  -- Employment Info
  department_id UUID REFERENCES departments(id),
  position_id UUID REFERENCES positions(id),
  employment_status TEXT CHECK (employment_status IN ('Tetap', 'Kontrak', 'Magang', 'Freelance', 'Probation')),
  join_date DATE NOT NULL,
  end_date DATE,
  resign_date DATE,
  
  -- Salary & Bank
  basic_salary DECIMAL(15,2),
  bank_name TEXT,
  bank_account_number TEXT,
  bank_account_holder TEXT,
  
  -- Emergency Contact
  emergency_contact_name TEXT,
  emergency_contact_relation TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_address TEXT,
  
  -- Education
  last_education TEXT,
  institution_name TEXT,
  major TEXT,
  graduation_year INTEGER,
  
  -- Files
  photo_url TEXT,
  cv_file_url TEXT,
  contract_file_url TEXT,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated', 'resigned')),
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employment Contracts Table
CREATE TABLE IF NOT EXISTS employment_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  contract_number TEXT UNIQUE NOT NULL,
  contract_type TEXT CHECK (contract_type IN ('PKWT', 'PKWTT', 'Magang', 'Freelance', 'Probation')),
  start_date DATE NOT NULL,
  end_date DATE,
  basic_salary DECIMAL(15,2),
  allowances JSONB,
  benefits TEXT,
  terms TEXT,
  contract_file_url TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'terminated', 'renewed')),
  created_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attendance Table
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  clock_in TIMESTAMPTZ,
  clock_out TIMESTAMPTZ,
  clock_in_location TEXT,
  clock_out_location TEXT,
  clock_in_photo_url TEXT,
  clock_out_photo_url TEXT,
  work_hours DECIMAL(5,2),
  overtime_hours DECIMAL(5,2) DEFAULT 0,
  status TEXT CHECK (status IN ('present', 'late', 'absent', 'leave', 'sick', 'permission', 'holiday', 'remote')),
  notes TEXT,
  approved_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, attendance_date)
);

-- Leave Types Table
CREATE TABLE IF NOT EXISTS leave_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leave_name TEXT NOT NULL UNIQUE,
  max_days INTEGER,
  requires_approval BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add new columns to leave_types if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leave_types' AND column_name='requires_document') THEN
    ALTER TABLE leave_types ADD COLUMN requires_document BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leave_types' AND column_name='is_paid') THEN
    ALTER TABLE leave_types ADD COLUMN is_paid BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Leave Requests Table
CREATE TABLE IF NOT EXISTS leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  leave_type_id UUID REFERENCES leave_types(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days INTEGER NOT NULL,
  reason TEXT,
  document_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leave Balance Table
CREATE TABLE IF NOT EXISTS leave_balance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  leave_type_id UUID REFERENCES leave_types(id),
  year INTEGER NOT NULL,
  total_days INTEGER NOT NULL,
  used_days INTEGER DEFAULT 0,
  remaining_days INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, leave_type_id, year)
);

-- Payroll Table
CREATE TABLE IF NOT EXISTS payroll (
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
  created_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, period_month, period_year)
);

-- Performance Reviews Table
CREATE TABLE IF NOT EXISTS performance_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES users(id),
  review_period_start DATE NOT NULL,
  review_period_end DATE NOT NULL,
  review_date DATE NOT NULL,
  
  -- Ratings (1-5 scale)
  quality_of_work DECIMAL(3,2) CHECK (quality_of_work >= 0 AND quality_of_work <= 5),
  productivity DECIMAL(3,2) CHECK (productivity >= 0 AND productivity <= 5),
  communication DECIMAL(3,2) CHECK (communication >= 0 AND communication <= 5),
  teamwork DECIMAL(3,2) CHECK (teamwork >= 0 AND teamwork <= 5),
  initiative DECIMAL(3,2) CHECK (initiative >= 0 AND initiative <= 5),
  leadership DECIMAL(3,2) CHECK (leadership >= 0 AND leadership <= 5),
  problem_solving DECIMAL(3,2) CHECK (problem_solving >= 0 AND problem_solving <= 5),
  attendance_punctuality DECIMAL(3,2) CHECK (attendance_punctuality >= 0 AND attendance_punctuality <= 5),
  
  overall_rating DECIMAL(3,2) CHECK (overall_rating >= 0 AND overall_rating <= 5),
  
  -- Feedback
  strengths TEXT,
  areas_for_improvement TEXT,
  achievements TEXT,
  goals TEXT,
  training_needs TEXT,
  comments TEXT,
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'acknowledged', 'completed')),
  employee_comments TEXT,
  acknowledged_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Training & Development Table
CREATE TABLE IF NOT EXISTS employee_training (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  training_name TEXT NOT NULL,
  training_type TEXT CHECK (training_type IN ('internal', 'external', 'online', 'certification')),
  provider TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  duration_hours INTEGER,
  cost DECIMAL(15,2),
  status TEXT CHECK (status IN ('planned', 'ongoing', 'completed', 'cancelled')),
  certificate_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employee Documents Table
CREATE TABLE IF NOT EXISTS employee_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  document_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  uploaded_by UUID REFERENCES users(id),
  expiry_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default leave types
INSERT INTO leave_types (leave_name, max_days, requires_approval, requires_document, is_paid, description)
SELECT 'Cuti Tahunan', 12, true, false, true, 'Cuti tahunan karyawan sesuai peraturan'
WHERE NOT EXISTS (SELECT 1 FROM leave_types WHERE leave_name = 'Cuti Tahunan')
UNION ALL
SELECT 'Cuti Sakit', 30, true, true, true, 'Cuti karena sakit dengan surat dokter'
WHERE NOT EXISTS (SELECT 1 FROM leave_types WHERE leave_name = 'Cuti Sakit')
UNION ALL
SELECT 'Izin', 3, true, false, false, 'Izin tidak masuk kerja'
WHERE NOT EXISTS (SELECT 1 FROM leave_types WHERE leave_name = 'Izin')
UNION ALL
SELECT 'Cuti Melahirkan', 90, true, true, true, 'Cuti melahirkan untuk karyawan perempuan'
WHERE NOT EXISTS (SELECT 1 FROM leave_types WHERE leave_name = 'Cuti Melahirkan')
UNION ALL
SELECT 'Cuti Menikah', 3, true, false, true, 'Cuti untuk menikah'
WHERE NOT EXISTS (SELECT 1 FROM leave_types WHERE leave_name = 'Cuti Menikah')
UNION ALL
SELECT 'Cuti Kematian', 2, true, false, true, 'Cuti karena kematian keluarga dekat'
WHERE NOT EXISTS (SELECT 1 FROM leave_types WHERE leave_name = 'Cuti Kematian')
UNION ALL
SELECT 'Cuti Haji/Umroh', 40, true, true, false, 'Cuti untuk ibadah haji atau umroh'
WHERE NOT EXISTS (SELECT 1 FROM leave_types WHERE leave_name = 'Cuti Haji/Umroh');

-- Enable RLS
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE employment_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balance ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_training ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_documents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all for authenticated users" ON departments;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON positions;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON employees;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON employment_contracts;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON attendance;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON leave_types;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON leave_requests;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON leave_balance;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON payroll;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON performance_reviews;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON employee_training;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON employee_documents;

-- RLS Policies (Allow authenticated users to read/write)
CREATE POLICY "Allow all for authenticated users" ON departments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON positions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON employees FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON employment_contracts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON attendance FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON leave_types FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON leave_requests FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON leave_balance FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON payroll FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON performance_reviews FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON employee_training FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON employee_documents FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Function to generate employee number
CREATE OR REPLACE FUNCTION generate_employee_number()
RETURNS TEXT AS $$
DECLARE
  next_number INTEGER;
  employee_number TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(employee_number FROM 4) AS INTEGER)), 0) + 1
  INTO next_number
  FROM employees
  WHERE employee_number ~ '^EMP[0-9]+$';
  
  employee_number := 'EMP' || LPAD(next_number::TEXT, 5, '0');
  RETURN employee_number;
END;
$$ LANGUAGE plpgsql;

-- Function to generate contract number
CREATE OR REPLACE FUNCTION generate_contract_number()
RETURNS TEXT AS $$
DECLARE
  next_number INTEGER;
  contract_number TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(contract_number FROM 5) AS INTEGER)), 0) + 1
  INTO next_number
  FROM employment_contracts
  WHERE contract_number ~ '^CNT[0-9]+$';
  
  contract_number := 'CNT' || LPAD(next_number::TEXT, 5, '0');
  RETURN contract_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger to calculate work hours
CREATE OR REPLACE FUNCTION calculate_work_hours()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.clock_in IS NOT NULL AND NEW.clock_out IS NOT NULL THEN
    NEW.work_hours := EXTRACT(EPOCH FROM (NEW.clock_out - NEW.clock_in)) / 3600;
    
    -- Calculate overtime (if work_hours > 8)
    IF NEW.work_hours > 8 THEN
      NEW.overtime_hours := NEW.work_hours - 8;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS attendance_work_hours_trigger ON attendance;
CREATE TRIGGER attendance_work_hours_trigger
BEFORE INSERT OR UPDATE ON attendance
FOR EACH ROW
EXECUTE FUNCTION calculate_work_hours();

-- Function to update leave balance
CREATE OR REPLACE FUNCTION update_leave_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD IS NULL OR OLD.status != 'approved') THEN
    UPDATE leave_balance
    SET used_days = used_days + NEW.total_days,
        remaining_days = total_days - (used_days + NEW.total_days),
        updated_at = NOW()
    WHERE employee_id = NEW.employee_id 
      AND leave_type_id = NEW.leave_type_id
      AND year = EXTRACT(YEAR FROM NEW.start_date);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS leave_balance_update_trigger ON leave_requests;
CREATE TRIGGER leave_balance_update_trigger
AFTER INSERT OR UPDATE ON leave_requests
FOR EACH ROW
EXECUTE FUNCTION update_leave_balance();

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables
DROP TRIGGER IF EXISTS update_departments_updated_at ON departments;
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_positions_updated_at ON positions;
CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON positions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_employees_updated_at ON employees;
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_contracts_updated_at ON employment_contracts;
CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON employment_contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_attendance_updated_at ON attendance;
CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON attendance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_leave_requests_updated_at ON leave_requests;
CREATE TRIGGER update_leave_requests_updated_at BEFORE UPDATE ON leave_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payroll_updated_at ON payroll;
CREATE TRIGGER update_payroll_updated_at BEFORE UPDATE ON payroll FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_performance_reviews_updated_at ON performance_reviews;
CREATE TRIGGER update_performance_reviews_updated_at BEFORE UPDATE ON performance_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

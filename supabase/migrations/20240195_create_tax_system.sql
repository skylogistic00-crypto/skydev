CREATE TABLE IF NOT EXISTS tax_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type TEXT NOT NULL CHECK (report_type IN ('Pajak Masukan', 'Pajak Keluaran', 'SPT Masa PPN', 'SPT Tahunan')),
  period_month INTEGER NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  period_year INTEGER NOT NULL,
  total_dpp DECIMAL(15,2) DEFAULT 0,
  total_ppn DECIMAL(15,2) DEFAULT 0,
  total_pph DECIMAL(15,2) DEFAULT 0,
  status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft', 'Submitted', 'Approved')),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS coretax_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  upload_date TIMESTAMPTZ DEFAULT NOW(),
  period_month INTEGER NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  period_year INTEGER NOT NULL,
  status TEXT DEFAULT 'Uploaded' CHECK (status IN ('Uploaded', 'Processing', 'Completed', 'Failed')),
  notes TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tax_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('SPT Masa PPN', 'SPT Tahunan', 'Pajak Masukan', 'Pajak Keluaran')),
  due_date DATE NOT NULL,
  period_month INTEGER CHECK (period_month BETWEEN 1 AND 12),
  period_year INTEGER NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tax_reports_period ON tax_reports(period_year, period_month);
CREATE INDEX idx_tax_reports_type ON tax_reports(report_type);
CREATE INDEX idx_coretax_uploads_period ON coretax_uploads(period_year, period_month);
CREATE INDEX idx_tax_reminders_due_date ON tax_reminders(due_date);
CREATE INDEX idx_tax_reminders_completed ON tax_reminders(is_completed);

ALTER PUBLICATION supabase_realtime ADD TABLE tax_reports;
ALTER PUBLICATION supabase_realtime ADD TABLE coretax_uploads;
ALTER PUBLICATION supabase_realtime ADD TABLE tax_reminders;

CREATE OR REPLACE FUNCTION create_monthly_tax_reminders()
RETURNS void AS $$
DECLARE
  current_year INTEGER := EXTRACT(YEAR FROM CURRENT_DATE);
  current_month INTEGER := EXTRACT(MONTH FROM CURRENT_DATE);
  next_month INTEGER;
  next_year INTEGER;
BEGIN
  IF current_month = 12 THEN
    next_month := 1;
    next_year := current_year + 1;
  ELSE
    next_month := current_month + 1;
    next_year := current_year;
  END IF;
  
  INSERT INTO tax_reminders (reminder_type, due_date, period_month, period_year, notes)
  VALUES 
    ('SPT Masa PPN', 
     DATE(next_year || '-' || next_month || '-20'), 
     current_month, 
     current_year, 
     'Batas pelaporan SPT Masa PPN tanggal 20 bulan berikutnya')
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

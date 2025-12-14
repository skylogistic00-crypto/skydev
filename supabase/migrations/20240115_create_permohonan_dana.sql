CREATE TABLE IF NOT EXISTS permohonan_dana (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_pemohon TEXT NOT NULL,
  departemen TEXT NOT NULL,
  tanggal_permohonan DATE NOT NULL,
  jumlah DECIMAL(15,2) NOT NULL,
  keterangan TEXT,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'PAID')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  permohonan_dana_id UUID REFERENCES permohonan_dana(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  account_name TEXT NOT NULL,
  debit DECIMAL(15,2) DEFAULT 0,
  credit DECIMAL(15,2) DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE permohonan_dana ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations on permohonan_dana" ON permohonan_dana;
CREATE POLICY "Allow all operations on permohonan_dana"
ON permohonan_dana FOR ALL
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations on journal_entries" ON journal_entries;
CREATE POLICY "Allow all operations on journal_entries"
ON journal_entries FOR ALL
USING (true)
WITH CHECK (true);

alter publication supabase_realtime add table permohonan_dana;
alter publication supabase_realtime add table journal_entries;

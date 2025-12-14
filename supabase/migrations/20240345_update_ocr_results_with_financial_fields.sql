ALTER TABLE ocr_results ADD COLUMN IF NOT EXISTS file_path TEXT;
ALTER TABLE ocr_results ADD COLUMN IF NOT EXISTS nominal NUMERIC(15,2);
ALTER TABLE ocr_results ADD COLUMN IF NOT EXISTS tanggal DATE;
ALTER TABLE ocr_results ADD COLUMN IF NOT EXISTS supplier TEXT;
ALTER TABLE ocr_results ADD COLUMN IF NOT EXISTS invoice TEXT;
ALTER TABLE ocr_results ADD COLUMN IF NOT EXISTS nama_karyawan TEXT;
ALTER TABLE ocr_results ADD COLUMN IF NOT EXISTS deskripsi TEXT;
ALTER TABLE ocr_results ADD COLUMN IF NOT EXISTS autofill_status TEXT DEFAULT 'pending';

CREATE OR REPLACE FUNCTION ensure_financial_columns()
RETURNS void AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ocr_results' AND column_name = 'nominal') THEN
        ALTER TABLE ocr_results ADD COLUMN nominal NUMERIC(15,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ocr_results' AND column_name = 'tanggal') THEN
        ALTER TABLE ocr_results ADD COLUMN tanggal DATE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ocr_results' AND column_name = 'supplier') THEN
        ALTER TABLE ocr_results ADD COLUMN supplier TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ocr_results' AND column_name = 'invoice') THEN
        ALTER TABLE ocr_results ADD COLUMN invoice TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ocr_results' AND column_name = 'nama_karyawan') THEN
        ALTER TABLE ocr_results ADD COLUMN nama_karyawan TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ocr_results' AND column_name = 'deskripsi') THEN
        ALTER TABLE ocr_results ADD COLUMN deskripsi TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ocr_results' AND column_name = 'file_path') THEN
        ALTER TABLE ocr_results ADD COLUMN file_path TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ocr_results' AND column_name = 'autofill_status') THEN
        ALTER TABLE ocr_results ADD COLUMN autofill_status TEXT DEFAULT 'pending';
    END IF;
END;
$$ LANGUAGE plpgsql;

SELECT ensure_financial_columns();

INSERT INTO storage.buckets (id, name, public)
VALUES ('ocr_uploads', 'ocr_uploads', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Allow public uploads to ocr_uploads" ON storage.objects;
CREATE POLICY "Allow public uploads to ocr_uploads" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'ocr_uploads');

DROP POLICY IF EXISTS "Allow public read from ocr_uploads" ON storage.objects;
CREATE POLICY "Allow public read from ocr_uploads" ON storage.objects
    FOR SELECT USING (bucket_id = 'ocr_uploads');

DROP POLICY IF EXISTS "Allow public delete from ocr_uploads" ON storage.objects;
CREATE POLICY "Allow public delete from ocr_uploads" ON storage.objects
    FOR DELETE USING (bucket_id = 'ocr_uploads');

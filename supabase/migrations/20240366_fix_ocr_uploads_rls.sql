-- Create ocr_uploads bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('ocr_uploads', 'ocr_uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow public uploads to ocr_uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read from ocr_uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public delete from ocr_uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to ocr_uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated read from ocr_uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete from ocr_uploads" ON storage.objects;

-- Create policy for authenticated users to upload
CREATE POLICY "Allow authenticated uploads to ocr_uploads" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'ocr_uploads');

-- Create policy for authenticated users to read
CREATE POLICY "Allow authenticated read from ocr_uploads" ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = 'ocr_uploads');

-- Create policy for authenticated users to delete
CREATE POLICY "Allow authenticated delete from ocr_uploads" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'ocr_uploads');

-- Also allow anon users (for public access if needed)
CREATE POLICY "Allow public uploads to ocr_uploads" ON storage.objects
    FOR INSERT TO anon
    WITH CHECK (bucket_id = 'ocr_uploads');

CREATE POLICY "Allow public read from ocr_uploads" ON storage.objects
    FOR SELECT TO anon
    USING (bucket_id = 'ocr_uploads');

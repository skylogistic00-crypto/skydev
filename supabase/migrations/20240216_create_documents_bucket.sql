INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Allow authenticated users to upload documents" ON storage.objects;
CREATE POLICY "Allow authenticated users to upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');

DROP POLICY IF EXISTS "Allow public to read documents" ON storage.objects;
CREATE POLICY "Allow public to read documents"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'documents');

DROP POLICY IF EXISTS "Allow authenticated users to update documents" ON storage.objects;
CREATE POLICY "Allow authenticated users to update documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'documents');

DROP POLICY IF EXISTS "Allow authenticated users to delete documents" ON storage.objects;
CREATE POLICY "Allow authenticated users to delete documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'documents');

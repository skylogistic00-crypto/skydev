INSERT INTO storage.buckets (id, name, public)
VALUES ('purchase-items', 'purchase-items', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Allow authenticated users to upload" ON storage.objects;
CREATE POLICY "Allow authenticated users to upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'purchase-items');

DROP POLICY IF EXISTS "Allow public to view" ON storage.objects;
CREATE POLICY "Allow public to view"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'purchase-items');

DROP POLICY IF EXISTS "Allow users to update own files" ON storage.objects;
CREATE POLICY "Allow users to update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'purchase-items');

DROP POLICY IF EXISTS "Allow users to delete own files" ON storage.objects;
CREATE POLICY "Allow users to delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'purchase-items');
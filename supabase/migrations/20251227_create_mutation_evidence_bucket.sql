INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'mutation-evidence',
  'mutation-evidence',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Allow public read mutation evidence" ON storage.objects;
CREATE POLICY "Allow public read mutation evidence"
ON storage.objects FOR SELECT
USING (bucket_id = 'mutation-evidence');

DROP POLICY IF EXISTS "Allow authenticated upload mutation evidence" ON storage.objects;
CREATE POLICY "Allow authenticated upload mutation evidence"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'mutation-evidence' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated update mutation evidence" ON storage.objects;
CREATE POLICY "Allow authenticated update mutation evidence"
ON storage.objects FOR UPDATE
USING (bucket_id = 'mutation-evidence' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated delete mutation evidence" ON storage.objects;
CREATE POLICY "Allow authenticated delete mutation evidence"
ON storage.objects FOR DELETE
USING (bucket_id = 'mutation-evidence' AND auth.role() = 'authenticated');

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('stnk-documents', 'stnk-documents', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']),
  ('vehicle-photos', 'vehicle-photos', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/jpg'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Allow public read access to STNK documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'stnk-documents');

CREATE POLICY "Allow authenticated users to upload STNK documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'stnk-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Allow users to update their own STNK documents"
ON storage.objects FOR UPDATE
USING (bucket_id = 'stnk-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Allow users to delete their own STNK documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'stnk-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Allow public read access to vehicle photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'vehicle-photos');

CREATE POLICY "Allow authenticated users to upload vehicle photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'vehicle-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Allow users to update their own vehicle photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'vehicle-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Allow users to delete their own vehicle photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'vehicle-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

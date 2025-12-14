-- Create storage bucket for employee documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('employee-documents', 'employee-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies
CREATE POLICY "Allow authenticated users to upload employee documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'employee-documents');

CREATE POLICY "Allow authenticated users to read employee documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'employee-documents');

CREATE POLICY "Allow authenticated users to update employee documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'employee-documents');

CREATE POLICY "Allow authenticated users to delete employee documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'employee-documents');

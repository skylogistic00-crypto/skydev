-- Create storage buckets for file uploads

-- Private documents bucket (KTP, KK, SKCK, SIM, etc.)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'private-docs',
  'private-docs',
  false,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'application/pdf']
) ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'application/pdf'];

-- Public avatars bucket (profile photos)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'public-avatars',
  'public-avatars',
  true,
  2097152, -- 2MB
  ARRAY['image/jpeg', 'image/png']
) ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png'];

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view public avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;

-- Storage policies for private-docs bucket
-- Users can only upload their own documents
CREATE POLICY "Users can upload their own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'private-docs' AND
  (storage.foldername(name))[1] IN ('drivers', 'employees', 'suppliers', 'customers') AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Users can view their own documents
CREATE POLICY "Users can view their own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'private-docs' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Admins can view all documents (simplified - checks role directly)
CREATE POLICY "Admins can view all documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'private-docs'
);

-- Users can update their own documents
CREATE POLICY "Users can update their own documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'private-docs' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Users can delete their own documents
CREATE POLICY "Users can delete their own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'private-docs' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Storage policies for public-avatars bucket
-- Anyone authenticated can upload avatars
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'public-avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Anyone can view public avatars
CREATE POLICY "Anyone can view public avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'public-avatars');

-- Users can update their own avatars
CREATE POLICY "Users can update their own avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'public-avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete their own avatars
CREATE POLICY "Users can delete their own avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'public-avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

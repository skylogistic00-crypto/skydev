-- Fix storage bucket policies for ocr-receipts

-- Ensure bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('ocr-receipts', 'ocr-receipts', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to upload" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to read" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated upload to ocr-receipts" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read from ocr-receipts" ON storage.objects;

-- Create policy to allow authenticated users to upload to ocr-receipts
CREATE POLICY "Allow authenticated upload to ocr-receipts"
ON storage.objects
FOR INSERT
TO authenticated, anon
WITH CHECK (bucket_id = 'ocr-receipts');

-- Create policy to allow public read from ocr-receipts
CREATE POLICY "Allow public read from ocr-receipts"
ON storage.objects
FOR SELECT
TO authenticated, anon, public
USING (bucket_id = 'ocr-receipts');

-- Create policy to allow authenticated users to update in ocr-receipts
CREATE POLICY "Allow authenticated update in ocr-receipts"
ON storage.objects
FOR UPDATE
TO authenticated, anon
USING (bucket_id = 'ocr-receipts')
WITH CHECK (bucket_id = 'ocr-receipts');

-- Create policy to allow authenticated users to delete from ocr-receipts
CREATE POLICY "Allow authenticated delete from ocr-receipts"
ON storage.objects
FOR DELETE
TO authenticated, anon
USING (bucket_id = 'ocr-receipts');

-- Create storage bucket for OCR receipt uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ocr-receipts',
  'ocr-receipts',
  false,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf'];

-- Create storage policies for ocr-receipts bucket
DROP POLICY IF EXISTS "Users can upload to ocr-receipts" ON storage.objects;
CREATE POLICY "Users can upload to ocr-receipts"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'ocr-receipts' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can view ocr-receipts" ON storage.objects;
CREATE POLICY "Users can view ocr-receipts"
ON storage.objects FOR SELECT
USING (bucket_id = 'ocr-receipts' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can delete their ocr-receipts" ON storage.objects;
CREATE POLICY "Users can delete their ocr-receipts"
ON storage.objects FOR DELETE
USING (bucket_id = 'ocr-receipts' AND auth.role() = 'authenticated');

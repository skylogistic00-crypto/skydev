-- Update ocr-receipts bucket to allow PDF files
UPDATE storage.buckets
SET allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf']
WHERE id = 'ocr-receipts';

INSERT INTO storage.buckets (id, name, public)
VALUES ('ocr-receipts', 'ocr-receipts', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('mutation-evidence', 'mutation-evidence', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read ocr-receipts" ON storage.objects;
CREATE POLICY "Public read ocr-receipts"
ON storage.objects
FOR SELECT
USING (bucket_id = 'ocr-receipts');

DROP POLICY IF EXISTS "Public read mutation-evidence" ON storage.objects;
CREATE POLICY "Public read mutation-evidence"
ON storage.objects
FOR SELECT
USING (bucket_id = 'mutation-evidence');

DROP POLICY IF EXISTS "Authenticated upload ocr-receipts" ON storage.objects;
CREATE POLICY "Authenticated upload ocr-receipts"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'ocr-receipts');

DROP POLICY IF EXISTS "Authenticated upload mutation-evidence" ON storage.objects;
CREATE POLICY "Authenticated upload mutation-evidence"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'mutation-evidence');

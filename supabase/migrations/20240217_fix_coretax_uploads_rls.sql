ALTER TABLE coretax_uploads RENAME COLUMN upload_date TO uploaded_at;

ALTER TABLE coretax_uploads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users to view coretax uploads" ON coretax_uploads;
CREATE POLICY "Allow authenticated users to view coretax uploads"
ON coretax_uploads FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert coretax uploads" ON coretax_uploads;
CREATE POLICY "Allow authenticated users to insert coretax uploads"
ON coretax_uploads FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to update coretax uploads" ON coretax_uploads;
CREATE POLICY "Allow authenticated users to update coretax uploads"
ON coretax_uploads FOR UPDATE
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to delete coretax uploads" ON coretax_uploads;
CREATE POLICY "Allow authenticated users to delete coretax uploads"
ON coretax_uploads FOR DELETE
TO authenticated
USING (true);

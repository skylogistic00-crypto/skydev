CREATE TABLE IF NOT EXISTS ocr_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_url TEXT,
    ocr_data JSONB,
    extracted_text TEXT,
    json_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ocr_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations on ocr_results" ON ocr_results;
CREATE POLICY "Allow all operations on ocr_results" ON ocr_results
    FOR ALL USING (true) WITH CHECK (true);

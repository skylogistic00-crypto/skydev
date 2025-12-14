CREATE TABLE IF NOT EXISTS ocr_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  extracted_text TEXT NOT NULL,
  confidence NUMERIC(5,2) DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE ocr_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view all OCR results" ON ocr_results;
CREATE POLICY "Users can view all OCR results" ON ocr_results
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert OCR results" ON ocr_results;
CREATE POLICY "Users can insert OCR results" ON ocr_results
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can delete their own OCR results" ON ocr_results;
CREATE POLICY "Users can delete their own OCR results" ON ocr_results
  FOR DELETE USING (true);

CREATE INDEX IF NOT EXISTS idx_ocr_results_created_at ON ocr_results(created_at DESC);

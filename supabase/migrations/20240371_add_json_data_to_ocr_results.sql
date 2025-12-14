ALTER TABLE ocr_results ADD COLUMN IF NOT EXISTS json_data JSONB;

CREATE INDEX IF NOT EXISTS idx_ocr_results_json_data ON ocr_results USING GIN (json_data);

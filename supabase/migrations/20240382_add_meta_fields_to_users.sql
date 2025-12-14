-- Add metadata tracking columns to users table

-- Store field-level metadata (source, confidence, document_type, last_updated_at)
ALTER TABLE users ADD COLUMN IF NOT EXISTS field_meta JSONB DEFAULT '{}';

-- Add index for faster metadata queries
CREATE INDEX IF NOT EXISTS idx_users_field_meta ON users USING GIN (field_meta);

-- Example field_meta structure:
-- {
--   "nik": {
--     "source": "ocr",
--     "document_type": "KTP",
--     "confidence": 0.95,
--     "last_updated_at": "2025-02-01T12:00:00Z"
--   },
--   "nama": {
--     "source": "user",
--     "document_type": "KTP",
--     "confidence": 1.0,
--     "last_updated_at": "2025-02-01T13:00:00Z"
--   }
-- }

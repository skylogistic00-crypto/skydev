-- Add finance-specific fields to ocr_results table
ALTER TABLE ocr_results 
ADD COLUMN IF NOT EXISTS nominal NUMERIC(15,2),
ADD COLUMN IF NOT EXISTS tanggal DATE,
ADD COLUMN IF NOT EXISTS nomor_nota TEXT,
ADD COLUMN IF NOT EXISTS toko TEXT;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_ocr_results_tanggal ON ocr_results(tanggal);
CREATE INDEX IF NOT EXISTS idx_ocr_results_toko ON ocr_results(toko);

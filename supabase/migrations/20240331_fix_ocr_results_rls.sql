DROP POLICY IF EXISTS "Users can view all OCR results" ON ocr_results;
DROP POLICY IF EXISTS "Users can insert OCR results" ON ocr_results;
DROP POLICY IF EXISTS "Users can delete their own OCR results" ON ocr_results;

CREATE POLICY "Authenticated users can view all OCR results" ON ocr_results
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert OCR results" ON ocr_results
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete OCR results" ON ocr_results
  FOR DELETE 
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update OCR results" ON ocr_results
  FOR UPDATE 
  TO authenticated
  USING (true)
  WITH CHECK (true);

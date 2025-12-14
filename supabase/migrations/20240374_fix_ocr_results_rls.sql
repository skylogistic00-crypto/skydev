-- Fix RLS policies for ocr_results table to allow Edge Function access

-- Drop existing policies
DROP POLICY IF EXISTS "Allow all operations on ocr_results" ON ocr_results;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON ocr_results;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON ocr_results;

-- Create permissive policies for all operations
-- This allows both authenticated users and service role to access the table

-- Allow INSERT for all authenticated users and service role
CREATE POLICY "Allow insert for all authenticated users"
ON ocr_results
FOR INSERT
TO authenticated, anon
WITH CHECK (true);

-- Allow SELECT for all authenticated users and service role
CREATE POLICY "Allow select for all authenticated users"
ON ocr_results
FOR SELECT
TO authenticated, anon
USING (true);

-- Allow UPDATE for all authenticated users and service role
CREATE POLICY "Allow update for all authenticated users"
ON ocr_results
FOR UPDATE
TO authenticated, anon
USING (true)
WITH CHECK (true);

-- Allow DELETE for all authenticated users and service role
CREATE POLICY "Allow delete for all authenticated users"
ON ocr_results
FOR DELETE
TO authenticated, anon
USING (true);

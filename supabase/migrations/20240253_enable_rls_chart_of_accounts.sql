ALTER TABLE chart_of_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read access to chart_of_accounts" ON chart_of_accounts;
CREATE POLICY "Allow read access to chart_of_accounts"
ON chart_of_accounts
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Allow insert to chart_of_accounts for authenticated users" ON chart_of_accounts;
CREATE POLICY "Allow insert to chart_of_accounts for authenticated users"
ON chart_of_accounts
FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update to chart_of_accounts for authenticated users" ON chart_of_accounts;
CREATE POLICY "Allow update to chart_of_accounts for authenticated users"
ON chart_of_accounts
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

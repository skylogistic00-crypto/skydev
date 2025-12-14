-- Fix RLS policies for users table to allow Edge Function inserts

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view all users" ON public.users;
DROP POLICY IF EXISTS "Service role can insert users" ON public.users;
DROP POLICY IF EXISTS "Allow trigger to insert users" ON public.users;

-- Allow all authenticated users to view users
CREATE POLICY "Users can view all users"
ON public.users FOR SELECT
TO authenticated
USING (true);

-- Allow service role to insert users (for Edge Function)
CREATE POLICY "Service role can insert users"
ON public.users FOR INSERT
WITH CHECK (true);

-- Ensure suppliers table has proper RLS
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view suppliers" ON suppliers;
CREATE POLICY "Users can view suppliers"
ON suppliers FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Service role can insert suppliers" ON suppliers;
CREATE POLICY "Service role can insert suppliers"
ON suppliers FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update suppliers" ON suppliers;
CREATE POLICY "Users can update suppliers"
ON suppliers FOR UPDATE
TO authenticated
USING (true);

-- Ensure customers table has proper RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view customers" ON customers;
CREATE POLICY "Users can view customers"
ON customers FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Service role can insert customers" ON customers;
CREATE POLICY "Service role can insert customers"
ON customers FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update customers" ON customers;
CREATE POLICY "Users can update customers"
ON customers FOR UPDATE
TO authenticated
USING (true);

-- Allow the trigger to insert new users
DROP POLICY IF EXISTS "Allow trigger to insert users" ON public.users;
CREATE POLICY "Allow trigger to insert users"
ON public.users FOR INSERT
WITH CHECK (true);

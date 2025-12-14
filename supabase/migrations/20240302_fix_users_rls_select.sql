-- Fix RLS policies for users table to allow proper access

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view all users" ON public.users;
DROP POLICY IF EXISTS "Service role can insert users" ON public.users;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;

-- Allow users to view their own profile based on auth.uid()
CREATE POLICY "Users can view their own profile"
ON public.users FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Allow service role to insert users (for Edge Function)
CREATE POLICY "Service role can insert users"
ON public.users FOR INSERT
WITH CHECK (true);

-- Allow users to update their own profile
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile"
ON public.users FOR UPDATE
TO authenticated
USING (auth.uid() = id);

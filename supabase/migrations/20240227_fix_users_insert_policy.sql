-- Fix: Add INSERT policy for public.users table
-- This allows the trigger to insert new users properly

-- Drop existing INSERT policy if any
DROP POLICY IF EXISTS "Allow trigger to insert users" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated users to insert" ON public.users;

-- Create policy to allow INSERT for authenticated users (for the trigger)
CREATE POLICY "Allow trigger to insert users"
  ON public.users FOR INSERT
  WITH CHECK (true);

-- Also ensure the trigger function has proper permissions
-- Re-create the function with SECURITY DEFINER to bypass RLS
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
BEGIN
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'read_only');
  
  INSERT INTO public.users (id, email, full_name, role, created_at, updated_at)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    user_role,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

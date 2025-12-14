-- Update signup trigger to set new users as inactive by default

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
  -- Get role from metadata, default to 'read_only'
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'read_only');
  
  -- Log for debugging
  RAISE NOTICE 'Creating user: id=%, email=%, role=%', NEW.id, NEW.email, user_role;
  
  -- Insert into public.users with status = 'inactive'
  INSERT INTO public.users (id, email, full_name, role, status, created_at, updated_at)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    user_role,
    'inactive',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    updated_at = NOW();
  
  RAISE NOTICE 'User created successfully with inactive status: %', NEW.id;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the auth.users insert
    RAISE WARNING 'Error in handle_new_user for user %: % - %', NEW.id, SQLERRM, SQLSTATE;
    -- Return NEW to allow auth.users insert to succeed
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

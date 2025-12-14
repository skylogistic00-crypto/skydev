DO $$
DECLARE
  v_user_id UUID;
BEGIN
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role,
    aud
  ) VALUES
    (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'superadmin@company.com',
      crypt('Password123!', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Super Admin"}'::jsonb,
      false,
      'authenticated',
      'authenticated'
    )
  RETURNING id INTO v_user_id;
  
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (v_user_id, 'superadmin@company.com', 'Super Admin', 'super_admin');

  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role,
    aud
  ) VALUES
    (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'acc.manager@company.com',
      crypt('Password123!', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Accounting Manager"}'::jsonb,
      false,
      'authenticated',
      'authenticated'
    )
  RETURNING id INTO v_user_id;
  
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (v_user_id, 'acc.manager@company.com', 'Accounting Manager', 'accounting_manager');

  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role,
    aud
  ) VALUES
    (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'acc.staff01@company.com',
      crypt('Password123!', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Accounting Staff 01"}'::jsonb,
      false,
      'authenticated',
      'authenticated'
    )
  RETURNING id INTO v_user_id;
  
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (v_user_id, 'acc.staff01@company.com', 'Accounting Staff 01', 'accounting_staff');

  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role,
    aud
  ) VALUES
    (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'wh.manager@company.com',
      crypt('Password123!', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Warehouse Manager"}'::jsonb,
      false,
      'authenticated',
      'authenticated'
    )
  RETURNING id INTO v_user_id;
  
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (v_user_id, 'wh.manager@company.com', 'Warehouse Manager', 'warehouse_manager');

  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role,
    aud
  ) VALUES
    (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'wh.staff01@company.com',
      crypt('Password123!', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Warehouse Staff 01"}'::jsonb,
      false,
      'authenticated',
      'authenticated'
    )
  RETURNING id INTO v_user_id;
  
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (v_user_id, 'wh.staff01@company.com', 'Warehouse Staff 01', 'warehouse_staff');

  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role,
    aud
  ) VALUES
    (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'customs01@company.com',
      crypt('Password123!', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Customs Specialist 01"}'::jsonb,
      false,
      'authenticated',
      'authenticated'
    )
  RETURNING id INTO v_user_id;
  
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (v_user_id, 'customs01@company.com', 'Customs Specialist 01', 'customs_specialist');

  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role,
    aud
  ) VALUES
    (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'report@company.com',
      crypt('Password123!', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Report Viewer"}'::jsonb,
      false,
      'authenticated',
      'authenticated'
    )
  RETURNING id INTO v_user_id;
  
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (v_user_id, 'report@company.com', 'Report Viewer', 'read_only');

EXCEPTION
  WHEN unique_violation THEN
    RAISE NOTICE 'Some users already exist, skipping...';
END $$;
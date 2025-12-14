-- Add HR roles to the roles table
DO $$
DECLARE
  next_role_id INTEGER;
BEGIN
  SELECT COALESCE(MAX(role_id), 0) + 1 INTO next_role_id FROM public.roles;
  
  INSERT INTO public.roles (role_id, role_name, description, permissions, entity) VALUES
    (next_role_id, 'hr_manager', 'HR Manager - Mengelola seluruh aspek HRD', '["hrd_all", "employee_management", "payroll_all", "attendance_all", "leave_approval", "performance_review", "contract_management"]'::jsonb, 'karyawan'),
    (next_role_id + 1, 'hr_staff', 'HR Staff - Staff administrasi HRD', '["hrd_basic", "employee_view", "attendance_manage", "leave_manage"]'::jsonb, 'karyawan')
  ON CONFLICT (role_name) DO NOTHING;
END $$;



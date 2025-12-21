-- Add HR roles to the roles table
INSERT INTO public.roles (name, description, permissions) VALUES
  ('hr_manager', 'HR Manager - Mengelola seluruh aspek HRD', '["hrd_all", "employee_management", "payroll_all", "attendance_all", "leave_approval", "performance_review", "contract_management"]'::jsonb),
  ('hr_staff', 'HR Staff - Staff administrasi HRD', '["hrd_basic", "employee_view", "attendance_manage", "leave_manage"]'::jsonb)
ON CONFLICT (name) DO NOTHING;

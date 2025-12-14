-- Add HRD roles to roles table
DO $$
DECLARE
  next_role_id INTEGER;
BEGIN
  SELECT COALESCE(MAX(role_id), 0) + 1 INTO next_role_id FROM public.roles;
  
  INSERT INTO public.roles (role_id, role_name, description, permissions, entity)
  SELECT next_role_id, 'hrd_admin', 'HRD Admin - Full access ke semua fitur HRD', '["hrd_all", "employee_all", "payroll_all", "attendance_all", "leave_all", "contract_all", "performance_all"]'::jsonb, 'karyawan'
  WHERE NOT EXISTS (SELECT 1 FROM public.roles WHERE role_name = 'hrd_admin')
  UNION ALL
  SELECT next_role_id + 1, 'hrd_manager', 'HRD Manager - Approve cuti, lihat data tim', '["hrd_view", "employee_view", "leave_approve", "attendance_view", "payroll_view", "contract_view", "performance_view"]'::jsonb, 'karyawan'
  WHERE NOT EXISTS (SELECT 1 FROM public.roles WHERE role_name = 'hrd_manager')
  UNION ALL
  SELECT next_role_id + 2, 'hrd_supervisor', 'HRD Supervisor - Lihat departemen tertentu', '["hrd_view_department", "employee_view_department", "attendance_view_department", "leave_view_department"]'::jsonb, 'karyawan'
  WHERE NOT EXISTS (SELECT 1 FROM public.roles WHERE role_name = 'hrd_supervisor')
  UNION ALL
  SELECT next_role_id + 3, 'hrd_staff', 'HRD Staff - Akses data pribadi', '["hrd_view_self", "attendance_self", "leave_self", "payroll_self", "performance_self"]'::jsonb, 'karyawan'
  WHERE NOT EXISTS (SELECT 1 FROM public.roles WHERE role_name = 'hrd_staff');
END $$;

-- Create function to get user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT r.role_name INTO user_role
  FROM users u
  JOIN roles r ON u.role_id = r.role_id
  WHERE u.id = auth.uid();
  
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user department
CREATE OR REPLACE FUNCTION get_user_department()
RETURNS UUID AS $$
DECLARE
  user_dept UUID;
  has_dept_id BOOLEAN;
BEGIN
  -- Check if department_id column exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'employees' AND column_name = 'department_id'
  ) INTO has_dept_id;
  
  IF has_dept_id THEN
    EXECUTE 'SELECT department_id FROM employees WHERE user_id = $1' 
    INTO user_dept USING auth.uid();
  END IF;
  
  RETURN user_dept;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user employee id
CREATE OR REPLACE FUNCTION get_user_employee_id()
RETURNS UUID AS $$
DECLARE
  emp_id UUID;
BEGIN
  SELECT e.id INTO emp_id
  FROM employees e
  WHERE e.user_id = auth.uid();
  
  RETURN emp_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow all for authenticated users" ON employees;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON attendance;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON leave_requests;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON payroll;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON employment_contracts;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON performance_reviews;

-- ============================================
-- EMPLOYEES TABLE RLS POLICIES
-- ============================================

-- HRD Admin & Super Admin: Full access
CREATE POLICY "hrd_admin_full_access" ON employees
FOR ALL TO authenticated
USING (
  get_user_role() IN ('hrd_admin', 'super_admin', 'hr_manager')
)
WITH CHECK (
  get_user_role() IN ('hrd_admin', 'super_admin', 'hr_manager')
);

-- HRD Manager: View all, no delete
CREATE POLICY "hrd_manager_view_all" ON employees
FOR SELECT TO authenticated
USING (
  get_user_role() = 'hrd_manager'
);

-- HRD Supervisor: View own department only
CREATE POLICY "hrd_supervisor_view_department" ON employees
FOR SELECT TO authenticated
USING (
  get_user_role() = 'hrd_supervisor' AND
  department_id = get_user_department()
);

-- HRD Staff: View own data only
CREATE POLICY "hrd_staff_view_self" ON employees
FOR SELECT TO authenticated
USING (
  get_user_role() = 'hrd_staff' AND
  id = get_user_employee_id()
);

-- ============================================
-- ATTENDANCE TABLE RLS POLICIES
-- ============================================

-- HRD Admin: Full access
CREATE POLICY "attendance_hrd_admin_full" ON attendance
FOR ALL TO authenticated
USING (
  get_user_role() IN ('hrd_admin', 'super_admin', 'hr_manager')
)
WITH CHECK (
  get_user_role() IN ('hrd_admin', 'super_admin', 'hr_manager')
);

-- HRD Manager: View all
CREATE POLICY "attendance_hrd_manager_view" ON attendance
FOR SELECT TO authenticated
USING (
  get_user_role() = 'hrd_manager'
);

-- HRD Supervisor: View own department
CREATE POLICY "attendance_supervisor_view_dept" ON attendance
FOR SELECT TO authenticated
USING (
  get_user_role() = 'hrd_supervisor' AND
  employee_id IN (
    SELECT id FROM employees WHERE department_id = get_user_department()
  )
);

-- HRD Staff: View & manage own attendance
CREATE POLICY "attendance_staff_own" ON attendance
FOR ALL TO authenticated
USING (
  get_user_role() = 'hrd_staff' AND
  employee_id = get_user_employee_id()
)
WITH CHECK (
  get_user_role() = 'hrd_staff' AND
  employee_id = get_user_employee_id()
);

-- ============================================
-- LEAVE REQUESTS TABLE RLS POLICIES
-- ============================================

-- HRD Admin: Full access
CREATE POLICY "leave_hrd_admin_full" ON leave_requests
FOR ALL TO authenticated
USING (
  get_user_role() IN ('hrd_admin', 'super_admin', 'hr_manager')
)
WITH CHECK (
  get_user_role() IN ('hrd_admin', 'super_admin', 'hr_manager')
);

-- HRD Manager: View all, approve/reject
CREATE POLICY "leave_manager_approve" ON leave_requests
FOR ALL TO authenticated
USING (
  get_user_role() = 'hrd_manager'
)
WITH CHECK (
  get_user_role() = 'hrd_manager'
);

-- HRD Supervisor: View own department
CREATE POLICY "leave_supervisor_view_dept" ON leave_requests
FOR SELECT TO authenticated
USING (
  get_user_role() = 'hrd_supervisor' AND
  employee_id IN (
    SELECT id FROM employees WHERE department_id = get_user_department()
  )
);

-- HRD Staff: View & create own leave requests
CREATE POLICY "leave_staff_own" ON leave_requests
FOR ALL TO authenticated
USING (
  get_user_role() = 'hrd_staff' AND
  employee_id = get_user_employee_id()
)
WITH CHECK (
  get_user_role() = 'hrd_staff' AND
  employee_id = get_user_employee_id()
);

-- ============================================
-- PAYROLL TABLE RLS POLICIES
-- ============================================

-- HRD Admin: Full access
CREATE POLICY "payroll_hrd_admin_full" ON payroll
FOR ALL TO authenticated
USING (
  get_user_role() IN ('hrd_admin', 'super_admin', 'hr_manager')
)
WITH CHECK (
  get_user_role() IN ('hrd_admin', 'super_admin', 'hr_manager')
);

-- HRD Manager: View all
CREATE POLICY "payroll_manager_view" ON payroll
FOR SELECT TO authenticated
USING (
  get_user_role() = 'hrd_manager'
);

-- HRD Staff: View own payroll only
CREATE POLICY "payroll_staff_own" ON payroll
FOR SELECT TO authenticated
USING (
  get_user_role() = 'hrd_staff' AND
  employee_id = get_user_employee_id()
);

-- ============================================
-- EMPLOYMENT CONTRACTS TABLE RLS POLICIES
-- ============================================

-- HRD Admin: Full access
CREATE POLICY "contract_hrd_admin_full" ON employment_contracts
FOR ALL TO authenticated
USING (
  get_user_role() IN ('hrd_admin', 'super_admin', 'hr_manager')
)
WITH CHECK (
  get_user_role() IN ('hrd_admin', 'super_admin', 'hr_manager')
);

-- HRD Manager: View all
CREATE POLICY "contract_manager_view" ON employment_contracts
FOR SELECT TO authenticated
USING (
  get_user_role() = 'hrd_manager'
);

-- HRD Supervisor: View own department
CREATE POLICY "contract_supervisor_view_dept" ON employment_contracts
FOR SELECT TO authenticated
USING (
  get_user_role() = 'hrd_supervisor' AND
  employee_id IN (
    SELECT id FROM employees WHERE department_id = get_user_department()
  )
);

-- HRD Staff: View own contract
CREATE POLICY "contract_staff_own" ON employment_contracts
FOR SELECT TO authenticated
USING (
  get_user_role() = 'hrd_staff' AND
  employee_id = get_user_employee_id()
);

-- ============================================
-- PERFORMANCE REVIEWS TABLE RLS POLICIES
-- ============================================

-- HRD Admin: Full access
CREATE POLICY "performance_hrd_admin_full" ON performance_reviews
FOR ALL TO authenticated
USING (
  get_user_role() IN ('hrd_admin', 'super_admin', 'hr_manager')
)
WITH CHECK (
  get_user_role() IN ('hrd_admin', 'super_admin', 'hr_manager')
);

-- HRD Manager: View all, create reviews
CREATE POLICY "performance_manager_all" ON performance_reviews
FOR ALL TO authenticated
USING (
  get_user_role() = 'hrd_manager'
)
WITH CHECK (
  get_user_role() = 'hrd_manager'
);

-- HRD Supervisor: View own department
CREATE POLICY "performance_supervisor_view_dept" ON performance_reviews
FOR SELECT TO authenticated
USING (
  get_user_role() = 'hrd_supervisor' AND
  employee_id IN (
    SELECT id FROM employees WHERE department_id = get_user_department()
  )
);

-- HRD Staff: View own performance reviews
CREATE POLICY "performance_staff_own" ON performance_reviews
FOR SELECT TO authenticated
USING (
  get_user_role() = 'hrd_staff' AND
  employee_id = get_user_employee_id()
);

-- ============================================
-- LEAVE BALANCE TABLE RLS POLICIES
-- ============================================

DROP POLICY IF EXISTS "Allow all for authenticated users" ON leave_balance;

CREATE POLICY "leave_balance_hrd_admin" ON leave_balance
FOR ALL TO authenticated
USING (
  get_user_role() IN ('hrd_admin', 'super_admin', 'hr_manager')
)
WITH CHECK (
  get_user_role() IN ('hrd_admin', 'super_admin', 'hr_manager')
);

CREATE POLICY "leave_balance_manager_view" ON leave_balance
FOR SELECT TO authenticated
USING (
  get_user_role() = 'hrd_manager'
);

CREATE POLICY "leave_balance_staff_own" ON leave_balance
FOR SELECT TO authenticated
USING (
  get_user_role() = 'hrd_staff' AND
  employee_id = get_user_employee_id()
);

-- ============================================
-- DEPARTMENTS & POSITIONS RLS
-- ============================================

DROP POLICY IF EXISTS "Allow all for authenticated users" ON departments;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON positions;

-- Departments: HRD Admin can manage, others can view
CREATE POLICY "departments_hrd_admin_full" ON departments
FOR ALL TO authenticated
USING (
  get_user_role() IN ('hrd_admin', 'super_admin', 'hr_manager')
)
WITH CHECK (
  get_user_role() IN ('hrd_admin', 'super_admin', 'hr_manager')
);

CREATE POLICY "departments_others_view" ON departments
FOR SELECT TO authenticated
USING (
  get_user_role() IN ('hrd_manager', 'hrd_supervisor', 'hrd_staff')
);

-- Positions: HRD Admin can manage, others can view
CREATE POLICY "positions_hrd_admin_full" ON positions
FOR ALL TO authenticated
USING (
  get_user_role() IN ('hrd_admin', 'super_admin', 'hr_manager')
)
WITH CHECK (
  get_user_role() IN ('hrd_admin', 'super_admin', 'hr_manager')
);

CREATE POLICY "positions_others_view" ON positions
FOR SELECT TO authenticated
USING (
  get_user_role() IN ('hrd_manager', 'hrd_supervisor', 'hrd_staff')
);

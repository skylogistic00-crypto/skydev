-- Check if departments table exists and has data
DO $$
BEGIN
  -- Insert sample departments if table is empty
  IF NOT EXISTS (SELECT 1 FROM departments LIMIT 1) THEN
    INSERT INTO departments (department_name, description) VALUES
    ('Human Resources', 'Mengelola SDM dan administrasi karyawan'),
    ('Finance', 'Mengelola keuangan dan akuntansi perusahaan'),
    ('IT', 'Mengelola teknologi informasi dan sistem'),
    ('Marketing', 'Mengelola pemasaran dan promosi'),
    ('Operations', 'Mengelola operasional perusahaan');
  END IF;

  -- Insert sample positions if table is empty
  IF NOT EXISTS (SELECT 1 FROM positions LIMIT 1) THEN
    INSERT INTO positions (position_name, department_id, level, description)
    SELECT 'HR Manager', id, 'Manager', 'Mengelola departemen HR' FROM departments WHERE department_name = 'Human Resources'
    UNION ALL
    SELECT 'HR Staff', id, 'Staff', 'Staff administrasi HR' FROM departments WHERE department_name = 'Human Resources'
    UNION ALL
    SELECT 'Finance Manager', id, 'Manager', 'Mengelola keuangan' FROM departments WHERE department_name = 'Finance'
    UNION ALL
    SELECT 'Accountant', id, 'Staff', 'Mengelola pembukuan' FROM departments WHERE department_name = 'Finance'
    UNION ALL
    SELECT 'IT Manager', id, 'Manager', 'Mengelola IT' FROM departments WHERE department_name = 'IT'
    UNION ALL
    SELECT 'Software Developer', id, 'Staff', 'Mengembangkan software' FROM departments WHERE department_name = 'IT'
    UNION ALL
    SELECT 'Marketing Manager', id, 'Manager', 'Mengelola marketing' FROM departments WHERE department_name = 'Marketing'
    UNION ALL
    SELECT 'Marketing Staff', id, 'Staff', 'Staff marketing' FROM departments WHERE department_name = 'Marketing';
  END IF;
END $$;

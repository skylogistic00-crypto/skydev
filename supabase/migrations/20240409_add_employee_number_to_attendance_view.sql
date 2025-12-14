-- Add a helper view to easily see attendance with correct employee numbers
CREATE OR REPLACE VIEW vw_attendance_with_employee AS
SELECT 
  a.id,
  a.employee_id,
  e.employee_number,
  e.full_name,
  a.attendance_date,
  a.clock_in,
  a.clock_out,
  a.work_hours,
  a.status,
  a.notes,
  a.created_at,
  a.updated_at
FROM attendance a
LEFT JOIN employees e ON a.employee_id = e.id
ORDER BY a.attendance_date DESC, a.clock_in DESC;

-- Grant access to authenticated users
GRANT SELECT ON vw_attendance_with_employee TO authenticated;

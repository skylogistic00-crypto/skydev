-- Add RLS policies to vw_employee_advance_summary view
-- Allow users to see their own advances and allow admin/finance/accounting_staff to see all

-- Enable RLS on the view
ALTER VIEW vw_employee_advance_summary SET (security_invoker = on);

-- Note: Views inherit RLS from their base tables
-- Since employee_advances already has RLS policies, the view will respect them
-- But we need to ensure the view can be queried

-- Grant select permission to authenticated users
GRANT SELECT ON vw_employee_advance_summary TO authenticated;

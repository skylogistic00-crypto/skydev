DO $$
DECLARE
  next_role_id INTEGER;
BEGIN
  SELECT COALESCE(MAX(role_id), 0) + 1 INTO next_role_id FROM public.roles;
  
  INSERT INTO public.roles (role_id, role_name, description, permissions) VALUES
    (next_role_id, 'Acceptance/Checker', 'Handles acceptance and checking of goods/documents', '["goods_receipt", "inventory_basic", "reports_view_only"]'::jsonb),
    (next_role_id + 1, 'Admin DO', 'Delivery Order administration', '["inventory_view_all", "customs_documents", "reports_basic"]'::jsonb),
    (next_role_id + 2, 'Porter', 'Handles physical movement and loading of goods', '["picking", "packing", "goods_receipt"]'::jsonb),
    (next_role_id + 3, 'Supervisor', 'Supervises operations and staff', '["inventory_view_all", "wms_user_management", "reports_accounting", "approval_all"]'::jsonb),
    (next_role_id + 4, 'Assistant Manager', 'Assists manager in daily operations', '["accounting_view_all", "inventory_view_all", "reports_all", "approval_all"]'::jsonb),
    (next_role_id + 5, 'Cashier', 'Handles cash transactions and payments', '["payment_processing", "accounting_data_entry", "reports_basic"]'::jsonb),
    (next_role_id + 6, 'Keamanan', 'Security personnel', '["dashboard_view", "reports_view_only"]'::jsonb)
  ON CONFLICT (role_name) DO NOTHING;
END $$;

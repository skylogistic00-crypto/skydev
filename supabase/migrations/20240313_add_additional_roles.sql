INSERT INTO public.roles (name, description, permissions) VALUES
  ('Acceptance/Checker', 'Handles acceptance and checking of goods/documents', '["goods_receipt", "inventory_basic", "reports_view_only"]'::jsonb),
  ('Admin DO', 'Delivery Order administration', '["inventory_view_all", "customs_documents", "reports_basic"]'::jsonb),
  ('Porter', 'Handles physical movement and loading of goods', '["picking", "packing", "goods_receipt"]'::jsonb),
  ('Supervisor', 'Supervises operations and staff', '["inventory_view_all", "wms_user_management", "reports_accounting", "approval_all"]'::jsonb),
  ('Assistant Manager', 'Assists manager in daily operations', '["accounting_view_all", "inventory_view_all", "reports_all", "approval_all"]'::jsonb),
  ('Cashier', 'Handles cash transactions and payments', '["payment_processing", "accounting_data_entry", "reports_basic"]'::jsonb),
  ('Keamanan', 'Security personnel', '["dashboard_view", "reports_view_only"]'::jsonb)
ON CONFLICT (name) DO NOTHING;

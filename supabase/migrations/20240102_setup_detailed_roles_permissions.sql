DELETE FROM public.roles;

INSERT INTO public.roles (name, description, permissions) VALUES
  (
    'super_admin',
    'Super Admin - All Access',
    '["all_modules", "user_management", "accounting_all", "warehouse_all", "customs_all", "reports_all", "approval_all", "system_settings"]'::jsonb
  ),
  (
    'accounting_manager',
    'Accounting Manager - View All Reports, Approval, Journal Adjustment',
    '["accounting_view_all", "accounting_approval", "journal_adjustment", "reports_accounting", "reports_financial", "ap_ar_view", "payment_view"]'::jsonb
  ),
  (
    'accounting_staff',
    'Accounting Staff - Data Entry, AP/AR, Payment Processing',
    '["accounting_data_entry", "ap_ar_manage", "payment_processing", "basic_journal", "reports_basic"]'::jsonb
  ),
  (
    'warehouse_manager',
    'Warehouse Manager - View Inventory, Manage WMS Users',
    '["inventory_view_all", "wms_all_access", "inventory_reports", "wms_user_management", "stock_management"]'::jsonb
  ),
  (
    'warehouse_staff',
    'Warehouse Staff - Goods Receipt, Picking, Packing',
    '["goods_receipt", "picking", "packing", "stock_count", "inventory_basic"]'::jsonb
  ),
  (
    'customs_specialist',
    'Customs Specialist - CEISA Integration, Customs Report',
    '["ceisa_integration", "customs_documents", "tax_reports", "customs_reports", "import_export_docs"]'::jsonb
  ),
  (
    'read_only',
    'Read-Only User - View Only Reports',
    '["reports_view_only", "dashboard_view"]'::jsonb
  )
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  permissions = EXCLUDED.permissions;

UPDATE public.users SET role = 'read_only' WHERE role = 'viewer';

CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  module TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO public.permissions (code, name, description, module) VALUES
  ('all_modules', 'All Modules Access', 'Full access to all system modules', 'system'),
  ('user_management', 'User Management', 'Create, edit, delete users and assign roles', 'system'),
  ('system_settings', 'System Settings', 'Configure system-wide settings', 'system'),
  
  ('accounting_all', 'Accounting All Access', 'Full access to all accounting features', 'accounting'),
  ('accounting_view_all', 'View All Accounting', 'View all accounting data and reports', 'accounting'),
  ('accounting_approval', 'Accounting Approval', 'Approve accounting transactions', 'accounting'),
  ('journal_adjustment', 'Journal Adjustment', 'Create and modify journal adjustments', 'accounting'),
  ('accounting_data_entry', 'Accounting Data Entry', 'Enter accounting transactions', 'accounting'),
  ('ap_ar_manage', 'AP/AR Management', 'Manage accounts payable and receivable', 'accounting'),
  ('ap_ar_view', 'AP/AR View', 'View accounts payable and receivable', 'accounting'),
  ('payment_processing', 'Payment Processing', 'Process payments', 'accounting'),
  ('payment_view', 'Payment View', 'View payment records', 'accounting'),
  ('basic_journal', 'Basic Journal Entry', 'Create basic journal entries', 'accounting'),
  ('reports_accounting', 'Accounting Reports', 'Access accounting reports', 'accounting'),
  ('reports_financial', 'Financial Reports', 'Access financial reports', 'accounting'),
  ('reports_basic', 'Basic Reports', 'Access basic reports', 'accounting'),
  
  ('warehouse_all', 'Warehouse All Access', 'Full access to warehouse management', 'warehouse'),
  ('wms_all_access', 'WMS All Access', 'Full warehouse management system access', 'warehouse'),
  ('inventory_view_all', 'View All Inventory', 'View all inventory data', 'warehouse'),
  ('inventory_reports', 'Inventory Reports', 'Access inventory reports', 'warehouse'),
  ('wms_user_management', 'WMS User Management', 'Manage warehouse users', 'warehouse'),
  ('stock_management', 'Stock Management', 'Manage stock levels', 'warehouse'),
  ('goods_receipt', 'Goods Receipt', 'Process goods receipt', 'warehouse'),
  ('picking', 'Picking', 'Process picking operations', 'warehouse'),
  ('packing', 'Packing', 'Process packing operations', 'warehouse'),
  ('stock_count', 'Stock Count', 'Perform stock counting', 'warehouse'),
  ('inventory_basic', 'Basic Inventory', 'Basic inventory operations', 'warehouse'),
  
  ('customs_all', 'Customs All Access', 'Full access to customs features', 'customs'),
  ('ceisa_integration', 'CEISA Integration', 'Access CEISA integration features', 'customs'),
  ('customs_documents', 'Customs Documents', 'Manage customs documents', 'customs'),
  ('tax_reports', 'Tax Reports', 'Access tax reports', 'customs'),
  ('customs_reports', 'Customs Reports', 'Access customs reports', 'customs'),
  ('import_export_docs', 'Import/Export Documents', 'Manage import/export documentation', 'customs'),
  
  ('reports_all', 'All Reports Access', 'Access all system reports', 'reports'),
  ('reports_view_only', 'View Only Reports', 'View-only access to reports', 'reports'),
  ('dashboard_view', 'Dashboard View', 'View system dashboards', 'reports'),
  ('approval_all', 'All Approvals', 'Approve all types of transactions', 'approval')
ON CONFLICT (code) DO NOTHING;

ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view permissions" ON public.permissions;
CREATE POLICY "Anyone can view permissions"
ON public.permissions FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Super admins can manage permissions" ON public.permissions;
CREATE POLICY "Super admins can manage permissions"
ON public.permissions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'super_admin'
  )
);

DROP POLICY IF EXISTS "Admins can update users" ON public.users;
CREATE POLICY "Admins can update users"
ON public.users FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
  )
);

DROP POLICY IF EXISTS "Admins can delete users" ON public.users;
CREATE POLICY "Admins can delete users"
ON public.users FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
  )
);

DROP POLICY IF EXISTS "Admins can manage roles" ON public.roles;
CREATE POLICY "Admins can manage roles"
ON public.roles FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
  )
);

alter publication supabase_realtime add table permissions;
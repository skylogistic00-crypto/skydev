INSERT INTO coa_category_mapping (
  service_category,
  service_type,
  revenue_account_code,
  cogs_account_code,
  asset_account_code,
  is_active
) VALUES (
  'Hutang',
  'Hutang Pinjaman Dana',
  '2-1100',
  NULL,
  '2-1100',
  true
)
ON CONFLICT (service_category, service_type) 
DO UPDATE SET
  revenue_account_code = EXCLUDED.revenue_account_code,
  asset_account_code = EXCLUDED.asset_account_code,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();
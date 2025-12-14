-- Add Pinjaman category to COA mapping

INSERT INTO coa_category_mapping (
  service_category,
  service_type,
  asset_account_code,
  revenue_account_code,
  cogs_account_code,
  description,
  is_active
) VALUES
  ('Pinjaman', 'Pinjaman Bank Jangka Pendek', '1-1100', '2-1410', '7-2100', 'Pinjaman bank dengan jangka waktu < 1 tahun', true),
  ('Pinjaman', 'Pinjaman Bank Jangka Panjang', '1-1100', '2-2100', '7-2100', 'Pinjaman bank dengan jangka waktu > 1 tahun', true),
  ('Pinjaman', 'Pinjaman dari Rekan/Pemilik', '1-1100', '2-1400', '7-2100', 'Pinjaman dari rekan bisnis atau pemilik perusahaan', true),
  ('Pinjaman', 'Leasing Kendaraan', '1-1100', '2-2200', '7-2100', 'Leasing untuk kendaraan operasional', true),
  ('Pinjaman', 'Leasing Peralatan', '1-1100', '2-2300', '7-2100', 'Leasing untuk peralatan seperti forklift, dll', true)
ON CONFLICT (service_category, service_type) DO UPDATE SET
  asset_account_code = EXCLUDED.asset_account_code,
  revenue_account_code = EXCLUDED.revenue_account_code,
  cogs_account_code = EXCLUDED.cogs_account_code,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active;

-- Menambahkan mapping untuk kategori Persediaan dengan lebih lengkap
INSERT INTO coa_category_mapping (
  service_category,
  service_type,
  asset_account_code,
  cogs_account_code,
  description,
  is_active
) VALUES
  ('Persediaan', 'Pembelian Kardus', '1-1400', '5-1400', 'Pembelian bahan kemasan kardus', true),
  ('Persediaan', 'Pembelian Plastik', '1-1400', '5-1400', 'Pembelian bahan kemasan plastik', true),
  ('Persediaan', 'Pembelian Kayu', '1-1400', '5-1400', 'Pembelian bahan kemasan kayu', true),
  ('Persediaan', 'Pembelian Bubble Wrap', '1-1400', '5-1400', 'Pembelian bahan kemasan bubble wrap', true),
  ('Persediaan', 'Pembelian Lakban', '1-1400', '5-1400', 'Pembelian bahan kemasan lakban', true),
  ('Persediaan', 'Pembelian Styrofoam', '1-1400', '5-1400', 'Pembelian bahan kemasan styrofoam', true),
  ('Persediaan', 'Pembelian Pallet', '1-1400', '5-1400', 'Pembelian bahan kemasan pallet', true),
  ('Persediaan', 'Pembelian Strapping Band', '1-1400', '5-1400', 'Pembelian bahan kemasan strapping band', true),
  ('Persediaan', 'Pembelian Stretch Film', '1-1400', '5-1400', 'Pembelian bahan kemasan stretch film', true),
  ('Persediaan', 'Pembelian Kertas Kraft', '1-1400', '5-1400', 'Pembelian bahan kemasan kertas kraft', true)
ON CONFLICT (service_category, service_type) 
DO UPDATE SET
  asset_account_code = EXCLUDED.asset_account_code,
  cogs_account_code = EXCLUDED.cogs_account_code,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active;

COMMENT ON TABLE coa_category_mapping IS 'Mapping kategori layanan/produk ke akun COA untuk auto-fill';
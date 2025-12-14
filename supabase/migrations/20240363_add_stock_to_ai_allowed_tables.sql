-- Add more tables to ai_allowed_tables for AI queries
-- First delete existing entries to avoid conflicts
DELETE FROM ai_allowed_tables WHERE table_name IN ('stock', 'warehouses', 'suppliers', 'customers', 'barang_lini_1', 'barang_lini_2', 'stock_barang_import');

INSERT INTO ai_allowed_tables (table_name, allowed_columns)
VALUES
  ('stock', ARRAY['id','item_name','jenis_barang','brand','model','quantity','unit','unit_price','total_value','warehouse_id','location','description','hs_code','created_at']),
  ('warehouses', ARRAY['id','name','code','address','city','capacity','created_at']),
  ('suppliers', ARRAY['id','name','company_name','email','phone','address','category','created_at']),
  ('customers', ARRAY['id','name','company_name','email','phone','address','created_at']),
  ('barang_lini_1', ARRAY['id','item_name','quantity','unit','warehouse_id','status','created_at']),
  ('barang_lini_2', ARRAY['id','item_name','quantity','unit','warehouse_id','status','created_at']),
  ('stock_barang_import', ARRAY['id','item_name','quantity','unit','warehouse_id','hs_code','origin_country','created_at']);

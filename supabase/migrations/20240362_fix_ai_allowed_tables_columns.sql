DELETE FROM ai_allowed_tables;

INSERT INTO ai_allowed_tables (table_name, allowed_columns)
VALUES
  ('kas_transaksi', ARRAY['id','tanggal','document_number','payment_type','account_number','nominal','keterangan','service_category','service_type','created_at']),
  ('cash_disbursement', ARRAY['id','transaction_date','document_number','payee_name','amount','description','category','payment_method','approval_status','created_at']),
  ('cash_and_bank_receipts', ARRAY['id','tanggal','nomor_bukti','diterima_dari','jumlah','keterangan','coa_debit_id','coa_credit_id','created_at']),
  ('sales_transactions', ARRAY['id','tanggal','customer_id','item_id','quantity','unit_price','total_amount','payment_method','created_at']),
  ('purchase_transactions', ARRAY['id','tanggal','supplier_id','item_id','quantity','unit_price','total_amount','payment_method','created_at']),
  ('general_ledger', ARRAY['id','tanggal','coa_id','debit','credit','keterangan','created_at']),
  ('chart_of_accounts', ARRAY['id','account_code','account_name','account_type','category','balance','created_at']);

CREATE OR REPLACE VIEW vw_cash_flow_detail AS
SELECT 
  id,
  tanggal AS entry_date,
  keterangan AS description,
  payment_type,
  CASE WHEN payment_type = 'Penerimaan Kas' THEN nominal ELSE 0 END AS cash_in,
  CASE WHEN payment_type = 'Pengeluaran Kas' THEN nominal ELSE 0 END AS cash_out,
  CASE WHEN payment_type = 'Penerimaan Kas' THEN nominal ELSE -nominal END AS cash_movement
FROM kas_transaksi
ORDER BY tanggal DESC, created_at DESC;

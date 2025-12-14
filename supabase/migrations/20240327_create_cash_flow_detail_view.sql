CREATE OR REPLACE VIEW vw_cash_flow_detail AS
SELECT 
  id,
  tanggal AS entry_date,
  keterangan AS description,
  jenis_transaksi,
  CASE WHEN jenis_transaksi = 'masuk' THEN jumlah ELSE 0 END AS cash_in,
  CASE WHEN jenis_transaksi = 'keluar' THEN jumlah ELSE 0 END AS cash_out,
  CASE WHEN jenis_transaksi = 'masuk' THEN jumlah ELSE -jumlah END AS cash_movement
FROM kas_transaksi
ORDER BY tanggal DESC, created_at DESC;

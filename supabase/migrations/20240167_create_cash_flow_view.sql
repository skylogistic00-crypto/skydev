CREATE OR REPLACE VIEW vw_cash_flow_report AS
SELECT 
  EXTRACT(YEAR FROM tanggal)::INTEGER AS tahun,
  EXTRACT(MONTH FROM tanggal)::INTEGER AS bulan,
  SUM(CASE WHEN jenis_transaksi = 'masuk' THEN jumlah ELSE 0 END) AS kas_masuk,
  SUM(CASE WHEN jenis_transaksi = 'keluar' THEN jumlah ELSE 0 END) AS kas_keluar,
  SUM(CASE WHEN jenis_transaksi = 'masuk' THEN jumlah ELSE -jumlah END) AS saldo_kas_bersih
FROM kas_transaksi
GROUP BY tahun, bulan
ORDER BY tahun DESC, bulan DESC;

alter publication supabase_realtime add table kas_transaksi;

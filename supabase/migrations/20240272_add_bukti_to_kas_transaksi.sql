ALTER TABLE kas_transaksi ADD COLUMN IF NOT EXISTS bukti TEXT;

COMMENT ON COLUMN kas_transaksi.bukti IS 'URL file bukti transaksi (gambar atau PDF)';

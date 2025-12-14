ALTER TABLE barang_lini_1 DROP CONSTRAINT IF EXISTS check_status;

ALTER TABLE barang_lini_1 ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'aktif';

UPDATE barang_lini_1 SET status = 'aktif' WHERE status NOT IN ('aktif', 'dipindahkan', 'diambil');

COMMENT ON COLUMN barang_lini_1.status IS 'Status barang: aktif, dipindahkan, diambil';

ALTER TABLE barang_lini_1 ADD CONSTRAINT check_status CHECK (status IN ('aktif', 'dipindahkan', 'diambil'));
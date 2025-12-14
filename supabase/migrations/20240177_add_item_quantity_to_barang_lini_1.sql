ALTER TABLE barang_lini_1 ADD COLUMN IF NOT EXISTS item_quantity DECIMAL(15,2);
ALTER TABLE barang_lini_1 ADD COLUMN IF NOT EXISTS unit TEXT;
ALTER TABLE barang_lini_1 ADD COLUMN IF NOT EXISTS warehouses TEXT;
ALTER TABLE barang_lini_1 ADD COLUMN IF NOT EXISTS zones TEXT;
ALTER TABLE barang_lini_1 ADD COLUMN IF NOT EXISTS racks TEXT;
ALTER TABLE barang_lini_1 ADD COLUMN IF NOT EXISTS lots TEXT;

COMMENT ON COLUMN barang_lini_1.item_quantity IS 'Jumlah barang';
COMMENT ON COLUMN barang_lini_1.unit IS 'Satuan barang';
COMMENT ON COLUMN barang_lini_1.warehouses IS 'Gudang';
COMMENT ON COLUMN barang_lini_1.zones IS 'Zona';
COMMENT ON COLUMN barang_lini_1.racks IS 'Rak';
COMMENT ON COLUMN barang_lini_1.lots IS 'Lot';

-- Menambahkan kolom WMS/CEISA ke tabel stock
ALTER TABLE stock
ADD COLUMN IF NOT EXISTS wms_reference_number TEXT,
ADD COLUMN IF NOT EXISTS ceisa_document_number TEXT,
ADD COLUMN IF NOT EXISTS ceisa_document_type TEXT,
ADD COLUMN IF NOT EXISTS ceisa_document_date DATE,
ADD COLUMN IF NOT EXISTS ceisa_status TEXT,
ADD COLUMN IF NOT EXISTS wms_sync_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS wms_sync_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS ceisa_sync_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS ceisa_sync_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS wms_notes TEXT,
ADD COLUMN IF NOT EXISTS ceisa_notes TEXT;

-- Menambahkan kolom WMS/CEISA ke tabel barang_lini_1
ALTER TABLE barang_lini_1
ADD COLUMN IF NOT EXISTS wms_reference_number TEXT,
ADD COLUMN IF NOT EXISTS ceisa_document_number TEXT,
ADD COLUMN IF NOT EXISTS ceisa_document_type TEXT,
ADD COLUMN IF NOT EXISTS ceisa_document_date DATE,
ADD COLUMN IF NOT EXISTS ceisa_status TEXT,
ADD COLUMN IF NOT EXISTS wms_sync_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS wms_sync_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS ceisa_sync_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS ceisa_sync_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS wms_notes TEXT,
ADD COLUMN IF NOT EXISTS ceisa_notes TEXT;

-- Menambahkan index untuk pencarian
CREATE INDEX IF NOT EXISTS idx_stock_wms_reference ON stock(wms_reference_number);
CREATE INDEX IF NOT EXISTS idx_stock_ceisa_document ON stock(ceisa_document_number);
CREATE INDEX IF NOT EXISTS idx_barang_lini_1_wms_reference ON barang_lini_1(wms_reference_number);
CREATE INDEX IF NOT EXISTS idx_barang_lini_1_ceisa_document ON barang_lini_1(ceisa_document_number);

COMMENT ON COLUMN stock.wms_reference_number IS 'Nomor referensi dari sistem WMS';
COMMENT ON COLUMN stock.ceisa_document_number IS 'Nomor dokumen CEISA';
COMMENT ON COLUMN stock.ceisa_document_type IS 'Jenis dokumen CEISA (BC 2.3, BC 4.0, dll)';
COMMENT ON COLUMN stock.wms_sync_status IS 'Status sinkronisasi dengan WMS: pending, synced, failed';
COMMENT ON COLUMN stock.ceisa_sync_status IS 'Status sinkronisasi dengan CEISA: pending, synced, failed';

COMMENT ON COLUMN barang_lini_1.wms_reference_number IS 'Nomor referensi dari sistem WMS';
COMMENT ON COLUMN barang_lini_1.ceisa_document_number IS 'Nomor dokumen CEISA';
COMMENT ON COLUMN barang_lini_1.ceisa_document_type IS 'Jenis dokumen CEISA (BC 2.3, BC 4.0, dll)';
COMMENT ON COLUMN barang_lini_1.wms_sync_status IS 'Status sinkronisasi dengan WMS: pending, synced, failed';
COMMENT ON COLUMN barang_lini_1.ceisa_sync_status IS 'Status sinkronisasi dengan CEISA: pending, synced, failed';

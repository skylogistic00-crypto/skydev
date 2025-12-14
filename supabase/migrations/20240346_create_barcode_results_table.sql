CREATE TABLE IF NOT EXISTS barcode_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code_text TEXT NOT NULL,
    code_format TEXT,
    scanned_at TIMESTAMPTZ DEFAULT NOW(),
    product_id UUID,
    sku TEXT,
    product_name TEXT,
    supplier TEXT,
    base_price NUMERIC(15,2),
    rack_location TEXT,
    is_qris BOOLEAN DEFAULT FALSE,
    qris_nominal NUMERIC(15,2),
    qris_merchant TEXT,
    qris_invoice_qr TEXT,
    autofill_status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE barcode_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public insert to barcode_results" ON barcode_results;
CREATE POLICY "Allow public insert to barcode_results" ON barcode_results
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public select from barcode_results" ON barcode_results;
CREATE POLICY "Allow public select from barcode_results" ON barcode_results
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public update to barcode_results" ON barcode_results;
CREATE POLICY "Allow public update to barcode_results" ON barcode_results
    FOR UPDATE USING (true);

CREATE OR REPLACE FUNCTION update_barcode_results_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS barcode_results_updated_at ON barcode_results;
CREATE TRIGGER barcode_results_updated_at
    BEFORE UPDATE ON barcode_results
    FOR EACH ROW
    EXECUTE FUNCTION update_barcode_results_updated_at();

ALTER TABLE barcode_results REPLICA IDENTITY FULL;

ALTER TABLE purchase_requests 
ADD COLUMN IF NOT EXISTS ppn_amount DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS pph_amount DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS ppn_percentage DECIMAL(5,2) DEFAULT 11,
ADD COLUMN IF NOT EXISTS pph_percentage DECIMAL(5,2) DEFAULT 0;

ALTER TABLE sales_transactions 
ADD COLUMN IF NOT EXISTS ppn_amount DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS pph_amount DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS ppn_percentage DECIMAL(5,2) DEFAULT 11,
ADD COLUMN IF NOT EXISTS pph_percentage DECIMAL(5,2) DEFAULT 0;

CREATE TABLE IF NOT EXISTS tax_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tax_type TEXT NOT NULL CHECK (tax_type IN ('PPN', 'PPH21', 'PPH22', 'PPH23', 'PPH4(2)')),
  rate DECIMAL(5,2) NOT NULL,
  effective_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO tax_settings (tax_type, rate, effective_date, is_active, description) VALUES
('PPN', 11.00, '2022-04-01', true, 'Pajak Pertambahan Nilai 11%'),
('PPH21', 5.00, '2020-01-01', true, 'PPh Pasal 21 - Pegawai'),
('PPH22', 1.50, '2020-01-01', true, 'PPh Pasal 22 - Impor'),
('PPH23', 2.00, '2020-01-01', true, 'PPh Pasal 23 - Jasa'),
('PPH4(2)', 0.50, '2020-01-01', true, 'PPh Final Pasal 4 ayat 2')
ON CONFLICT DO NOTHING;

CREATE INDEX idx_tax_settings_type ON tax_settings(tax_type);
CREATE INDEX idx_tax_settings_active ON tax_settings(is_active);

ALTER PUBLICATION supabase_realtime ADD TABLE tax_settings;

CREATE OR REPLACE FUNCTION update_tax_calculations()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'sales_transactions' THEN
    NEW.ppn_amount := (NEW.subtotal * NEW.ppn_percentage) / 100;
    NEW.pph_amount := (NEW.subtotal * NEW.pph_percentage) / 100;
    NEW.tax_amount := NEW.ppn_amount + NEW.pph_amount;
    NEW.total_amount := NEW.subtotal + NEW.tax_amount;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_sales_tax ON sales_transactions;
CREATE TRIGGER trigger_update_sales_tax
  BEFORE INSERT OR UPDATE ON sales_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_tax_calculations();

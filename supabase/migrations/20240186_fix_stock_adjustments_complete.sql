-- Drop view yang salah
DROP VIEW IF EXISTS stock_adjustments_with_supplier CASCADE;

-- Add supplier_id column if not exists
ALTER TABLE stock_adjustments 
ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id);

-- Add stock_id column if not exists
ALTER TABLE stock_adjustments 
ADD COLUMN IF NOT EXISTS stock_id UUID REFERENCES stock(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_stock_adjustments_supplier ON stock_adjustments(supplier_id);
CREATE INDEX IF NOT EXISTS idx_stock_adjustments_stock_id ON stock_adjustments(stock_id);

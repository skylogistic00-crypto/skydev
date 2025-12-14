-- Add supplier_id column to stock table
ALTER TABLE stock ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_stock_supplier_id ON stock(supplier_id);

-- Update existing records to link with suppliers based on supplier_name
UPDATE stock s
SET supplier_id = sup.id
FROM suppliers sup
WHERE s.supplier_name = sup.supplier_name
AND s.supplier_id IS NULL;

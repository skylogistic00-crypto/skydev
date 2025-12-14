-- Add warehouse_id column to stock table
ALTER TABLE stock ADD COLUMN IF NOT EXISTS warehouse_id UUID REFERENCES warehouses(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_stock_warehouse_id ON stock(warehouse_id);

-- Update existing records to link with warehouses based on warehouses column (name)
UPDATE stock s
SET warehouse_id = w.id
FROM warehouses w
WHERE s.warehouses = w.name
AND s.warehouse_id IS NULL;

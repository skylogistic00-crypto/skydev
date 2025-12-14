-- Add warehouse_id column to purchase_requests table
ALTER TABLE purchase_requests ADD COLUMN IF NOT EXISTS warehouse_id UUID REFERENCES warehouses(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_purchase_requests_warehouse_id ON purchase_requests(warehouse_id);

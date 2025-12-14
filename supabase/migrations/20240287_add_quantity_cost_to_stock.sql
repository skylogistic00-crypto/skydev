ALTER TABLE stock 
ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS cost_per_unit DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS harga_jual DECIMAL(15,2) DEFAULT 0;

COMMENT ON COLUMN stock.quantity IS 'Current stock quantity';
COMMENT ON COLUMN stock.cost_per_unit IS 'Cost per unit (COGS)';
COMMENT ON COLUMN stock.harga_jual IS 'Selling price per unit';

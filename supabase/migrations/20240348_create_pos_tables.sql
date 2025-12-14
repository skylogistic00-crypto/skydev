CREATE TABLE IF NOT EXISTS pos_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_number TEXT UNIQUE NOT NULL,
    total_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(15,2) DEFAULT 0,
    tax_amount NUMERIC(15,2) DEFAULT 0,
    payment_method TEXT NOT NULL DEFAULT 'cash',
    payment_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    change_amount NUMERIC(15,2) DEFAULT 0,
    customer_name TEXT,
    customer_phone TEXT,
    notes TEXT,
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled', 'refunded')),
    cashier_id UUID,
    cashier_name TEXT,
    transaction_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE pos_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public insert to pos_transactions" ON pos_transactions;
CREATE POLICY "Allow public insert to pos_transactions" ON pos_transactions
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public select from pos_transactions" ON pos_transactions;
CREATE POLICY "Allow public select from pos_transactions" ON pos_transactions
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public update to pos_transactions" ON pos_transactions;
CREATE POLICY "Allow public update to pos_transactions" ON pos_transactions
    FOR UPDATE USING (true);

CREATE INDEX IF NOT EXISTS idx_pos_transactions_number ON pos_transactions(transaction_number);
CREATE INDEX IF NOT EXISTS idx_pos_transactions_date ON pos_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_pos_transactions_status ON pos_transactions(status);

CREATE TABLE IF NOT EXISTS pos_transaction_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID REFERENCES pos_transactions(id) ON DELETE CASCADE,
    product_id UUID,
    sku TEXT,
    product_name TEXT NOT NULL,
    quantity NUMERIC(15,2) NOT NULL DEFAULT 1,
    unit_price NUMERIC(15,2) NOT NULL DEFAULT 0,
    base_price NUMERIC(15,2) DEFAULT 0,
    discount NUMERIC(15,2) DEFAULT 0,
    subtotal NUMERIC(15,2) NOT NULL DEFAULT 0,
    cogs NUMERIC(15,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE pos_transaction_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public insert to pos_transaction_items" ON pos_transaction_items;
CREATE POLICY "Allow public insert to pos_transaction_items" ON pos_transaction_items
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public select from pos_transaction_items" ON pos_transaction_items;
CREATE POLICY "Allow public select from pos_transaction_items" ON pos_transaction_items
    FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_pos_items_transaction ON pos_transaction_items(transaction_id);
CREATE INDEX IF NOT EXISTS idx_pos_items_product ON pos_transaction_items(product_id);
CREATE INDEX IF NOT EXISTS idx_pos_items_sku ON pos_transaction_items(sku);

ALTER TABLE stock ADD COLUMN IF NOT EXISTS barcode TEXT;
ALTER TABLE stock ADD COLUMN IF NOT EXISTS selling_price NUMERIC(15,2);

CREATE INDEX IF NOT EXISTS idx_stock_barcode ON stock(barcode);

CREATE OR REPLACE FUNCTION update_pos_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS pos_transactions_updated_at ON pos_transactions;
CREATE TRIGGER pos_transactions_updated_at
    BEFORE UPDATE ON pos_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_pos_transactions_updated_at();

ALTER TABLE pos_transactions REPLICA IDENTITY FULL;
ALTER TABLE pos_transaction_items REPLICA IDENTITY FULL;

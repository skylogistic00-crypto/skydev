CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku TEXT NOT NULL,
    stock_id UUID,
    movement_type TEXT NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment')),
    quantity NUMERIC(15,2) NOT NULL,
    unit TEXT,
    cost_per_unit NUMERIC(15,2),
    total_cost NUMERIC(15,2),
    reference_type TEXT,
    reference_id UUID,
    reference_number TEXT,
    batch_number TEXT,
    expired_date DATE,
    location TEXT,
    warehouse_id UUID,
    zone_id UUID,
    rack_id UUID,
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public insert to stock_movements" ON stock_movements;
CREATE POLICY "Allow public insert to stock_movements" ON stock_movements
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public select from stock_movements" ON stock_movements;
CREATE POLICY "Allow public select from stock_movements" ON stock_movements
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public update to stock_movements" ON stock_movements;
CREATE POLICY "Allow public update to stock_movements" ON stock_movements
    FOR UPDATE USING (true);

CREATE INDEX IF NOT EXISTS idx_stock_movements_sku ON stock_movements(sku);
CREATE INDEX IF NOT EXISTS idx_stock_movements_stock_id ON stock_movements(stock_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_stock_movements_reference ON stock_movements(reference_type, reference_id);

CREATE OR REPLACE FUNCTION update_stock_movements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS stock_movements_updated_at ON stock_movements;
CREATE TRIGGER stock_movements_updated_at
    BEFORE UPDATE ON stock_movements
    FOR EACH ROW
    EXECUTE FUNCTION update_stock_movements_updated_at();

CREATE OR REPLACE FUNCTION increase_stock(
    p_sku TEXT,
    p_qty NUMERIC,
    p_cost NUMERIC DEFAULT NULL,
    p_batch_number TEXT DEFAULT NULL,
    p_expired_date DATE DEFAULT NULL,
    p_location TEXT DEFAULT NULL,
    p_reference_type TEXT DEFAULT NULL,
    p_reference_id UUID DEFAULT NULL,
    p_reference_number TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_stock_id UUID;
    v_current_qty NUMERIC;
    v_new_qty NUMERIC;
    v_movement_id UUID;
    v_unit TEXT;
    v_total_cost NUMERIC;
BEGIN
    SELECT id, item_quantity, unit INTO v_stock_id, v_current_qty, v_unit
    FROM stock
    WHERE sku = p_sku
    LIMIT 1;

    IF v_stock_id IS NULL THEN
        RAISE EXCEPTION 'SKU % not found in stock table', p_sku;
    END IF;

    v_current_qty := COALESCE(v_current_qty, 0);
    v_new_qty := v_current_qty + p_qty;
    v_total_cost := COALESCE(p_cost, 0) * p_qty;

    UPDATE stock
    SET 
        item_quantity = v_new_qty,
        batch_number = COALESCE(p_batch_number, batch_number),
        expired_date = COALESCE(p_expired_date, expired_date),
        rack_location = COALESCE(p_location, rack_location),
        updated_at = NOW()
    WHERE id = v_stock_id;

    INSERT INTO stock_movements (
        sku,
        stock_id,
        movement_type,
        quantity,
        unit,
        cost_per_unit,
        total_cost,
        reference_type,
        reference_id,
        reference_number,
        batch_number,
        expired_date,
        location,
        notes
    ) VALUES (
        p_sku,
        v_stock_id,
        'in',
        p_qty,
        v_unit,
        p_cost,
        v_total_cost,
        p_reference_type,
        p_reference_id,
        p_reference_number,
        p_batch_number,
        p_expired_date,
        p_location,
        p_notes
    ) RETURNING id INTO v_movement_id;

    RETURN json_build_object(
        'success', true,
        'stock_id', v_stock_id,
        'movement_id', v_movement_id,
        'previous_qty', v_current_qty,
        'new_qty', v_new_qty,
        'quantity_added', p_qty,
        'total_cost', v_total_cost
    );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrease_stock(
    p_sku TEXT,
    p_qty NUMERIC,
    p_reference_type TEXT DEFAULT NULL,
    p_reference_id UUID DEFAULT NULL,
    p_reference_number TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_stock_id UUID;
    v_current_qty NUMERIC;
    v_new_qty NUMERIC;
    v_movement_id UUID;
    v_unit TEXT;
BEGIN
    SELECT id, item_quantity, unit INTO v_stock_id, v_current_qty, v_unit
    FROM stock
    WHERE sku = p_sku
    LIMIT 1;

    IF v_stock_id IS NULL THEN
        RAISE EXCEPTION 'SKU % not found in stock table', p_sku;
    END IF;

    v_current_qty := COALESCE(v_current_qty, 0);

    IF v_current_qty < p_qty THEN
        RAISE EXCEPTION 'Insufficient stock for SKU %. Available: %, Requested: %', p_sku, v_current_qty, p_qty;
    END IF;

    v_new_qty := v_current_qty - p_qty;

    UPDATE stock
    SET 
        item_quantity = v_new_qty,
        updated_at = NOW()
    WHERE id = v_stock_id;

    INSERT INTO stock_movements (
        sku,
        stock_id,
        movement_type,
        quantity,
        unit,
        reference_type,
        reference_id,
        reference_number,
        notes
    ) VALUES (
        p_sku,
        v_stock_id,
        'out',
        p_qty,
        v_unit,
        p_reference_type,
        p_reference_id,
        p_reference_number,
        p_notes
    ) RETURNING id INTO v_movement_id;

    RETURN json_build_object(
        'success', true,
        'stock_id', v_stock_id,
        'movement_id', v_movement_id,
        'previous_qty', v_current_qty,
        'new_qty', v_new_qty,
        'quantity_removed', p_qty
    );
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS accounting_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL CHECK (event_type IN ('grn', 'stock_out', 'adjustment', 'sale', 'purchase', 'payment', 'receipt')),
    reference_type TEXT,
    reference_id UUID,
    reference_number TEXT,
    amount NUMERIC(15,2),
    debit_account TEXT,
    credit_account TEXT,
    description TEXT,
    metadata JSONB,
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE accounting_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public insert to accounting_events" ON accounting_events;
CREATE POLICY "Allow public insert to accounting_events" ON accounting_events
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public select from accounting_events" ON accounting_events;
CREATE POLICY "Allow public select from accounting_events" ON accounting_events
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public update to accounting_events" ON accounting_events;
CREATE POLICY "Allow public update to accounting_events" ON accounting_events
    FOR UPDATE USING (true);

CREATE INDEX IF NOT EXISTS idx_accounting_events_processed ON accounting_events(processed);
CREATE INDEX IF NOT EXISTS idx_accounting_events_reference ON accounting_events(reference_type, reference_id);

CREATE OR REPLACE FUNCTION trigger_grn_accounting_event()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.movement_type = 'in' AND NEW.reference_type = 'grn' THEN
        INSERT INTO accounting_events (
            event_type,
            reference_type,
            reference_id,
            reference_number,
            amount,
            debit_account,
            credit_account,
            description,
            metadata
        ) VALUES (
            'grn',
            'stock_movement',
            NEW.id,
            NEW.reference_number,
            NEW.total_cost,
            '1-10100',
            '2-10100',
            'Penerimaan Barang (GRN) - SKU: ' || NEW.sku,
            json_build_object(
                'sku', NEW.sku,
                'quantity', NEW.quantity,
                'unit', NEW.unit,
                'cost_per_unit', NEW.cost_per_unit,
                'batch_number', NEW.batch_number,
                'location', NEW.location
            )
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_grn_accounting ON stock_movements;
CREATE TRIGGER trigger_grn_accounting
    AFTER INSERT ON stock_movements
    FOR EACH ROW
    EXECUTE FUNCTION trigger_grn_accounting_event();

CREATE OR REPLACE FUNCTION trigger_stock_out_accounting_event()
RETURNS TRIGGER AS $$
DECLARE
    v_avg_cost NUMERIC;
    v_total_value NUMERIC;
BEGIN
    IF NEW.movement_type = 'out' THEN
        SELECT COALESCE(base_price, 0) INTO v_avg_cost
        FROM stock
        WHERE id = NEW.stock_id
        LIMIT 1;

        v_total_value := v_avg_cost * NEW.quantity;

        INSERT INTO accounting_events (
            event_type,
            reference_type,
            reference_id,
            reference_number,
            amount,
            debit_account,
            credit_account,
            description,
            metadata
        ) VALUES (
            'stock_out',
            'stock_movement',
            NEW.id,
            NEW.reference_number,
            v_total_value,
            '5-10100',
            '1-10100',
            'Pengeluaran Barang - SKU: ' || NEW.sku,
            json_build_object(
                'sku', NEW.sku,
                'quantity', NEW.quantity,
                'unit', NEW.unit,
                'avg_cost', v_avg_cost,
                'location', NEW.location
            )
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_stock_out_accounting ON stock_movements;
CREATE TRIGGER trigger_stock_out_accounting
    AFTER INSERT ON stock_movements
    FOR EACH ROW
    EXECUTE FUNCTION trigger_stock_out_accounting_event();

ALTER TABLE stock_movements REPLICA IDENTITY FULL;
ALTER TABLE accounting_events REPLICA IDENTITY FULL;

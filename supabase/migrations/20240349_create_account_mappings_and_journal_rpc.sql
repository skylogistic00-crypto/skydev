CREATE TABLE IF NOT EXISTS account_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_type TEXT UNIQUE NOT NULL CHECK (account_type IN ('cash', 'bank', 'sales', 'inventory', 'cogs', 'accounts_payable', 'expense_adjustment')),
    account_id UUID,
    account_code TEXT NOT NULL,
    account_name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE account_mappings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public insert to account_mappings" ON account_mappings;
CREATE POLICY "Allow public insert to account_mappings" ON account_mappings
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public select from account_mappings" ON account_mappings;
CREATE POLICY "Allow public select from account_mappings" ON account_mappings
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public update to account_mappings" ON account_mappings;
CREATE POLICY "Allow public update to account_mappings" ON account_mappings
    FOR UPDATE USING (true);

INSERT INTO account_mappings (account_type, account_code, account_name, description) VALUES
    ('cash', '1-10100', 'Kas', 'Akun kas untuk transaksi tunai'),
    ('bank', '1-10200', 'Bank', 'Akun bank untuk transaksi non-tunai'),
    ('sales', '4-10100', 'Pendapatan Penjualan', 'Akun pendapatan dari penjualan'),
    ('inventory', '1-10300', 'Persediaan Barang', 'Akun persediaan/inventory'),
    ('cogs', '5-10100', 'Harga Pokok Penjualan', 'Akun HPP/COGS'),
    ('accounts_payable', '2-10100', 'Hutang Usaha', 'Akun hutang dagang'),
    ('expense_adjustment', '5-10200', 'Beban Penyesuaian Stok', 'Akun beban untuk penyesuaian stok')
ON CONFLICT (account_type) DO UPDATE SET
    account_code = EXCLUDED.account_code,
    account_name = EXCLUDED.account_name,
    description = EXCLUDED.description;

CREATE TABLE IF NOT EXISTS integration_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source TEXT NOT NULL,
    action TEXT NOT NULL,
    reference_type TEXT,
    reference_id TEXT,
    reference_number TEXT,
    request_payload JSONB,
    response_payload JSONB,
    status TEXT DEFAULT 'success' CHECK (status IN ('success', 'error', 'skipped')),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE integration_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public insert to integration_logs" ON integration_logs;
CREATE POLICY "Allow public insert to integration_logs" ON integration_logs
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public select from integration_logs" ON integration_logs;
CREATE POLICY "Allow public select from integration_logs" ON integration_logs
    FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_integration_logs_reference ON integration_logs(reference_type, reference_number);
CREATE INDEX IF NOT EXISTS idx_integration_logs_created_at ON integration_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_integration_logs_source ON integration_logs(source);

CREATE OR REPLACE FUNCTION get_account_code(p_account_type TEXT)
RETURNS TEXT AS $$
DECLARE
    v_account_code TEXT;
BEGIN
    SELECT account_code INTO v_account_code
    FROM account_mappings
    WHERE account_type = p_account_type AND is_active = TRUE
    LIMIT 1;
    
    RETURN v_account_code;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION check_journal_exists(p_ref TEXT, p_type TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_exists BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM journal_entries 
        WHERE reference_number = p_ref 
        AND transaction_type = p_type
    ) INTO v_exists;
    
    RETURN COALESCE(v_exists, FALSE);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_journal_from_payload(
    p_ref TEXT,
    p_type TEXT,
    p_lines JSONB,
    p_memo TEXT DEFAULT NULL,
    p_source TEXT DEFAULT 'integration'
)
RETURNS JSON AS $$
DECLARE
    v_journal_id UUID;
    v_line JSONB;
    v_total_debit NUMERIC := 0;
    v_total_credit NUMERIC := 0;
    v_log_id UUID;
    v_exists BOOLEAN;
BEGIN
    SELECT check_journal_exists(p_ref, p_type) INTO v_exists;
    
    IF v_exists THEN
        INSERT INTO integration_logs (
            source, action, reference_type, reference_number,
            request_payload, status, error_message
        ) VALUES (
            p_source, 'create_journal', p_type, p_ref,
            json_build_object('ref', p_ref, 'type', p_type, 'lines', p_lines),
            'skipped', 'Journal already exists for this reference'
        ) RETURNING id INTO v_log_id;
        
        RETURN json_build_object(
            'success', false,
            'error', 'duplicate',
            'message', 'Journal already exists for reference: ' || p_ref,
            'log_id', v_log_id
        );
    END IF;

    FOR v_line IN SELECT * FROM jsonb_array_elements(p_lines)
    LOOP
        v_total_debit := v_total_debit + COALESCE((v_line->>'debit')::NUMERIC, 0);
        v_total_credit := v_total_credit + COALESCE((v_line->>'credit')::NUMERIC, 0);
    END LOOP;

    IF v_total_debit != v_total_credit THEN
        INSERT INTO integration_logs (
            source, action, reference_type, reference_number,
            request_payload, status, error_message
        ) VALUES (
            p_source, 'create_journal', p_type, p_ref,
            json_build_object('ref', p_ref, 'type', p_type, 'lines', p_lines),
            'error', 'Debit and credit totals do not match'
        ) RETURNING id INTO v_log_id;
        
        RETURN json_build_object(
            'success', false,
            'error', 'unbalanced',
            'message', 'Debit (' || v_total_debit || ') and Credit (' || v_total_credit || ') do not match',
            'log_id', v_log_id
        );
    END IF;

    INSERT INTO journal_entries (
        reference_number,
        transaction_type,
        description,
        total_debit,
        total_credit,
        status,
        entry_date
    ) VALUES (
        p_ref,
        p_type,
        COALESCE(p_memo, p_type || ' - ' || p_ref),
        v_total_debit,
        v_total_credit,
        'posted',
        NOW()
    ) RETURNING id INTO v_journal_id;

    FOR v_line IN SELECT * FROM jsonb_array_elements(p_lines)
    LOOP
        INSERT INTO journal_entry_lines (
            journal_entry_id,
            account_code,
            account_name,
            debit,
            credit,
            description
        ) VALUES (
            v_journal_id,
            COALESCE(v_line->>'account_code', ''),
            COALESCE(v_line->>'account_name', ''),
            COALESCE((v_line->>'debit')::NUMERIC, 0),
            COALESCE((v_line->>'credit')::NUMERIC, 0),
            COALESCE(v_line->>'memo', '')
        );
    END LOOP;

    INSERT INTO integration_logs (
        source, action, reference_type, reference_id, reference_number,
        request_payload, response_payload, status
    ) VALUES (
        p_source, 'create_journal', p_type, v_journal_id::TEXT, p_ref,
        json_build_object('ref', p_ref, 'type', p_type, 'lines', p_lines, 'memo', p_memo),
        json_build_object('journal_id', v_journal_id, 'total_debit', v_total_debit, 'total_credit', v_total_credit),
        'success'
    ) RETURNING id INTO v_log_id;

    RETURN json_build_object(
        'success', true,
        'journal_id', v_journal_id,
        'reference', p_ref,
        'type', p_type,
        'total_debit', v_total_debit,
        'total_credit', v_total_credit,
        'log_id', v_log_id
    );
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_number TEXT,
    transaction_type TEXT,
    description TEXT,
    total_debit NUMERIC(15,2) DEFAULT 0,
    total_credit NUMERIC(15,2) DEFAULT 0,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'posted', 'void')),
    entry_date TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public access to journal_entries" ON journal_entries;
CREATE POLICY "Allow public access to journal_entries" ON journal_entries FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_journal_entries_reference ON journal_entries(reference_number, transaction_type);

CREATE TABLE IF NOT EXISTS journal_entry_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_entry_id UUID REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_code TEXT,
    account_name TEXT,
    debit NUMERIC(15,2) DEFAULT 0,
    credit NUMERIC(15,2) DEFAULT 0,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE journal_entry_lines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public access to journal_entry_lines" ON journal_entry_lines;
CREATE POLICY "Allow public access to journal_entry_lines" ON journal_entry_lines FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_journal ON journal_entry_lines(journal_entry_id);

CREATE OR REPLACE FUNCTION trigger_pos_to_accounting()
RETURNS TRIGGER AS $$
DECLARE
    v_cash_account TEXT;
    v_bank_account TEXT;
    v_sales_account TEXT;
    v_inventory_account TEXT;
    v_cogs_account TEXT;
    v_payment_account TEXT;
    v_lines JSONB;
    v_result JSON;
BEGIN
    IF NEW.event_type = 'sale' AND NEW.processed = FALSE THEN
        SELECT account_code INTO v_cash_account FROM account_mappings WHERE account_type = 'cash' AND is_active = TRUE;
        SELECT account_code INTO v_bank_account FROM account_mappings WHERE account_type = 'bank' AND is_active = TRUE;
        SELECT account_code INTO v_sales_account FROM account_mappings WHERE account_type = 'sales' AND is_active = TRUE;
        SELECT account_code INTO v_inventory_account FROM account_mappings WHERE account_type = 'inventory' AND is_active = TRUE;
        SELECT account_code INTO v_cogs_account FROM account_mappings WHERE account_type = 'cogs' AND is_active = TRUE;

        IF (NEW.metadata->>'payment_method') = 'cash' THEN
            v_payment_account := v_cash_account;
        ELSE
            v_payment_account := v_bank_account;
        END IF;

        v_lines := jsonb_build_array(
            jsonb_build_object(
                'account_code', v_payment_account,
                'account_name', CASE WHEN (NEW.metadata->>'payment_method') = 'cash' THEN 'Kas' ELSE 'Bank' END,
                'debit', NEW.amount,
                'credit', 0,
                'memo', 'Penerimaan dari penjualan POS'
            ),
            jsonb_build_object(
                'account_code', v_sales_account,
                'account_name', 'Pendapatan Penjualan',
                'debit', 0,
                'credit', NEW.amount,
                'memo', 'Pendapatan penjualan POS'
            )
        );

        IF (NEW.metadata->>'cogs')::NUMERIC > 0 THEN
            v_lines := v_lines || jsonb_build_array(
                jsonb_build_object(
                    'account_code', v_cogs_account,
                    'account_name', 'Harga Pokok Penjualan',
                    'debit', (NEW.metadata->>'cogs')::NUMERIC,
                    'credit', 0,
                    'memo', 'HPP penjualan POS'
                ),
                jsonb_build_object(
                    'account_code', v_inventory_account,
                    'account_name', 'Persediaan Barang',
                    'debit', 0,
                    'credit', (NEW.metadata->>'cogs')::NUMERIC,
                    'memo', 'Pengurangan persediaan dari penjualan'
                )
            );
        END IF;

        SELECT create_journal_from_payload(
            NEW.reference_number,
            'SALE',
            v_lines,
            'Jurnal Penjualan POS - ' || NEW.reference_number,
            'pos_trigger'
        ) INTO v_result;

        UPDATE accounting_events SET processed = TRUE, processed_at = NOW() WHERE id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_pos_accounting ON accounting_events;
CREATE TRIGGER trigger_pos_accounting
    AFTER INSERT ON accounting_events
    FOR EACH ROW
    WHEN (NEW.event_type = 'sale')
    EXECUTE FUNCTION trigger_pos_to_accounting();

CREATE OR REPLACE FUNCTION trigger_grn_to_accounting()
RETURNS TRIGGER AS $$
DECLARE
    v_inventory_account TEXT;
    v_ap_account TEXT;
    v_lines JSONB;
    v_result JSON;
BEGIN
    IF NEW.event_type = 'grn' AND NEW.processed = FALSE THEN
        SELECT account_code INTO v_inventory_account FROM account_mappings WHERE account_type = 'inventory' AND is_active = TRUE;
        SELECT account_code INTO v_ap_account FROM account_mappings WHERE account_type = 'accounts_payable' AND is_active = TRUE;

        v_lines := jsonb_build_array(
            jsonb_build_object(
                'account_code', v_inventory_account,
                'account_name', 'Persediaan Barang',
                'debit', NEW.amount,
                'credit', 0,
                'memo', 'Penerimaan barang - ' || COALESCE(NEW.metadata->>'sku', '')
            ),
            jsonb_build_object(
                'account_code', v_ap_account,
                'account_name', 'Hutang Usaha',
                'debit', 0,
                'credit', NEW.amount,
                'memo', 'Hutang pembelian barang'
            )
        );

        SELECT create_journal_from_payload(
            NEW.reference_number,
            'PURCHASE',
            v_lines,
            'Jurnal Penerimaan Barang (GRN) - ' || NEW.reference_number,
            'grn_trigger'
        ) INTO v_result;

        UPDATE accounting_events SET processed = TRUE, processed_at = NOW() WHERE id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_grn_accounting ON accounting_events;
CREATE TRIGGER trigger_grn_accounting
    AFTER INSERT ON accounting_events
    FOR EACH ROW
    WHEN (NEW.event_type = 'grn')
    EXECUTE FUNCTION trigger_grn_to_accounting();

CREATE OR REPLACE FUNCTION trigger_stock_adjustment_to_accounting()
RETURNS TRIGGER AS $$
DECLARE
    v_inventory_account TEXT;
    v_expense_account TEXT;
    v_lines JSONB;
    v_result JSON;
BEGIN
    IF NEW.event_type = 'stock_out' AND NEW.processed = FALSE AND NEW.reference_type != 'pos_transaction' THEN
        SELECT account_code INTO v_inventory_account FROM account_mappings WHERE account_type = 'inventory' AND is_active = TRUE;
        SELECT account_code INTO v_expense_account FROM account_mappings WHERE account_type = 'expense_adjustment' AND is_active = TRUE;

        v_lines := jsonb_build_array(
            jsonb_build_object(
                'account_code', v_expense_account,
                'account_name', 'Beban Penyesuaian Stok',
                'debit', NEW.amount,
                'credit', 0,
                'memo', 'Penyesuaian/pengeluaran stok - ' || COALESCE(NEW.metadata->>'sku', '')
            ),
            jsonb_build_object(
                'account_code', v_inventory_account,
                'account_name', 'Persediaan Barang',
                'debit', 0,
                'credit', NEW.amount,
                'memo', 'Pengurangan persediaan dari penyesuaian'
            )
        );

        SELECT create_journal_from_payload(
            NEW.reference_number,
            'STOCK_ADJ',
            v_lines,
            'Jurnal Penyesuaian Stok - ' || NEW.reference_number,
            'stock_adj_trigger'
        ) INTO v_result;

        UPDATE accounting_events SET processed = TRUE, processed_at = NOW() WHERE id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_stock_adj_accounting ON accounting_events;
CREATE TRIGGER trigger_stock_adj_accounting
    AFTER INSERT ON accounting_events
    FOR EACH ROW
    WHEN (NEW.event_type = 'stock_out')
    EXECUTE FUNCTION trigger_stock_adjustment_to_accounting();

CREATE OR REPLACE FUNCTION update_account_mappings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS account_mappings_updated_at ON account_mappings;
CREATE TRIGGER account_mappings_updated_at
    BEFORE UPDATE ON account_mappings
    FOR EACH ROW
    EXECUTE FUNCTION update_account_mappings_updated_at();

ALTER TABLE account_mappings REPLICA IDENTITY FULL;
ALTER TABLE integration_logs REPLICA IDENTITY FULL;
ALTER TABLE journal_entries REPLICA IDENTITY FULL;
ALTER TABLE journal_entry_lines REPLICA IDENTITY FULL;

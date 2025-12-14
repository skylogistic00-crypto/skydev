-- ========================================
-- SISTEM AKUNTANSI TERINTEGRASI
-- Menghubungkan Chart of Accounts dengan semua transaksi
-- ========================================

-- 1. Update service_items table - add COA references
ALTER TABLE service_items 
  ADD COLUMN IF NOT EXISTS coa_revenue_code TEXT,
  ADD COLUMN IF NOT EXISTS coa_expense_code TEXT;

COMMENT ON COLUMN service_items.coa_revenue_code IS 'Akun pendapatan untuk jasa ini';
COMMENT ON COLUMN service_items.coa_expense_code IS 'Akun beban untuk jasa ini (jika ada)';

-- 2. Update inventory_items table - add COA references
ALTER TABLE inventory_items 
  ADD COLUMN IF NOT EXISTS coa_inventory_code TEXT,
  ADD COLUMN IF NOT EXISTS coa_cogs_code TEXT;

COMMENT ON COLUMN inventory_items.coa_inventory_code IS 'Akun persediaan barang';
COMMENT ON COLUMN inventory_items.coa_cogs_code IS 'Akun harga pokok penjualan';

-- 3. Create tax_transactions table
CREATE TABLE IF NOT EXISTS tax_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  tax_type TEXT NOT NULL CHECK (tax_type IN ('PPN Masukan', 'PPN Keluaran', 'PPh 21', 'PPh 23', 'PPh 25', 'PPh 29', 'PPh 4(2)')),
  amount DECIMAL(15,2) NOT NULL,
  coa_tax_code TEXT NOT NULL,
  coa_tax_name TEXT,
  related_transaction_id UUID,
  related_doc_no TEXT,
  description TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE tax_transactions IS 'Tabel untuk mencatat semua transaksi pajak';
COMMENT ON COLUMN tax_transactions.tax_type IS 'Jenis pajak (PPN Masukan/Keluaran, PPh)';
COMMENT ON COLUMN tax_transactions.coa_tax_code IS 'Kode akun pajak di COA';
COMMENT ON COLUMN tax_transactions.related_transaction_id IS 'ID transaksi terkait (sales, purchase, dll)';

-- 4. Update sales_transactions table - add more COA references
ALTER TABLE sales_transactions 
  ADD COLUMN IF NOT EXISTS coa_cash_code TEXT,
  ADD COLUMN IF NOT EXISTS coa_revenue_code TEXT,
  ADD COLUMN IF NOT EXISTS coa_cogs_code TEXT,
  ADD COLUMN IF NOT EXISTS coa_inventory_code TEXT,
  ADD COLUMN IF NOT EXISTS coa_tax_code TEXT;

COMMENT ON COLUMN sales_transactions.coa_cash_code IS 'Akun kas/piutang (debit)';
COMMENT ON COLUMN sales_transactions.coa_revenue_code IS 'Akun pendapatan (kredit)';
COMMENT ON COLUMN sales_transactions.coa_cogs_code IS 'Akun HPP (debit) - untuk barang';
COMMENT ON COLUMN sales_transactions.coa_inventory_code IS 'Akun persediaan (kredit) - untuk barang';
COMMENT ON COLUMN sales_transactions.coa_tax_code IS 'Akun pajak (kredit)';

-- 5. Update internal_usage table - add COA references
ALTER TABLE internal_usage 
  ADD COLUMN IF NOT EXISTS coa_expense_code TEXT,
  ADD COLUMN IF NOT EXISTS coa_inventory_code TEXT;

COMMENT ON COLUMN internal_usage.coa_expense_code IS 'Akun beban (debit)';
COMMENT ON COLUMN internal_usage.coa_inventory_code IS 'Akun persediaan (kredit)';

-- 6. Update journal_entries table structure
DO $$
BEGIN
  -- Drop old columns if they exist
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'journal_entries' AND column_name = 'debit_account_id') THEN
    ALTER TABLE journal_entries DROP COLUMN debit_account_id;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'journal_entries' AND column_name = 'credit_account_id') THEN
    ALTER TABLE journal_entries DROP COLUMN credit_account_id;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'journal_entries' AND column_name = 'amount') THEN
    ALTER TABLE journal_entries DROP COLUMN amount;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'journal_entries' AND column_name = 'reference_no') THEN
    ALTER TABLE journal_entries DROP COLUMN reference_no;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'journal_entries' AND column_name = 'date') THEN
    ALTER TABLE journal_entries DROP COLUMN date;
  END IF;
END $$;

ALTER TABLE journal_entries 
  ADD COLUMN IF NOT EXISTS account_code TEXT NOT NULL DEFAULT '1-1100',
  ADD COLUMN IF NOT EXISTS account_name TEXT,
  ADD COLUMN IF NOT EXISTS debit DECIMAL(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS credit DECIMAL(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS transaction_id TEXT,
  ADD COLUMN IF NOT EXISTS transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS created_by TEXT;

COMMENT ON TABLE journal_entries IS 'Tabel jurnal umum - setiap baris adalah 1 entri (debit atau kredit)';
COMMENT ON COLUMN journal_entries.transaction_id IS 'ID transaksi sumber (SALE-xxx, USAGE-xxx, dll)';
COMMENT ON COLUMN journal_entries.account_code IS 'Kode akun COA';
COMMENT ON COLUMN journal_entries.debit IS 'Jumlah debit (0 jika kredit)';
COMMENT ON COLUMN journal_entries.credit IS 'Jumlah kredit (0 jika debit)';

-- 7. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_service_items_coa_revenue ON service_items(coa_revenue_code);
CREATE INDEX IF NOT EXISTS idx_service_items_coa_expense ON service_items(coa_expense_code);
CREATE INDEX IF NOT EXISTS idx_inventory_items_coa_inventory ON inventory_items(coa_inventory_code);
CREATE INDEX IF NOT EXISTS idx_inventory_items_coa_cogs ON inventory_items(coa_cogs_code);
CREATE INDEX IF NOT EXISTS idx_tax_transactions_coa ON tax_transactions(coa_tax_code);
CREATE INDEX IF NOT EXISTS idx_tax_transactions_date ON tax_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_sales_transactions_coa_cash ON sales_transactions(coa_cash_code);
CREATE INDEX IF NOT EXISTS idx_sales_transactions_coa_revenue ON sales_transactions(coa_revenue_code);
CREATE INDEX IF NOT EXISTS idx_journal_entries_account_code ON journal_entries(account_code);
CREATE INDEX IF NOT EXISTS idx_journal_entries_transaction_id ON journal_entries(transaction_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON journal_entries(transaction_date);

-- 8. Enable realtime for tax_transactions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'tax_transactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE tax_transactions;
  END IF;
END $$;

-- 9. Update existing service_items with default COA mappings
UPDATE service_items 
SET 
  coa_revenue_code = '4-2100',
  coa_expense_code = '6-5400'
WHERE coa_revenue_code IS NULL;

-- 10. Update existing inventory_items with default COA mappings
UPDATE inventory_items 
SET 
  coa_inventory_code = '1-1410',
  coa_cogs_code = '5-1100'
WHERE coa_inventory_code IS NULL;
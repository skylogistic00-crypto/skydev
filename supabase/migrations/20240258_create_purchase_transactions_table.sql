CREATE TABLE IF NOT EXISTS purchase_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  transaction_date DATE NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('Barang', 'Jasa')),
  
  item_name TEXT,
  brand TEXT,
  supplier_name TEXT,
  
  quantity NUMERIC(15,2) DEFAULT 1,
  unit_price NUMERIC(15,2) NOT NULL,
  subtotal NUMERIC(15,2) NOT NULL,
  
  ppn_percentage NUMERIC(5,2) DEFAULT 11,
  ppn_amount NUMERIC(15,2) DEFAULT 0,
  total_amount NUMERIC(15,2) NOT NULL,
  
  payment_method TEXT CHECK (payment_method IN ('Tunai', 'Hutang')),
  
  coa_cash_code TEXT,
  coa_expense_code TEXT,
  coa_inventory_code TEXT,
  coa_payable_code TEXT,
  coa_tax_code TEXT,
  
  notes TEXT,
  journal_ref TEXT,
  
  CONSTRAINT fk_coa_cash FOREIGN KEY (coa_cash_code) REFERENCES chart_of_accounts(account_code),
  CONSTRAINT fk_coa_expense FOREIGN KEY (coa_expense_code) REFERENCES chart_of_accounts(account_code),
  CONSTRAINT fk_coa_inventory FOREIGN KEY (coa_inventory_code) REFERENCES chart_of_accounts(account_code),
  CONSTRAINT fk_coa_payable FOREIGN KEY (coa_payable_code) REFERENCES chart_of_accounts(account_code),
  CONSTRAINT fk_coa_tax FOREIGN KEY (coa_tax_code) REFERENCES chart_of_accounts(account_code)
);

CREATE INDEX idx_purchase_transactions_date ON purchase_transactions(transaction_date);
CREATE INDEX idx_purchase_transactions_supplier ON purchase_transactions(supplier_name);
CREATE INDEX idx_purchase_transactions_item ON purchase_transactions(item_name);
CREATE INDEX idx_purchase_transactions_journal_ref ON purchase_transactions(journal_ref);

DROP POLICY IF EXISTS purchase_transactions_select ON purchase_transactions;
CREATE POLICY purchase_transactions_select ON purchase_transactions FOR SELECT USING (true);

DROP POLICY IF EXISTS purchase_transactions_insert ON purchase_transactions;
CREATE POLICY purchase_transactions_insert ON purchase_transactions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS purchase_transactions_update ON purchase_transactions;
CREATE POLICY purchase_transactions_update ON purchase_transactions FOR UPDATE USING (true);

DROP POLICY IF EXISTS purchase_transactions_delete ON purchase_transactions;
CREATE POLICY purchase_transactions_delete ON purchase_transactions FOR DELETE USING (true);

ALTER TABLE purchase_transactions ENABLE ROW LEVEL SECURITY;

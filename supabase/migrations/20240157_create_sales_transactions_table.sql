-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create sales_transactions table
CREATE TABLE IF NOT EXISTS sales_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('Barang', 'Jasa')),
  item_id UUID REFERENCES inventory_items(id),
  item_name TEXT NOT NULL,
  stock_before INTEGER,
  quantity INTEGER NOT NULL,
  stock_after INTEGER,
  unit_price DECIMAL(15,2) NOT NULL,
  subtotal DECIMAL(15,2) NOT NULL,
  tax_percentage DECIMAL(5,2) DEFAULT 11,
  tax_amount DECIMAL(15,2),
  total_amount DECIMAL(15,2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('Tunai', 'Transfer', 'Kartu Kredit', 'Piutang')),
  customer_id UUID REFERENCES customers(id),
  customer_name TEXT,
  coa_account_code TEXT,
  coa_account_name TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable realtime for new tables only
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'customers'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE customers;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'sales_transactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE sales_transactions;
  END IF;
END $$;

-- Insert sample customers
INSERT INTO customers (name, email, phone, address) VALUES
  ('PT. Maju Jaya', 'info@majujaya.com', '021-12345678', 'Jakarta Pusat'),
  ('CV. Berkah Sejahtera', 'contact@berkah.com', '021-87654321', 'Jakarta Selatan'),
  ('UD. Sumber Rezeki', 'admin@sumberrezeki.com', '021-11223344', 'Jakarta Timur')
ON CONFLICT DO NOTHING;
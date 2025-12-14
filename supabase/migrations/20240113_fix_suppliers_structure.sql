DROP TABLE IF EXISTS suppliers CASCADE;

CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_code TEXT NOT NULL UNIQUE,
  supplier_name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  email TEXT NOT NULL,
  city TEXT,
  country TEXT,
  is_pkp TEXT,
  tax_id TEXT,
  bank_name TEXT,
  bank_account_holder TEXT,
  payment_terms TEXT,
  category TEXT,
  currency TEXT NOT NULL DEFAULT 'IDR',
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

alter publication supabase_realtime add table suppliers;

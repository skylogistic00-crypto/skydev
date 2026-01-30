CREATE TABLE IF NOT EXISTS public.deliveriesx (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_no TEXT NOT NULL UNIQUE,
  sales_order_id UUID NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  delivery_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

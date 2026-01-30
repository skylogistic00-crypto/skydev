CREATE TABLE IF NOT EXISTS currenciesx (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  symbol TEXT,
  precision SMALLINT NOT NULL DEFAULT 2,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS currency_ratesx (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  currency_id UUID NOT NULL REFERENCES currenciesx(id) ON DELETE CASCADE,
  rate_to_base NUMERIC(18, 8) NOT NULL,
  valid_from TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS currency_ratesx_currency_valid_from_uidx
  ON currency_ratesx(currency_id, valid_from);

CREATE TABLE IF NOT EXISTS warehousesx (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  default_currency_id UUID REFERENCES currenciesx(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS locationsx (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id UUID NOT NULL REFERENCES warehousesx(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS locationsx_warehouse_code_uidx
  ON locationsx(warehouse_id, code);

CREATE TABLE IF NOT EXISTS payment_termsx (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  days_due INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS taxesx (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  rate NUMERIC(7, 4) NOT NULL,
  inclusive BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS uomsx (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS partnersx (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  billing_address TEXT,
  shipping_address TEXT,
  tax_id TEXT,
  payment_terms_id UUID REFERENCES payment_termsx(id),
  is_customer BOOLEAN NOT NULL DEFAULT true,
  is_vendor BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS productsx (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  uom_id UUID REFERENCES uomsx(id),
  default_price NUMERIC(18, 2) NOT NULL DEFAULT 0,
  default_currency_id UUID REFERENCES currenciesx(id),
  tax_id UUID REFERENCES taxesx(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quotationsx (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_no TEXT UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES partnersx(id),
  status TEXT NOT NULL DEFAULT 'draft',
  quotation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE,
  currency_id UUID NOT NULL REFERENCES currenciesx(id),
  exchange_rate NUMERIC(18, 8) NOT NULL DEFAULT 1,
  payment_terms_id UUID REFERENCES payment_termsx(id),
  warehouse_id UUID REFERENCES warehousesx(id),
  subtotal NUMERIC(18, 2) NOT NULL DEFAULT 0,
  tax_total NUMERIC(18, 2) NOT NULL DEFAULT 0,
  grand_total NUMERIC(18, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quotation_linesx (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID NOT NULL REFERENCES quotationsx(id) ON DELETE CASCADE,
  product_id UUID REFERENCES productsx(id),
  description TEXT,
  qty NUMERIC(18, 4) NOT NULL DEFAULT 1,
  uom_id UUID REFERENCES uomsx(id),
  unit_price NUMERIC(18, 2) NOT NULL DEFAULT 0,
  discount_pct NUMERIC(7, 4) NOT NULL DEFAULT 0,
  tax_id UUID REFERENCES taxesx(id),
  line_subtotal NUMERIC(18, 2) NOT NULL DEFAULT 0,
  line_tax NUMERIC(18, 2) NOT NULL DEFAULT 0,
  line_total NUMERIC(18, 2) NOT NULL DEFAULT 0,
  requested_warehouse_id UUID REFERENCES warehousesx(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS quotation_linesx_quotation_id_idx
  ON quotation_linesx(quotation_id);

CREATE TABLE IF NOT EXISTS sales_ordersx (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  so_no TEXT UNIQUE NOT NULL,
  source_quotation_id UUID REFERENCES quotationsx(id),
  customer_id UUID NOT NULL REFERENCES partnersx(id),
  status TEXT NOT NULL DEFAULT 'draft',
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  currency_id UUID NOT NULL REFERENCES currenciesx(id),
  exchange_rate NUMERIC(18, 8) NOT NULL DEFAULT 1,
  invoice_policy TEXT NOT NULL DEFAULT 'on_order',
  warehouse_id UUID REFERENCES warehousesx(id),
  subtotal NUMERIC(18, 2) NOT NULL DEFAULT 0,
  tax_total NUMERIC(18, 2) NOT NULL DEFAULT 0,
  grand_total NUMERIC(18, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales_order_linesx (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_order_id UUID NOT NULL REFERENCES sales_ordersx(id) ON DELETE CASCADE,
  product_id UUID REFERENCES productsx(id),
  description TEXT,
  product_type TEXT,
  qty_ordered NUMERIC(18, 4) NOT NULL DEFAULT 1,
  uom_id UUID REFERENCES uomsx(id),
  unit_price NUMERIC(18, 2) NOT NULL DEFAULT 0,
  discount_pct NUMERIC(7, 4) NOT NULL DEFAULT 0,
  qty_delivered NUMERIC(18, 4) NOT NULL DEFAULT 0,
  qty_invoiced NUMERIC(18, 4) NOT NULL DEFAULT 0,
  tax_id UUID REFERENCES taxesx(id),
  line_subtotal NUMERIC(18, 2) NOT NULL DEFAULT 0,
  line_tax NUMERIC(18, 2) NOT NULL DEFAULT 0,
  line_total NUMERIC(18, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sales_order_linesx_sales_order_id_idx
  ON sales_order_linesx(sales_order_id);

CREATE TABLE IF NOT EXISTS pickingsx (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  picking_no TEXT UNIQUE NOT NULL,
  sales_order_id UUID NOT NULL REFERENCES sales_ordersx(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES warehousesx(id),
  status TEXT NOT NULL DEFAULT 'waiting',
  scheduled_date TIMESTAMPTZ,
  done_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stock_movesx (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  picking_id UUID NOT NULL REFERENCES pickingsx(id) ON DELETE CASCADE,
  sales_order_line_id UUID REFERENCES sales_order_linesx(id),
  product_id UUID REFERENCES productsx(id),
  qty NUMERIC(18, 4) NOT NULL DEFAULT 1,
  uom_id UUID REFERENCES uomsx(id),
  source_location_id UUID REFERENCES locationsx(id),
  dest_location_id UUID REFERENCES locationsx(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stock_quantsx (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id UUID NOT NULL REFERENCES warehousesx(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locationsx(id),
  product_id UUID NOT NULL REFERENCES productsx(id) ON DELETE CASCADE,
  qty_on_hand NUMERIC(18, 4) NOT NULL DEFAULT 0,
  qty_reserved NUMERIC(18, 4) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS stock_quantsx_unique_uidx
  ON stock_quantsx(warehouse_id, location_id, product_id);

CREATE TABLE IF NOT EXISTS service_fulfillmentsx (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fulfillment_no TEXT UNIQUE NOT NULL,
  sales_order_id UUID NOT NULL REFERENCES sales_ordersx(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'planned',
  start_date DATE,
  end_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS service_fulfillment_linesx (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_fulfillment_id UUID NOT NULL REFERENCES service_fulfillmentsx(id) ON DELETE CASCADE,
  sales_order_line_id UUID NOT NULL REFERENCES sales_order_linesx(id) ON DELETE CASCADE,
  product_id UUID REFERENCES productsx(id),
  qty_done NUMERIC(18, 4) NOT NULL DEFAULT 0,
  uom_id UUID REFERENCES uomsx(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoicesx (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_no TEXT UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES partnersx(id),
  source_sales_order_id UUID REFERENCES sales_ordersx(id),
  status TEXT NOT NULL DEFAULT 'draft',
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  currency_id UUID NOT NULL REFERENCES currenciesx(id),
  exchange_rate NUMERIC(18, 8) NOT NULL DEFAULT 1,
  subtotal NUMERIC(18, 2) NOT NULL DEFAULT 0,
  tax_total NUMERIC(18, 2) NOT NULL DEFAULT 0,
  grand_total NUMERIC(18, 2) NOT NULL DEFAULT 0,
  amount_due NUMERIC(18, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoice_linesx (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoicesx(id) ON DELETE CASCADE,
  sales_order_line_id UUID REFERENCES sales_order_linesx(id),
  stock_move_id UUID REFERENCES stock_movesx(id),
  service_fulfillment_line_id UUID REFERENCES service_fulfillment_linesx(id),
  product_id UUID REFERENCES productsx(id),
  description TEXT,
  qty NUMERIC(18, 4) NOT NULL DEFAULT 1,
  uom_id UUID REFERENCES uomsx(id),
  unit_price NUMERIC(18, 2) NOT NULL DEFAULT 0,
  discount_pct NUMERIC(7, 4) NOT NULL DEFAULT 0,
  tax_id UUID REFERENCES taxesx(id),
  is_down_payment BOOLEAN NOT NULL DEFAULT false,
  line_subtotal NUMERIC(18, 2) NOT NULL DEFAULT 0,
  line_tax NUMERIC(18, 2) NOT NULL DEFAULT 0,
  line_total NUMERIC(18, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS paymentsx (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_no TEXT UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES partnersx(id),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  currency_id UUID NOT NULL REFERENCES currenciesx(id),
  exchange_rate NUMERIC(18, 8) NOT NULL DEFAULT 1,
  amount NUMERIC(18, 2) NOT NULL DEFAULT 0,
  method TEXT,
  reference TEXT,
  status TEXT NOT NULL DEFAULT 'received',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_allocationsx (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES paymentsx(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES invoicesx(id) ON DELETE CASCADE,
  amount_applied NUMERIC(18, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS payment_allocationsx_unique_uidx
  ON payment_allocationsx(payment_id, invoice_id);

ALTER TABLE IF EXISTS currenciesx REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS currency_ratesx REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS warehousesx REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS locationsx REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS payment_termsx REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS taxesx REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS uomsx REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS partnersx REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS productsx REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS quotationsx REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS quotation_linesx REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS sales_ordersx REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS sales_order_linesx REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS pickingsx REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS stock_movesx REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS stock_quantsx REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS service_fulfillmentsx REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS service_fulfillment_linesx REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS invoicesx REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS invoice_linesx REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS paymentsx REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS payment_allocationsx REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE currenciesx;
ALTER PUBLICATION supabase_realtime ADD TABLE currency_ratesx;
ALTER PUBLICATION supabase_realtime ADD TABLE warehousesx;
ALTER PUBLICATION supabase_realtime ADD TABLE locationsx;
ALTER PUBLICATION supabase_realtime ADD TABLE payment_termsx;
ALTER PUBLICATION supabase_realtime ADD TABLE taxesx;
ALTER PUBLICATION supabase_realtime ADD TABLE uomsx;
ALTER PUBLICATION supabase_realtime ADD TABLE partnersx;
ALTER PUBLICATION supabase_realtime ADD TABLE productsx;
ALTER PUBLICATION supabase_realtime ADD TABLE quotationsx;
ALTER PUBLICATION supabase_realtime ADD TABLE quotation_linesx;
ALTER PUBLICATION supabase_realtime ADD TABLE sales_ordersx;
ALTER PUBLICATION supabase_realtime ADD TABLE sales_order_linesx;
ALTER PUBLICATION supabase_realtime ADD TABLE pickingsx;
ALTER PUBLICATION supabase_realtime ADD TABLE stock_movesx;
ALTER PUBLICATION supabase_realtime ADD TABLE stock_quantsx;
ALTER PUBLICATION supabase_realtime ADD TABLE service_fulfillmentsx;
ALTER PUBLICATION supabase_realtime ADD TABLE service_fulfillment_linesx;
ALTER PUBLICATION supabase_realtime ADD TABLE invoicesx;
ALTER PUBLICATION supabase_realtime ADD TABLE invoice_linesx;
ALTER PUBLICATION supabase_realtime ADD TABLE paymentsx;
ALTER PUBLICATION supabase_realtime ADD TABLE payment_allocationsx;

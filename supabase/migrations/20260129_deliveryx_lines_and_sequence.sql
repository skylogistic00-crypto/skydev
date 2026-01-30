CREATE TABLE IF NOT EXISTS public.deliveryx_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID NOT NULL REFERENCES public.deliveriesx(id) ON DELETE CASCADE,
  product_id UUID,
  product_name TEXT NOT NULL,
  qty NUMERIC NOT NULL DEFAULT 0,
  uom TEXT NOT NULL DEFAULT 'Unit',
  unit_price NUMERIC,
  notes TEXT,
  line_no INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deliveryx_lines_delivery_id ON public.deliveryx_lines(delivery_id);

CREATE TABLE IF NOT EXISTS public.deliveryx_sequences (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  seq_date DATE NOT NULL DEFAULT CURRENT_DATE,
  last_number INT NOT NULL DEFAULT 0,
  UNIQUE (seq_date)
);

CREATE OR REPLACE FUNCTION public.next_deliveryx_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  d DATE := CURRENT_DATE;
  next_num INT;
  result TEXT;
BEGIN
  INSERT INTO public.deliveryx_sequences (seq_date, last_number)
  VALUES (d, 0)
  ON CONFLICT (seq_date) DO NOTHING;

  UPDATE public.deliveryx_sequences
  SET last_number = last_number + 1
  WHERE seq_date = d
  RETURNING last_number INTO next_num;

  result := 'DOX/' || TO_CHAR(d, 'YYYY') || '/' || TO_CHAR(d, 'MM') || '/' || LPAD(next_num::TEXT, 4, '0');
  RETURN result;
END;
$$;

ALTER TABLE public.deliveriesx
  ADD COLUMN IF NOT EXISTS customer_name TEXT,
  ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS done_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS origin_ref TEXT;

ALTER TABLE public.deliveriesx
  ALTER COLUMN delivery_no SET DEFAULT public.next_deliveryx_number();

ALTER TABLE public.deliveriesx
  ALTER COLUMN status SET DEFAULT 'draft';

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_deliveriesx_set_updated_at ON public.deliveriesx;
CREATE TRIGGER trg_deliveriesx_set_updated_at
  BEFORE UPDATE ON public.deliveriesx
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

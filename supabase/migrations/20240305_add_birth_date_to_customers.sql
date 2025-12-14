ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS birth_date DATE;

COMMENT ON TABLE public.customers IS 'Customer information with birth_date - updated 2025-01-25';

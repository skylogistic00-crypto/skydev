ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS bank_mutation_id UUID;

ALTER TABLE public.tax_invoices
  ADD COLUMN IF NOT EXISTS bank_mutation_id UUID;

ALTER TABLE public.invoices
  DROP CONSTRAINT IF EXISTS invoices_bank_mutation_id_fkey;
ALTER TABLE public.invoices
  ADD CONSTRAINT invoices_bank_mutation_id_fkey
  FOREIGN KEY (bank_mutation_id)
  REFERENCES public.bank_mutations(id)
  ON DELETE CASCADE;

ALTER TABLE public.tax_invoices
  DROP CONSTRAINT IF EXISTS tax_invoices_bank_mutation_id_fkey;
ALTER TABLE public.tax_invoices
  ADD CONSTRAINT tax_invoices_bank_mutation_id_fkey
  FOREIGN KEY (bank_mutation_id)
  REFERENCES public.bank_mutations(id)
  ON DELETE CASCADE;

ALTER TABLE public.transaction_links
  DROP CONSTRAINT IF EXISTS transaction_links_bank_mutation_id_fkey;
ALTER TABLE public.transaction_links
  ADD CONSTRAINT transaction_links_bank_mutation_id_fkey
  FOREIGN KEY (bank_mutation_id)
  REFERENCES public.bank_mutations(id)
  ON DELETE CASCADE;

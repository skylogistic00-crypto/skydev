ALTER TABLE public.transaction_links
  ADD CONSTRAINT transaction_links_bank_mutation_id_key UNIQUE (bank_mutation_id);

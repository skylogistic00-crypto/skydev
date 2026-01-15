ALTER TABLE bank_mutations ADD COLUMN IF NOT EXISTS invoice_storage_bucket TEXT;
ALTER TABLE bank_mutations ADD COLUMN IF NOT EXISTS invoice_file_path TEXT;

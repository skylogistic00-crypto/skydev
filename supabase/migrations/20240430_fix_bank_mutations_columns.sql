DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bank_mutations' AND column_name = 'upload_id') THEN
    ALTER TABLE bank_mutations ADD COLUMN upload_id UUID;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bank_mutations' AND column_name = 'bank_account_id') THEN
    ALTER TABLE bank_mutations ADD COLUMN bank_account_id UUID;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bank_mutations' AND column_name = 'bank_account_code') THEN
    ALTER TABLE bank_mutations ADD COLUMN bank_account_code TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bank_mutations' AND column_name = 'bank_account_name') THEN
    ALTER TABLE bank_mutations ADD COLUMN bank_account_name TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bank_mutations' AND column_name = 'mutation_date') THEN
    ALTER TABLE bank_mutations ADD COLUMN mutation_date DATE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bank_mutations' AND column_name = 'description') THEN
    ALTER TABLE bank_mutations ADD COLUMN description TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bank_mutations' AND column_name = 'debit') THEN
    ALTER TABLE bank_mutations ADD COLUMN debit DECIMAL(18,2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bank_mutations' AND column_name = 'credit') THEN
    ALTER TABLE bank_mutations ADD COLUMN credit DECIMAL(18,2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bank_mutations' AND column_name = 'balance') THEN
    ALTER TABLE bank_mutations ADD COLUMN balance DECIMAL(18,2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bank_mutations' AND column_name = 'created_by') THEN
    ALTER TABLE bank_mutations ADD COLUMN created_by UUID;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bank_mutations' AND column_name = 'created_at') THEN
    ALTER TABLE bank_mutations ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bank_mutations' AND column_name = 'updated_at') THEN
    ALTER TABLE bank_mutations ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_bank_mutations_upload_id ON bank_mutations(upload_id);
CREATE INDEX IF NOT EXISTS idx_bank_mutations_mutation_date ON bank_mutations(mutation_date);

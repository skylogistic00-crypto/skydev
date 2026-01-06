CREATE TABLE IF NOT EXISTS public.capital_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_date DATE NOT NULL,
  amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  description TEXT,
  payment_method TEXT,
  debit_account_code TEXT,
  debit_account_name TEXT,
  credit_account_code TEXT,
  credit_account_name TEXT,
  reference_no TEXT,
  bukti_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID DEFAULT auth.uid()
);

CREATE INDEX IF NOT EXISTS idx_capital_contributions_transaction_date ON public.capital_contributions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_capital_contributions_created_by ON public.capital_contributions(created_by);

CREATE OR REPLACE FUNCTION public.create_journal_entries_from_capital_contributions()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.journal_entries (
    source_table,
    source_id,
    journal_ref,
    account_code,
    account_name,
    debit_account_code,
    debit_account_name,
    credit_account_code,
    credit_account_name,
    debit,
    credit,
    amount,
    transaction_type,
    transaction_date,
    description,
    bukti,
    bukti_url,
    created_by
  ) VALUES (
    'capital_contributions',
    NEW.id,
    COALESCE(NEW.reference_no, NEW.id::text),
    COALESCE(NEW.debit_account_code, ''),
    COALESCE(NEW.debit_account_name, ''),
    COALESCE(NEW.debit_account_code, ''),
    COALESCE(NEW.debit_account_name, ''),
    COALESCE(NEW.credit_account_code, ''),
    COALESCE(NEW.credit_account_name, ''),
    NEW.amount,
    0,
    NEW.amount,
    'Setoran Modal',
    NEW.transaction_date,
    COALESCE(NEW.description, ''),
    NULL,
    NEW.bukti_url,
    NEW.created_by
  );

  INSERT INTO public.journal_entries (
    source_table,
    source_id,
    journal_ref,
    account_code,
    account_name,
    debit_account_code,
    debit_account_name,
    credit_account_code,
    credit_account_name,
    debit,
    credit,
    amount,
    transaction_type,
    transaction_date,
    description,
    bukti,
    bukti_url,
    created_by
  ) VALUES (
    'capital_contributions',
    NEW.id,
    COALESCE(NEW.reference_no, NEW.id::text),
    COALESCE(NEW.credit_account_code, ''),
    COALESCE(NEW.credit_account_name, ''),
    COALESCE(NEW.debit_account_code, ''),
    COALESCE(NEW.debit_account_name, ''),
    COALESCE(NEW.credit_account_code, ''),
    COALESCE(NEW.credit_account_name, ''),
    0,
    NEW.amount,
    NEW.amount,
    'Setoran Modal',
    NEW.transaction_date,
    COALESCE(NEW.description, ''),
    NULL,
    NEW.bukti_url,
    NEW.created_by
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_create_journal_entries_from_capital_contributions ON public.capital_contributions;
CREATE TRIGGER trigger_create_journal_entries_from_capital_contributions
AFTER INSERT ON public.capital_contributions
FOR EACH ROW
EXECUTE FUNCTION public.create_journal_entries_from_capital_contributions();

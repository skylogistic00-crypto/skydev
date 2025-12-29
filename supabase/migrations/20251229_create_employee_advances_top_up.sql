CREATE TABLE IF NOT EXISTS public.employee_advances_top_up (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL,

  advance_id uuid NOT NULL,
  employee_id uuid NOT NULL,
  employee_name text NULL,

  top_up_date date NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  description text NULL,

  bukti_url text NULL,
  bukti text NULL,

  debit_account_code text NULL,
  debit_account_name text NULL,
  credit_account_code text NULL,
  credit_account_name text NULL
);

CREATE INDEX IF NOT EXISTS employee_advances_top_up_advance_id_idx
ON public.employee_advances_top_up (advance_id);

CREATE INDEX IF NOT EXISTS employee_advances_top_up_employee_id_idx
ON public.employee_advances_top_up (employee_id);

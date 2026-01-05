ALTER TABLE public.employee_advances
ALTER COLUMN advance_date TYPE timestamptz
USING (advance_date::timestamptz);

ALTER TABLE public.employee_advances_top_up
ALTER COLUMN top_up_date TYPE timestamptz
USING (top_up_date::timestamptz);

ALTER TABLE public.employee_advance_settlements
ALTER COLUMN settlement_date TYPE timestamptz
USING (settlement_date::timestamptz);

ALTER TABLE public.cash_disbursement
ALTER COLUMN transaction_date TYPE timestamptz
USING (transaction_date::timestamptz);

ALTER TABLE public.cash_and_bank_receipts
ALTER COLUMN transaction_date TYPE timestamptz
USING (transaction_date::timestamptz);

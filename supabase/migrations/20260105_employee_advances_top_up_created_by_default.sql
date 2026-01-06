ALTER TABLE public.employee_advances_top_up
ALTER COLUMN created_by SET DEFAULT auth.uid();

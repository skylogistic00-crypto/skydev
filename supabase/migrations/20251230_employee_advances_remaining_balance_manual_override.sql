CREATE OR REPLACE FUNCTION public.employee_advances_set_remaining_balance_manual(
  p_advance_id uuid,
  p_remaining_balance numeric
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.employee_advances
  SET
    remaining_balance = GREATEST(COALESCE(p_remaining_balance, 0), 0),
    updated_at = now()
  WHERE id = p_advance_id;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_balance_on_settlement ON public.employee_advance_settlements;
CREATE TRIGGER trigger_update_balance_on_settlement
AFTER INSERT OR UPDATE OR DELETE ON public.employee_advance_settlements
FOR EACH ROW
EXECUTE FUNCTION update_advance_balance();

DROP TRIGGER IF EXISTS trigger_update_balance_on_return ON public.employee_advance_returns;
CREATE TRIGGER trigger_update_balance_on_return
AFTER INSERT OR UPDATE OR DELETE ON public.employee_advance_returns
FOR EACH ROW
EXECUTE FUNCTION update_advance_balance();

CREATE OR REPLACE FUNCTION public.update_advance_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  target_advance_id UUID;
  advance_amount NUMERIC(15,2);
  total_settled NUMERIC(15,2);
  total_returned NUMERIC(15,2);
  new_balance NUMERIC(15,2);
  new_status TEXT;
BEGIN
  target_advance_id := COALESCE(NEW.advance_id, OLD.advance_id);

  SELECT COALESCE(total_saldo, amount, 0)
  INTO advance_amount
  FROM public.employee_advances
  WHERE id = target_advance_id;

  SELECT COALESCE(SUM(total), 0)
  INTO total_settled
  FROM public.employee_advance_settlements
  WHERE advance_id = target_advance_id;

  SELECT COALESCE(SUM(amount), 0)
  INTO total_returned
  FROM public.employee_advance_returns
  WHERE advance_id = target_advance_id;

  new_balance := advance_amount - total_settled - total_returned;

  IF new_balance <= 0 THEN
    new_balance := 0;
    new_status := 'settled';
  ELSIF new_balance < advance_amount THEN
    new_status := 'partially_settled';
  ELSE
    new_status := 'pending';
  END IF;

  UPDATE public.employee_advances
  SET
    remaining_balance = new_balance,
    status = new_status,
    updated_at = NOW()
  WHERE id = target_advance_id;

  RETURN NEW;
END;
$$;

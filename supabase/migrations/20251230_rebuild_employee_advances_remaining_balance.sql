CREATE OR REPLACE FUNCTION public.rebuild_employee_advances_remaining_balance()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.employee_advances ea
  SET
    remaining_balance = GREATEST(
      COALESCE(ea.total_saldo, ea.amount, 0)
      + COALESCE(tu.total_top_up, 0)
      - COALESCE(st.total_settled, 0)
      - COALESCE(rt.total_returned, 0),
      0
    ),
    status = CASE
      WHEN GREATEST(
        COALESCE(ea.total_saldo, ea.amount, 0)
        + COALESCE(tu.total_top_up, 0)
        - COALESCE(st.total_settled, 0)
        - COALESCE(rt.total_returned, 0),
        0
      ) = 0 THEN 'settled'
      WHEN GREATEST(
        COALESCE(ea.total_saldo, ea.amount, 0)
        + COALESCE(tu.total_top_up, 0)
        - COALESCE(st.total_settled, 0)
        - COALESCE(rt.total_returned, 0),
        0
      ) < (COALESCE(ea.total_saldo, ea.amount, 0) + COALESCE(tu.total_top_up, 0)) THEN 'partially_settled'
      ELSE 'pending'
    END,
    updated_at = now()
  FROM (
    SELECT advance_id, SUM(amount) AS total_top_up
    FROM public.employee_advances_top_up
    GROUP BY advance_id
  ) tu
  FULL OUTER JOIN (
    SELECT advance_id, SUM(total) AS total_settled
    FROM public.employee_advance_settlements
    GROUP BY advance_id
  ) st
  ON st.advance_id = tu.advance_id
  FULL OUTER JOIN (
    SELECT advance_id, SUM(amount) AS total_returned
    FROM public.employee_advance_returns
    GROUP BY advance_id
  ) rt
  ON rt.advance_id = COALESCE(tu.advance_id, st.advance_id)
  WHERE ea.id = COALESCE(tu.advance_id, st.advance_id, rt.advance_id);

  UPDATE public.employee_advances ea
  SET
    remaining_balance = GREATEST(COALESCE(ea.total_saldo, ea.amount, 0), 0),
    status = CASE
      WHEN GREATEST(COALESCE(ea.total_saldo, ea.amount, 0), 0) = 0 THEN 'settled'
      ELSE 'pending'
    END,
    updated_at = now()
  WHERE ea.id NOT IN (
    SELECT DISTINCT advance_id FROM public.employee_advances_top_up
    UNION
    SELECT DISTINCT advance_id FROM public.employee_advance_settlements
    UNION
    SELECT DISTINCT advance_id FROM public.employee_advance_returns
  );
END;
$$;

SELECT public.rebuild_employee_advances_remaining_balance();

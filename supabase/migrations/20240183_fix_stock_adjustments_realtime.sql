DO $$ 
BEGIN
  ALTER PUBLICATION supabase_realtime DROP TABLE stock_adjustments;
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE stock_adjustments;
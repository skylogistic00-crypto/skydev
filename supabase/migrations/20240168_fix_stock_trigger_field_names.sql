DROP TRIGGER IF EXISTS trigger_auto_assign_coa_to_stock ON stock;
DROP FUNCTION IF EXISTS auto_assign_coa_to_stock();

CREATE OR REPLACE FUNCTION auto_assign_coa_to_stock()
RETURNS TRIGGER AS $$
DECLARE
  v_mapping RECORD;
BEGIN
  IF NEW.service_category IS NOT NULL AND NEW.service_type IS NOT NULL THEN
    SELECT 
      COALESCE(asset_account_code, revenue_account_code) as account_code,
      COALESCE(
        (SELECT account_name FROM chart_of_accounts WHERE account_code = COALESCE(asset_account_code, revenue_account_code) LIMIT 1),
        ''
      ) as account_name
    INTO v_mapping
    FROM coa_category_mapping
    WHERE service_category = NEW.service_category
      AND service_type = NEW.service_type
      AND is_active = true
    LIMIT 1;

    IF v_mapping.account_code IS NOT NULL AND (NEW.coa_account_code IS NULL OR NEW.coa_account_code = '') THEN
      NEW.coa_account_code := v_mapping.account_code;
      NEW.coa_account_name := v_mapping.account_name;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_assign_coa_to_stock
  BEFORE INSERT OR UPDATE ON stock
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_coa_to_stock();

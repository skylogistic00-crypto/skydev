-- Drop ALL triggers on stock table
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tgname FROM pg_trigger WHERE tgrelid = 'stock'::regclass) LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || r.tgname || ' ON stock CASCADE';
    END LOOP;
END $$;

-- Drop ALL functions that might reference opening_stock or old field names
DROP FUNCTION IF EXISTS auto_assign_coa_to_stock() CASCADE;
DROP FUNCTION IF EXISTS update_status_pengambilan() CASCADE;
DROP FUNCTION IF EXISTS update_stock_after_transaction() CASCADE;
DROP FUNCTION IF EXISTS check_stock_balance() CASCADE;
DROP FUNCTION IF EXISTS auto_update_stock_balance() CASCADE;

-- Recreate the correct auto_assign_coa_to_stock function
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

-- Recreate the correct update_status_pengambilan function
CREATE OR REPLACE FUNCTION update_status_pengambilan()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.batas_waktu_pengambilan IS NOT NULL THEN
    IF CURRENT_DATE > NEW.batas_waktu_pengambilan THEN
      NEW.status_pengambilan := 'Terlambat';
    ELSIF CURRENT_DATE >= NEW.batas_waktu_pengambilan - INTERVAL '3 days' THEN
      NEW.status_pengambilan := 'Mendekati Batas';
    ELSE
      NEW.status_pengambilan := 'Normal';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate triggers with correct functions
CREATE TRIGGER trigger_auto_assign_coa_to_stock
  BEFORE INSERT OR UPDATE ON stock
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_coa_to_stock();

CREATE TRIGGER trigger_update_status_pengambilan_stock
  BEFORE INSERT OR UPDATE ON stock
  FOR EACH ROW
  EXECUTE FUNCTION update_status_pengambilan();

-- Add comment to confirm fix
COMMENT ON TABLE stock IS 'Stock table - all triggers fixed and cleaned up';

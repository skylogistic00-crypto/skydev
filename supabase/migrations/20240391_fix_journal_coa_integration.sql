-- Migration: Fix Journal COA Integration
-- Ensure all journal entries and general_ledger have account_id, account_code, and account_name

-- 1. Add account_id column to general_ledger if not exists
ALTER TABLE general_ledger 
  ADD COLUMN IF NOT EXISTS account_id UUID,
  ADD COLUMN IF NOT EXISTS account_name TEXT;

-- 2. Add account_id column to journal_entries if not exists
ALTER TABLE journal_entries 
  ADD COLUMN IF NOT EXISTS account_id UUID;

-- 3. Add account_id column to journal_entry_lines if not exists
ALTER TABLE journal_entry_lines 
  ADD COLUMN IF NOT EXISTS account_id UUID;

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_gl_account_id ON general_ledger(account_id);
CREATE INDEX IF NOT EXISTS idx_je_account_id ON journal_entries(account_id);
CREATE INDEX IF NOT EXISTS idx_jel_account_id ON journal_entry_lines(account_id);

-- 5. Create helper function to get COA details
CREATE OR REPLACE FUNCTION get_account_coa(p_account_id UUID)
RETURNS TABLE (
  id UUID,
  account_code TEXT,
  account_name TEXT,
  normal_balance TEXT,
  account_type TEXT,
  level INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    coa.id,
    coa.account_code,
    coa.account_name,
    coa.normal_balance,
    coa.account_type,
    coa.level
  FROM chart_of_accounts coa
  WHERE coa.id = p_account_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create helper function to get COA by account_code
CREATE OR REPLACE FUNCTION get_account_coa_by_code(p_account_code TEXT)
RETURNS TABLE (
  id UUID,
  account_code TEXT,
  account_name TEXT,
  normal_balance TEXT,
  account_type TEXT,
  level INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    coa.id,
    coa.account_code,
    coa.account_name,
    coa.normal_balance,
    coa.account_type,
    coa.level
  FROM chart_of_accounts coa
  WHERE coa.account_code = p_account_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Backfill general_ledger with account_id and account_name from chart_of_accounts
UPDATE general_ledger gl
SET 
  account_id = coa.id,
  account_name = coa.account_name
FROM chart_of_accounts coa
WHERE gl.account_code = coa.account_code
  AND (gl.account_id IS NULL OR gl.account_name IS NULL);

-- 8. Backfill journal_entries with account_id from chart_of_accounts
UPDATE journal_entries je
SET 
  account_id = coa.id,
  account_name = coa.account_name
FROM chart_of_accounts coa
WHERE je.account_code = coa.account_code
  AND (je.account_id IS NULL OR je.account_name IS NULL);

-- 9. Backfill journal_entry_lines with account_id from chart_of_accounts
UPDATE journal_entry_lines jel
SET 
  account_id = coa.id,
  account_name = coa.account_name
FROM chart_of_accounts coa
WHERE jel.account_code = coa.account_code
  AND (jel.account_id IS NULL OR jel.account_name IS NULL);

-- 10. Create view_general_ledger
DROP VIEW IF EXISTS view_general_ledger;
CREATE OR REPLACE VIEW view_general_ledger AS
SELECT 
  gl.id,
  gl.journal_entry_id,
  gl.account_id,
  COALESCE(gl.account_code, coa.account_code) as account_code,
  COALESCE(gl.account_name, coa.account_name) as account_name,
  gl.date,
  gl.description,
  gl.debit,
  gl.credit,
  coa.account_type,
  coa.normal_balance,
  coa.level,
  gl.created_at,
  gl.updated_at
FROM general_ledger gl
LEFT JOIN chart_of_accounts coa ON gl.account_id = coa.id OR gl.account_code = coa.account_code;

-- 11. Grant permissions
GRANT EXECUTE ON FUNCTION get_account_coa(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_account_coa(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_account_coa_by_code(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_account_coa_by_code(TEXT) TO anon;
GRANT SELECT ON view_general_ledger TO authenticated;
GRANT SELECT ON view_general_ledger TO anon;

-- 12. Create trigger to auto-fill account_code and account_name on general_ledger insert
CREATE OR REPLACE FUNCTION auto_fill_gl_coa_details()
RETURNS TRIGGER AS $$
DECLARE
  v_coa RECORD;
BEGIN
  IF NEW.account_id IS NOT NULL AND (NEW.account_code IS NULL OR NEW.account_name IS NULL) THEN
    SELECT account_code, account_name INTO v_coa
    FROM chart_of_accounts
    WHERE id = NEW.account_id;
    
    IF FOUND THEN
      NEW.account_code := COALESCE(NEW.account_code, v_coa.account_code);
      NEW.account_name := COALESCE(NEW.account_name, v_coa.account_name);
    END IF;
  ELSIF NEW.account_code IS NOT NULL AND (NEW.account_id IS NULL OR NEW.account_name IS NULL) THEN
    SELECT id, account_name INTO v_coa
    FROM chart_of_accounts
    WHERE account_code = NEW.account_code;
    
    IF FOUND THEN
      NEW.account_id := COALESCE(NEW.account_id, v_coa.id);
      NEW.account_name := COALESCE(NEW.account_name, v_coa.account_name);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_fill_gl_coa ON general_ledger;
CREATE TRIGGER trigger_auto_fill_gl_coa
  BEFORE INSERT OR UPDATE ON general_ledger
  FOR EACH ROW
  EXECUTE FUNCTION auto_fill_gl_coa_details();

-- 13. Create trigger to auto-fill account_code and account_name on journal_entries insert
CREATE OR REPLACE FUNCTION auto_fill_je_coa_details()
RETURNS TRIGGER AS $$
DECLARE
  v_coa RECORD;
BEGIN
  IF NEW.account_id IS NOT NULL AND (NEW.account_code IS NULL OR NEW.account_name IS NULL) THEN
    SELECT account_code, account_name INTO v_coa
    FROM chart_of_accounts
    WHERE id = NEW.account_id;
    
    IF FOUND THEN
      NEW.account_code := COALESCE(NEW.account_code, v_coa.account_code);
      NEW.account_name := COALESCE(NEW.account_name, v_coa.account_name);
    END IF;
  ELSIF NEW.account_code IS NOT NULL AND (NEW.account_id IS NULL OR NEW.account_name IS NULL) THEN
    SELECT id, account_name INTO v_coa
    FROM chart_of_accounts
    WHERE account_code = NEW.account_code;
    
    IF FOUND THEN
      NEW.account_id := COALESCE(NEW.account_id, v_coa.id);
      NEW.account_name := COALESCE(NEW.account_name, v_coa.account_name);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_fill_je_coa ON journal_entries;
CREATE TRIGGER trigger_auto_fill_je_coa
  BEFORE INSERT OR UPDATE ON journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION auto_fill_je_coa_details();

-- 14. Create trigger to auto-fill account_code and account_name on journal_entry_lines insert
CREATE OR REPLACE FUNCTION auto_fill_jel_coa_details()
RETURNS TRIGGER AS $$
DECLARE
  v_coa RECORD;
BEGIN
  IF NEW.account_id IS NOT NULL AND (NEW.account_code IS NULL OR NEW.account_name IS NULL) THEN
    SELECT account_code, account_name INTO v_coa
    FROM chart_of_accounts
    WHERE id = NEW.account_id;
    
    IF FOUND THEN
      NEW.account_code := COALESCE(NEW.account_code, v_coa.account_code);
      NEW.account_name := COALESCE(NEW.account_name, v_coa.account_name);
    END IF;
  ELSIF NEW.account_code IS NOT NULL AND (NEW.account_id IS NULL OR NEW.account_name IS NULL) THEN
    SELECT id, account_name INTO v_coa
    FROM chart_of_accounts
    WHERE account_code = NEW.account_code;
    
    IF FOUND THEN
      NEW.account_id := COALESCE(NEW.account_id, v_coa.id);
      NEW.account_name := COALESCE(NEW.account_name, v_coa.account_name);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_fill_jel_coa ON journal_entry_lines;
CREATE TRIGGER trigger_auto_fill_jel_coa
  BEFORE INSERT OR UPDATE ON journal_entry_lines
  FOR EACH ROW
  EXECUTE FUNCTION auto_fill_jel_coa_details();

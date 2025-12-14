-- Migration: Backfill Journal COA Data
-- This migration ensures all existing journal entries have account_id and account_name

-- 1. Backfill general_ledger with account_id and account_name from chart_of_accounts
UPDATE general_ledger gl
SET 
  account_id = coa.id,
  account_name = COALESCE(gl.account_name, coa.account_name)
FROM chart_of_accounts coa
WHERE gl.account_code = coa.account_code
  AND gl.account_id IS NULL;

-- 2. Backfill journal_entries with account_id from chart_of_accounts
UPDATE journal_entries je
SET 
  account_id = coa.id,
  account_name = COALESCE(je.account_name, coa.account_name)
FROM chart_of_accounts coa
WHERE je.account_code = coa.account_code
  AND je.account_id IS NULL;

-- 3. Backfill journal_entry_lines with account_id from chart_of_accounts
UPDATE journal_entry_lines jel
SET 
  account_id = coa.id,
  account_name = COALESCE(jel.account_name, coa.account_name)
FROM chart_of_accounts coa
WHERE jel.account_code = coa.account_code
  AND jel.account_id IS NULL;

-- 4. Create comprehensive view for trial balance
DROP VIEW IF EXISTS vw_trial_balance_complete;
CREATE OR REPLACE VIEW vw_trial_balance_complete AS
SELECT 
  coa.id as account_id,
  coa.account_code,
  coa.account_name,
  coa.account_type,
  coa.normal_balance,
  coa.level,
  COALESCE(SUM(gl.debit), 0) as total_debit,
  COALESCE(SUM(gl.credit), 0) as total_credit,
  CASE 
    WHEN coa.normal_balance = 'Debit' THEN COALESCE(SUM(gl.debit), 0) - COALESCE(SUM(gl.credit), 0)
    ELSE COALESCE(SUM(gl.credit), 0) - COALESCE(SUM(gl.debit), 0)
  END as balance
FROM chart_of_accounts coa
LEFT JOIN general_ledger gl ON coa.id = gl.account_id OR coa.account_code = gl.account_code
WHERE coa.is_active = true
GROUP BY coa.id, coa.account_code, coa.account_name, coa.account_type, coa.normal_balance, coa.level
ORDER BY coa.account_code;

-- 5. Create view for profit and loss with complete COA details
DROP VIEW IF EXISTS vw_profit_loss_complete;
CREATE OR REPLACE VIEW vw_profit_loss_complete AS
SELECT 
  coa.id as account_id,
  coa.account_code,
  coa.account_name,
  coa.account_type,
  CASE 
    WHEN coa.account_type = 'Pendapatan' THEN 
      COALESCE(SUM(gl.credit), 0) - COALESCE(SUM(gl.debit), 0)
    WHEN coa.account_type IN ('Beban Pokok Penjualan', 'Beban Operasional') THEN 
      COALESCE(SUM(gl.debit), 0) - COALESCE(SUM(gl.credit), 0)
    ELSE 0
  END as balance
FROM chart_of_accounts coa
LEFT JOIN general_ledger gl ON coa.id = gl.account_id OR coa.account_code = gl.account_code
WHERE coa.account_type IN ('Pendapatan', 'Beban Pokok Penjualan', 'Beban Operasional')
  AND coa.is_active = true
GROUP BY coa.id, coa.account_code, coa.account_name, coa.account_type
HAVING (COALESCE(SUM(gl.debit), 0) - COALESCE(SUM(gl.credit), 0)) != 0 
   OR (COALESCE(SUM(gl.credit), 0) - COALESCE(SUM(gl.debit), 0)) != 0
ORDER BY coa.account_code;

-- 6. Create view for balance sheet with complete COA details
DROP VIEW IF EXISTS vw_balance_sheet_complete;
CREATE OR REPLACE VIEW vw_balance_sheet_complete AS
SELECT 
  coa.id as account_id,
  coa.account_code,
  coa.account_name,
  coa.account_type,
  coa.normal_balance,
  CASE 
    WHEN coa.normal_balance = 'Debit' THEN 
      COALESCE(SUM(gl.debit), 0) - COALESCE(SUM(gl.credit), 0)
    ELSE 
      COALESCE(SUM(gl.credit), 0) - COALESCE(SUM(gl.debit), 0)
  END as balance
FROM chart_of_accounts coa
LEFT JOIN general_ledger gl ON coa.id = gl.account_id OR coa.account_code = gl.account_code
WHERE coa.account_type IN ('Aset', 'Kewajiban', 'Ekuitas')
  AND coa.is_active = true
GROUP BY coa.id, coa.account_code, coa.account_name, coa.account_type, coa.normal_balance
ORDER BY coa.account_code;

-- 7. Grant permissions on views
GRANT SELECT ON vw_trial_balance_complete TO authenticated;
GRANT SELECT ON vw_trial_balance_complete TO anon;
GRANT SELECT ON vw_profit_loss_complete TO authenticated;
GRANT SELECT ON vw_profit_loss_complete TO anon;
GRANT SELECT ON vw_balance_sheet_complete TO authenticated;
GRANT SELECT ON vw_balance_sheet_complete TO anon;

-- 8. Create RPC function to get journal entries with full COA details
CREATE OR REPLACE FUNCTION get_journal_entries_with_coa(
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL,
  p_account_id UUID DEFAULT NULL,
  p_account_code TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  journal_entry_id UUID,
  account_id UUID,
  account_code TEXT,
  account_name TEXT,
  account_type TEXT,
  normal_balance TEXT,
  date DATE,
  description TEXT,
  debit NUMERIC,
  credit NUMERIC,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    gl.id,
    gl.journal_entry_id,
    COALESCE(gl.account_id, coa.id) as account_id,
    COALESCE(gl.account_code, coa.account_code) as account_code,
    COALESCE(gl.account_name, coa.account_name) as account_name,
    coa.account_type,
    coa.normal_balance,
    gl.date,
    gl.description,
    gl.debit,
    gl.credit,
    gl.created_at
  FROM general_ledger gl
  LEFT JOIN chart_of_accounts coa ON gl.account_id = coa.id OR gl.account_code = coa.account_code
  WHERE (p_start_date IS NULL OR gl.date >= p_start_date)
    AND (p_end_date IS NULL OR gl.date <= p_end_date)
    AND (p_account_id IS NULL OR gl.account_id = p_account_id OR coa.id = p_account_id)
    AND (p_account_code IS NULL OR gl.account_code = p_account_code OR coa.account_code = p_account_code)
  ORDER BY gl.date, gl.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_journal_entries_with_coa(DATE, DATE, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_journal_entries_with_coa(DATE, DATE, UUID, TEXT) TO anon;

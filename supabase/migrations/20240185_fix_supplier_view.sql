-- Drop the old view that references wrong table name
DROP VIEW IF EXISTS stock_adjustments_with_supplier;

-- Recreate view with correct table name (suppliers with 's')
CREATE OR REPLACE VIEW stock_adjustments_with_supplier AS
SELECT 
  sa.id,
  sa.stock_id,
  sa.item_name,
  sa.reason,
  sa.adjustment_value as qty_change,
  sa.supplier_id,
  s.supplier_name,
  sa.created_at
FROM stock_adjustments sa
LEFT JOIN suppliers s ON sa.supplier_id = s.id;

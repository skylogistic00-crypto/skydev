CREATE OR REPLACE VIEW vw_coa_accounts_by_service AS
SELECT 
  l2.account_name AS kategori_layanan,
  l3.account_name AS jenis_layanan,
  l4.description,
  l4.account_name,
  l4.account_code
FROM chart_of_accounts l4
JOIN chart_of_accounts l3 ON l4.account_code LIKE CONCAT(SPLIT_PART(l3.account_code, '-', 1), '-', SUBSTRING(SPLIT_PART(l3.account_code, '-', 2), 1, 2), '%')
JOIN chart_of_accounts l2 ON l3.account_code LIKE CONCAT(SPLIT_PART(l2.account_code, '-', 1), '-%')
WHERE l4.level = 4 
  AND l3.level = 3 
  AND l2.level = 2
  AND l4.is_active = true
  AND l3.is_active = true
  AND l2.is_active = true
ORDER BY l2.account_code, l3.account_code, l4.account_code;

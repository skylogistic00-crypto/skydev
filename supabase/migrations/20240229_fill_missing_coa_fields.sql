UPDATE chart_of_accounts
SET 
  is_header = false,
  is_active = true,
  description = COALESCE(description, account_name)
WHERE 
  is_header IS NULL 
  OR is_active IS NULL 
  OR description IS NULL 
  OR description = '';

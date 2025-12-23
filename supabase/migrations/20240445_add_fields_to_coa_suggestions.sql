-- Add missing fields to coa_suggestions table
ALTER TABLE coa_suggestions
ADD COLUMN IF NOT EXISTS flow_type TEXT,
ADD COLUMN IF NOT EXISTS trans_type TEXT,
ADD COLUMN IF NOT EXISTS usage_role TEXT,
ADD COLUMN IF NOT EXISTS financial_category TEXT,
ADD COLUMN IF NOT EXISTS action_taken TEXT,
ADD COLUMN IF NOT EXISTS selected_account_code TEXT,
ADD COLUMN IF NOT EXISTS intent TEXT;

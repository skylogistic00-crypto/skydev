-- Create audit log table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Enable RLS on audit logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert audit logs
DROP POLICY IF EXISTS "Allow insert audit logs" ON audit_logs;
CREATE POLICY "Allow insert audit logs"
ON audit_logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to view audit logs
DROP POLICY IF EXISTS "Allow view audit logs" ON audit_logs;
CREATE POLICY "Allow view audit logs"
ON audit_logs FOR SELECT
TO authenticated
USING (true);

-- Function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event(
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_audit_id UUID;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
  VALUES (v_user_id, p_action, p_entity_type, p_entity_id, p_details)
  RETURNING id INTO v_audit_id;
  
  RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add verification fields to suppliers table
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'suppliers') THEN
    ALTER TABLE suppliers 
    ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS verified_by UUID,
    ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS verification_notes TEXT;
    
    -- Add constraint if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.constraint_column_usage 
      WHERE table_name = 'suppliers' AND constraint_name LIKE '%verification_status%'
    ) THEN
      ALTER TABLE suppliers ADD CONSTRAINT suppliers_verification_status_check 
      CHECK (verification_status IN ('pending', 'approved', 'rejected'));
    END IF;
  END IF;
END $$;

-- Add verification fields to customers table
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customers') THEN
    ALTER TABLE customers 
    ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS verified_by UUID,
    ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS verification_notes TEXT;
    
    -- Add constraint if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.constraint_column_usage 
      WHERE table_name = 'customers' AND constraint_name LIKE '%verification_status%'
    ) THEN
      ALTER TABLE customers ADD CONSTRAINT customers_verification_status_check 
      CHECK (verification_status IN ('pending', 'approved', 'rejected'));
    END IF;
  END IF;
END $$;

-- Enable pgcrypto for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

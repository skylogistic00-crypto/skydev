CREATE TABLE IF NOT EXISTS sql_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  query TEXT NOT NULL,
  status TEXT NOT NULL,
  error TEXT,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sql_audit_logs_user_id ON sql_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_sql_audit_logs_executed_at ON sql_audit_logs(executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_sql_audit_logs_status ON sql_audit_logs(status);

ALTER TABLE sql_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins can view all audit logs" ON sql_audit_logs;
CREATE POLICY "Super admins can view all audit logs" ON sql_audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

DROP POLICY IF EXISTS "System can insert audit logs" ON sql_audit_logs;
CREATE POLICY "System can insert audit logs" ON sql_audit_logs
  FOR INSERT
  WITH CHECK (true);

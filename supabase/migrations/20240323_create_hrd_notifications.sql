-- Create HRD Notifications Table
CREATE TABLE IF NOT EXISTS hrd_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  related_id UUID,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE hrd_notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if exists
DROP POLICY IF EXISTS "Allow all for authenticated users" ON hrd_notifications;

-- RLS Policy
CREATE POLICY "Allow all for authenticated users" ON hrd_notifications FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_hrd_notifications_is_read ON hrd_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_hrd_notifications_created_at ON hrd_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hrd_notifications_type ON hrd_notifications(type);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_hrd_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_hrd_notifications_updated_at_trigger ON hrd_notifications;
CREATE TRIGGER update_hrd_notifications_updated_at_trigger
BEFORE UPDATE ON hrd_notifications
FOR EACH ROW
EXECUTE FUNCTION update_hrd_notifications_updated_at();

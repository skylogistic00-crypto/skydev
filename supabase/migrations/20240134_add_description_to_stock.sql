ALTER TABLE stock ADD COLUMN IF NOT EXISTS description TEXT;

alter publication supabase_realtime add table stock;
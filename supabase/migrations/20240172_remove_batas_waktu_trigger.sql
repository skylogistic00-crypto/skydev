-- Drop the trigger that references batas_waktu_pengambilan
DROP TRIGGER IF EXISTS trigger_update_status_pengambilan_stock ON stock;
DROP FUNCTION IF EXISTS update_status_pengambilan() CASCADE;

-- Add comment to confirm fix
COMMENT ON TABLE stock IS 'Stock table - removed batas_waktu_pengambilan trigger';

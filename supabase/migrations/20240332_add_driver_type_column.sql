ALTER TABLE drivers ADD COLUMN IF NOT EXISTS driver_type TEXT DEFAULT 'general';

COMMENT ON COLUMN drivers.driver_type IS 'Type of driver: perusahaan (company driver), mitra (partner driver), or general';

CREATE INDEX IF NOT EXISTS idx_drivers_driver_type ON drivers(driver_type);

ALTER TABLE drivers ADD COLUMN IF NOT EXISTS vehicle_brand TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS vehicle_model TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS plate_number TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS vehicle_year TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS vehicle_color TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS upload_stnk_url TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS upload_vehicle_photo_url TEXT;

COMMENT ON COLUMN drivers.vehicle_brand IS 'Vehicle brand/make (e.g., Toyota)';
COMMENT ON COLUMN drivers.vehicle_model IS 'Vehicle model (e.g., Avanza)';
COMMENT ON COLUMN drivers.plate_number IS 'Vehicle license plate number';
COMMENT ON COLUMN drivers.vehicle_year IS 'Vehicle year of manufacture';
COMMENT ON COLUMN drivers.vehicle_color IS 'Vehicle color';
COMMENT ON COLUMN drivers.upload_stnk_url IS 'URL to STNK (vehicle registration) document';
COMMENT ON COLUMN drivers.upload_vehicle_photo_url IS 'URL to vehicle photo';

CREATE INDEX IF NOT EXISTS idx_drivers_plate_number ON drivers(plate_number);

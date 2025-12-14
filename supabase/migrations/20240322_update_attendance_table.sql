-- Add missing columns to attendance table if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='attendance' AND column_name='clock_in_photo_url') THEN
    ALTER TABLE attendance ADD COLUMN clock_in_photo_url TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='attendance' AND column_name='clock_out_photo_url') THEN
    ALTER TABLE attendance ADD COLUMN clock_out_photo_url TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='attendance' AND column_name='overtime_hours') THEN
    ALTER TABLE attendance ADD COLUMN overtime_hours DECIMAL(5,2) DEFAULT 0;
  END IF;
END $$;

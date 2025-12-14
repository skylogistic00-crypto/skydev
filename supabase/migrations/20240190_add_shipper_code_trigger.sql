CREATE OR REPLACE FUNCTION generate_shipper_code()
RETURNS TRIGGER AS $$
DECLARE
  next_number INTEGER;
  new_code TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(shipper_code FROM 4) AS INTEGER)), 0) + 1
  INTO next_number
  FROM shippers
  WHERE shipper_code ~ '^SHP[0-9]+$';
  
  new_code := 'SHP' || LPAD(next_number::TEXT, 4, '0');
  
  NEW.shipper_code := new_code;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_shipper_code
BEFORE INSERT ON shippers
FOR EACH ROW
WHEN (NEW.shipper_code IS NULL OR NEW.shipper_code = '')
EXECUTE FUNCTION generate_shipper_code();

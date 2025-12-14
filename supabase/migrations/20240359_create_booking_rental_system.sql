-- =============================================
-- BOOKING SYSTEM TABLES
-- =============================================

CREATE TABLE IF NOT EXISTS facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('gym', 'non_gym')),
  description TEXT,
  capacity INTEGER DEFAULT 1,
  price_per_visit DECIMAL(12,2) DEFAULT 0,
  price_per_hour DECIMAL(12,2) DEFAULT 0,
  operating_hours JSONB DEFAULT '{"start": "06:00", "end": "22:00"}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  entity_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS facility_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE,
  slot_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  max_capacity INTEGER DEFAULT 1,
  booked_count INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  facility_type VARCHAR(50) NOT NULL CHECK (facility_type IN ('gym', 'non_gym')),
  duration_months INTEGER NOT NULL,
  visits_per_month INTEGER,
  price DECIMAL(12,2) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  entity_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  membership_id UUID REFERENCES memberships(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  remaining_visits INTEGER,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_reference VARCHAR(50) NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE,
  slot_id UUID REFERENCES facility_slots(id),
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  booking_type VARCHAR(20) NOT NULL CHECK (booking_type IN ('per_visit', 'per_hour', 'membership')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
  total_amount DECIMAL(12,2) DEFAULT 0,
  notes TEXT,
  booked_by UUID REFERENCES users(id),
  user_membership_id UUID REFERENCES user_memberships(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for bookings
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- =============================================
-- RENTAL MOBIL TABLES
-- =============================================

CREATE TABLE IF NOT EXISTS vehicle_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('sedan', 'suv', 'mpv', 'hatchback', 'pickup', 'van', 'luxury')),
  seat_capacity INTEGER DEFAULT 4,
  transmission VARCHAR(20) DEFAULT 'automatic' CHECK (transmission IN ('automatic', 'manual')),
  fuel_type VARCHAR(20) DEFAULT 'gasoline' CHECK (fuel_type IN ('gasoline', 'diesel', 'electric', 'hybrid')),
  price_per_day DECIMAL(12,2) NOT NULL,
  price_per_week DECIMAL(12,2),
  price_per_month DECIMAL(12,2),
  description TEXT,
  features JSONB DEFAULT '[]'::jsonb,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  entity_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID REFERENCES vehicle_models(id) ON DELETE CASCADE,
  license_plate VARCHAR(20) NOT NULL UNIQUE,
  color VARCHAR(50),
  year INTEGER,
  vin_number VARCHAR(50),
  stnk_expiry DATE,
  kir_expiry DATE,
  insurance_expiry DATE,
  odometer INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'rented', 'maintenance', 'reserved', 'inactive')),
  condition_notes TEXT,
  photos JSONB DEFAULT '[]'::jsonb,
  entity_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_model ON vehicles(model_id);

CREATE TABLE IF NOT EXISTS vehicle_rentals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_number VARCHAR(50) NOT NULL UNIQUE,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id),
  user_id UUID REFERENCES users(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  pickup_time TIME,
  return_time TIME,
  pickup_location TEXT,
  return_location TEXT,
  rental_type VARCHAR(20) DEFAULT 'daily' CHECK (rental_type IN ('daily', 'weekly', 'monthly')),
  base_price DECIMAL(12,2) NOT NULL,
  additional_charges DECIMAL(12,2) DEFAULT 0,
  discount DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL,
  deposit_amount DECIMAL(12,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'active', 'completed', 'cancelled')),
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid', 'refunded')),
  odometer_start INTEGER,
  odometer_end INTEGER,
  fuel_level_start VARCHAR(20),
  fuel_level_end VARCHAR(20),
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rentals_number ON vehicle_rentals(rental_number);
CREATE INDEX IF NOT EXISTS idx_rentals_vehicle ON vehicle_rentals(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_rentals_dates ON vehicle_rentals(start_date, end_date);

-- =============================================
-- RBAC ENHANCEMENT
-- =============================================

CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role VARCHAR(50) NOT NULL,
  menu_key VARCHAR(100) NOT NULL,
  can_view BOOLEAN DEFAULT false,
  can_create BOOLEAN DEFAULT false,
  can_edit BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  entity_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(role, menu_key, entity_id)
);

INSERT INTO role_permissions (role, menu_key, can_view, can_create, can_edit, can_delete) VALUES
('admin', 'dashboard', true, true, true, true),
('admin', 'users', true, true, true, true),
('admin', 'bookings', true, true, true, true),
('admin', 'rentals', true, true, true, true),
('admin', 'facilities', true, true, true, true),
('admin', 'vehicles', true, true, true, true),
('admin', 'reports', true, true, true, true),
('admin', 'settings', true, true, true, true),
('manager', 'dashboard', true, true, true, false),
('manager', 'users', true, true, true, false),
('manager', 'bookings', true, true, true, true),
('manager', 'rentals', true, true, true, true),
('manager', 'facilities', true, true, true, false),
('manager', 'vehicles', true, true, true, false),
('manager', 'reports', true, false, false, false),
('supervisor', 'dashboard', true, false, false, false),
('supervisor', 'bookings', true, true, true, false),
('supervisor', 'rentals', true, true, true, false),
('supervisor', 'reports', true, false, false, false),
('staff', 'dashboard', true, false, false, false),
('staff', 'bookings', true, true, false, false),
('staff', 'rentals', true, true, false, false),
('hrd', 'dashboard', true, false, false, false),
('hrd', 'users', true, true, true, false),
('hrd', 'employees', true, true, true, true),
('hrd', 'attendance', true, true, true, true),
('hrd', 'payroll', true, true, true, false),
('member', 'dashboard', true, false, false, false),
('member', 'my_bookings', true, true, false, true),
('member', 'my_rentals', true, true, false, false)
ON CONFLICT (role, menu_key, entity_id) DO NOTHING;

-- Function to generate booking reference
CREATE OR REPLACE FUNCTION generate_booking_reference()
RETURNS TEXT AS $$
BEGIN
  RETURN 'BK' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Function to generate rental number
CREATE OR REPLACE FUNCTION generate_rental_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'RNT' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

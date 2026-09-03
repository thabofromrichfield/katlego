-- =============================================
-- KATLEGO LOGISTICS MANAGEMENT SYSTEM
-- Supabase Schema - Safe to run multiple times
-- =============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- PROFILES
-- =============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'driver', 'user')),
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins and managers can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow insert on profiles for authenticated users" ON public.profiles;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins and managers can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow insert on profiles for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "select_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "insert_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "update_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "delete_profile_admin" ON public.profiles;

CREATE POLICY "select_own_profile"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = id
    OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'manager')
    OR (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'manager')
  );

CREATE POLICY "insert_own_profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "update_own_profile"
  ON public.profiles FOR UPDATE
  USING (
    auth.uid() = id
    OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'manager')
    OR (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'manager')
  );

CREATE POLICY "delete_profile_admin"
  ON public.profiles FOR DELETE
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'manager')
    OR (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'manager')
  );

-- =============================================
-- VEHICLES
-- =============================================
CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  plate_number TEXT NOT NULL UNIQUE,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  color TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 4,
  vehicle_type TEXT NOT NULL DEFAULT 'sedan' CHECK (vehicle_type IN ('sedan', 'suv', 'van', 'truck', 'minibus', 'bus')),
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'on_trip', 'maintenance', 'offline')),
  fuel_type TEXT NOT NULL DEFAULT 'petrol' CHECK (fuel_type IN ('petrol', 'diesel', 'electric', 'hybrid')),
  mileage INTEGER NOT NULL DEFAULT 0,
  last_service_date DATE,
  next_service_date DATE,
  insurance_expiry DATE,
  image_url TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view active vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Admins and managers can manage vehicles" ON public.vehicles;

CREATE POLICY "Authenticated users can view active vehicles"
  ON public.vehicles FOR SELECT USING (auth.role() = 'authenticated' AND is_active = true);

CREATE POLICY "Admins and managers can manage vehicles"
  ON public.vehicles FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'manager'))
  );

-- =============================================
-- DRIVERS
-- =============================================
CREATE TABLE IF NOT EXISTS public.drivers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  employee_id TEXT UNIQUE,
  license_number TEXT NOT NULL UNIQUE,
  license_expiry DATE NOT NULL,
  license_class TEXT NOT NULL DEFAULT 'B',
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'on_trip', 'off_duty', 'leave', 'suspended')),
  rating NUMERIC(3,2) DEFAULT 5.0,
  total_trips INTEGER DEFAULT 0,
  current_vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  address TEXT,
  date_of_birth DATE,
  date_hired DATE,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins and managers can manage drivers" ON public.drivers;
DROP POLICY IF EXISTS "Drivers can view their own record" ON public.drivers;

CREATE POLICY "Admins and managers can manage drivers"
  ON public.drivers FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'manager'))
  );

CREATE POLICY "Drivers can view their own record"
  ON public.drivers FOR SELECT USING (profile_id = auth.uid());

-- =============================================
-- TRIPS
-- =============================================
CREATE TABLE IF NOT EXISTS public.trips (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  booking_reference TEXT NOT NULL UNIQUE DEFAULT upper(substring(gen_random_uuid()::text, 1, 8)),
  requester_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
  driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  pickup_address TEXT NOT NULL,
  pickup_lat NUMERIC(10, 7),
  pickup_lng NUMERIC(10, 7),
  destination_address TEXT NOT NULL,
  destination_lat NUMERIC(10, 7),
  destination_lng NUMERIC(10, 7),
  trip_type TEXT NOT NULL DEFAULT 'immediate' CHECK (trip_type IN ('immediate', 'scheduled')),
  scheduled_datetime TIMESTAMPTZ,
  actual_pickup_time TIMESTAMPTZ,
  actual_dropoff_time TIMESTAMPTZ,
  estimated_duration_minutes INTEGER,
  estimated_distance_km NUMERIC(8,2),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'assigned', 'in_progress', 'completed', 'cancelled', 'rejected')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  passenger_count INTEGER NOT NULL DEFAULT 1,
  purpose TEXT,
  notes TEXT,
  cancellation_reason TEXT,
  fare_amount NUMERIC(10,2),
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'waived')),
  passenger_rating INTEGER CHECK (passenger_rating BETWEEN 1 AND 5),
  driver_rating INTEGER CHECK (driver_rating BETWEEN 1 AND 5),
  passenger_feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own trips" ON public.trips;
DROP POLICY IF EXISTS "Admins and managers can view all trips" ON public.trips;
DROP POLICY IF EXISTS "Drivers can view their assigned trips" ON public.trips;
DROP POLICY IF EXISTS "Authenticated users can create trips" ON public.trips;
DROP POLICY IF EXISTS "Admins and managers can update any trip" ON public.trips;
DROP POLICY IF EXISTS "Users can cancel their own pending trips" ON public.trips;

CREATE POLICY "Users can view their own trips"
  ON public.trips FOR SELECT USING (requester_id = auth.uid());

CREATE POLICY "Admins and managers can view all trips"
  ON public.trips FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'manager'))
  );

CREATE POLICY "Drivers can view their assigned trips"
  ON public.trips FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.drivers d WHERE d.id = trips.driver_id AND d.profile_id = auth.uid())
  );

CREATE POLICY "Authenticated users can create trips"
  ON public.trips FOR INSERT WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Admins and managers can update any trip"
  ON public.trips FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'manager'))
  );

CREATE POLICY "Users can cancel their own pending trips"
  ON public.trips FOR UPDATE
  USING (requester_id = auth.uid() AND status = 'pending')
  WITH CHECK (status = 'cancelled');

-- =============================================
-- TRIP LOGS
-- =============================================
CREATE TABLE IF NOT EXISTS public.trip_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status_from TEXT,
  status_to TEXT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.trip_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins and managers can view trip logs" ON public.trip_logs;
DROP POLICY IF EXISTS "Allow insert trip logs for authenticated" ON public.trip_logs;

CREATE POLICY "Admins and managers can view trip logs"
  ON public.trip_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'manager'))
  );

CREATE POLICY "Allow insert trip logs for authenticated"
  ON public.trip_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- =============================================
-- NOTIFICATIONS
-- =============================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  is_read BOOLEAN NOT NULL DEFAULT false,
  related_trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can mark their own notifications as read" ON public.notifications;
DROP POLICY IF EXISTS "Allow insert notifications for authenticated" ON public.notifications;

CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can mark their own notifications as read"
  ON public.notifications FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Allow insert notifications for authenticated"
  ON public.notifications FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS set_vehicles_updated_at ON public.vehicles;
DROP TRIGGER IF EXISTS set_drivers_updated_at ON public.drivers;
DROP TRIGGER IF EXISTS set_trips_updated_at ON public.trips;

CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_vehicles_updated_at BEFORE UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_drivers_updated_at BEFORE UPDATE ON public.drivers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_trips_updated_at BEFORE UPDATE ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    role = COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

SELECT 'Schema applied successfully!' AS status;

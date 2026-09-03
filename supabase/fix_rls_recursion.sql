-- =============================================
-- FIX: Infinite recursion in profiles RLS
-- The old policies queried the profiles table
-- from within a profiles policy — causing a loop.
-- This replaces them with non-recursive versions.
-- Run this in your Supabase SQL Editor.
-- =============================================

-- Drop all existing profiles policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins and managers can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow insert on profiles for authenticated users" ON public.profiles;

-- Simple non-recursive policies using auth.uid() and auth.jwt() only
-- (no subqueries back into profiles)

-- SELECT: users see their own row; admins/managers see all (via JWT role claim)
CREATE POLICY "select_own_profile"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = id
    OR (auth.jwt() ->> 'role') IN ('admin', 'manager')
    OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'manager')
    OR (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'manager')
  );

-- INSERT: authenticated users can insert their own row
CREATE POLICY "insert_own_profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- UPDATE: users update their own; admins update any (via JWT)
CREATE POLICY "update_own_profile"
  ON public.profiles FOR UPDATE
  USING (
    auth.uid() = id
    OR (auth.jwt() ->> 'role') IN ('admin', 'manager')
    OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'manager')
    OR (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'manager')
  );

-- DELETE: admins only
CREATE POLICY "delete_profile_admin"
  ON public.profiles FOR DELETE
  USING (
    (auth.jwt() ->> 'role') IN ('admin', 'manager')
    OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'manager')
    OR (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'manager')
  );

-- Also fix other tables that had the same recursive pattern
-- VEHICLES
DROP POLICY IF EXISTS "Admins and managers can manage vehicles" ON public.vehicles;
CREATE POLICY "manage_vehicles_admin"
  ON public.vehicles FOR ALL
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'manager')
    OR (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'manager')
  );

-- DRIVERS
DROP POLICY IF EXISTS "Admins and managers can manage drivers" ON public.drivers;
CREATE POLICY "manage_drivers_admin"
  ON public.drivers FOR ALL
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'manager')
    OR (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'manager')
  );

-- TRIPS
DROP POLICY IF EXISTS "Admins and managers can view all trips" ON public.trips;
DROP POLICY IF EXISTS "Admins and managers can update any trip" ON public.trips;

CREATE POLICY "admin_view_all_trips"
  ON public.trips FOR SELECT
  USING (
    requester_id = auth.uid()
    OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'manager')
    OR (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'manager')
    OR EXISTS (
      SELECT 1 FROM public.drivers d
      WHERE d.id = trips.driver_id AND d.profile_id = auth.uid()
    )
  );

CREATE POLICY "admin_update_trips"
  ON public.trips FOR UPDATE
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'manager')
    OR (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'manager')
    OR (requester_id = auth.uid() AND status = 'pending')
  );

-- TRIP LOGS
DROP POLICY IF EXISTS "Admins and managers can view trip logs" ON public.trip_logs;
CREATE POLICY "admin_view_trip_logs"
  ON public.trip_logs FOR SELECT
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'manager')
    OR (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'manager')
  );

-- NOTIFICATIONS (already fine, no recursion)

SELECT 'RLS recursion fix applied successfully!' AS status;

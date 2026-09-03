-- =============================================
-- MIGRATION: Vehicle → Manager assignment
-- Adds manager_id to vehicles so admin can assign
-- a vehicle pool to a specific manager.
-- The manager's drivers automatically see these vehicles.
-- Safe to run multiple times.
-- =============================================

ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_vehicles_manager_id ON public.vehicles(manager_id);

-- =============================================
-- FUNCTION: get_manager_vehicles (updated)
-- Returns vehicles whose manager_id matches the manager
-- OR vehicles where a driver in that manager's team
-- has current_vehicle_id pointing to that vehicle.
-- =============================================
CREATE OR REPLACE FUNCTION public.get_manager_vehicles(p_manager_id UUID)
RETURNS TABLE (
  vehicle_id       UUID,
  make             TEXT,
  model            TEXT,
  year             INTEGER,
  plate_number     TEXT,
  color            TEXT,
  vehicle_type     TEXT,
  status           TEXT,
  fuel_type        TEXT,
  capacity         INTEGER,
  driver_name      TEXT,
  driver_id        UUID,
  driver_status    TEXT,
  pending_requests BIGINT
) SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (v.id)
    v.id              AS vehicle_id,
    v.make            AS make,
    v.model           AS model,
    v.year            AS year,
    v.plate_number    AS plate_number,
    v.color           AS color,
    v.vehicle_type    AS vehicle_type,
    v.status          AS status,
    v.fuel_type       AS fuel_type,
    v.capacity        AS capacity,
    pr.full_name      AS driver_name,
    d.id              AS driver_id,
    d.status          AS driver_status,
    COUNT(vmr.id) FILTER (WHERE vmr.status = 'pending') AS pending_requests
  FROM public.vehicles v
  LEFT JOIN public.drivers d       ON d.current_vehicle_id = v.id AND d.is_active = true
  LEFT JOIN public.profiles pr     ON pr.id = d.profile_id
  LEFT JOIN public.manager_drivers md ON md.driver_id = d.id AND md.manager_id = p_manager_id
  LEFT JOIN public.vehicle_maintenance_requests vmr ON vmr.vehicle_id = v.id
  WHERE v.is_active = true
    AND (
      v.manager_id = p_manager_id   -- directly assigned to manager
      OR md.manager_id = p_manager_id  -- or a team driver is using it
    )
  GROUP BY v.id, v.make, v.model, v.year, v.plate_number, v.color,
           v.vehicle_type, v.status, v.fuel_type, v.capacity,
           pr.full_name, d.id, d.status
  ORDER BY v.id, pr.full_name;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- FUNCTION: get_system_pulse
-- High-level system stats for admin reports page.
-- No trip details — just business health numbers.
-- =============================================
CREATE OR REPLACE FUNCTION public.get_system_pulse()
RETURNS TABLE (
  total_managers     BIGINT,
  total_drivers      BIGINT,
  online_drivers     BIGINT,
  on_trip_drivers    BIGINT,
  total_vehicles     BIGINT,
  available_vehicles BIGINT,
  in_use_vehicles    BIGINT,
  maintenance_vehicles BIGINT,
  total_users        BIGINT,
  total_trips_ever   BIGINT,
  trips_today        BIGINT,
  trips_this_week    BIGINT,
  completed_ever     BIGINT,
  pending_now        BIGINT,
  active_now         BIGINT,
  completion_rate    NUMERIC,
  pending_maintenance BIGINT
) SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM public.profiles WHERE role = 'manager' AND is_active = true)   AS total_managers,
    (SELECT COUNT(*) FROM public.drivers WHERE is_active = true)                          AS total_drivers,
    (SELECT COUNT(*) FROM public.drivers WHERE status = 'available' AND is_active = true) AS online_drivers,
    (SELECT COUNT(*) FROM public.drivers WHERE status = 'on_trip' AND is_active = true)  AS on_trip_drivers,
    (SELECT COUNT(*) FROM public.vehicles WHERE is_active = true)                         AS total_vehicles,
    (SELECT COUNT(*) FROM public.vehicles WHERE status = 'available' AND is_active = true) AS available_vehicles,
    (SELECT COUNT(*) FROM public.vehicles WHERE status = 'on_trip' AND is_active = true) AS in_use_vehicles,
    (SELECT COUNT(*) FROM public.vehicles WHERE status = 'maintenance' AND is_active = true) AS maintenance_vehicles,
    (SELECT COUNT(*) FROM public.profiles WHERE role = 'user' AND is_active = true)      AS total_users,
    (SELECT COUNT(*) FROM public.trips)                                                   AS total_trips_ever,
    (SELECT COUNT(*) FROM public.trips WHERE created_at::date = CURRENT_DATE)            AS trips_today,
    (SELECT COUNT(*) FROM public.trips WHERE created_at >= date_trunc('week', NOW()))    AS trips_this_week,
    (SELECT COUNT(*) FROM public.trips WHERE status = 'completed')                       AS completed_ever,
    (SELECT COUNT(*) FROM public.trips WHERE status = 'pending')                         AS pending_now,
    (SELECT COUNT(*) FROM public.trips WHERE status IN ('approved','assigned','in_progress')) AS active_now,
    CASE WHEN (SELECT COUNT(*) FROM public.trips) > 0
      THEN ROUND((SELECT COUNT(*)::NUMERIC FROM public.trips WHERE status = 'completed') /
                 (SELECT COUNT(*)::NUMERIC FROM public.trips) * 100, 1)
      ELSE 0
    END AS completion_rate,
    (SELECT COUNT(*) FROM public.vehicle_maintenance_requests WHERE status = 'pending') AS pending_maintenance;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- FUNCTION: get_manager_summary
-- Per-manager breakdown for admin reports.
-- =============================================
CREATE OR REPLACE FUNCTION public.get_manager_summary()
RETURNS TABLE (
  manager_id     UUID,
  manager_name   TEXT,
  team_size      BIGINT,
  online_count   BIGINT,
  total_trips    BIGINT,
  completed_trips BIGINT,
  vehicle_count  BIGINT
) SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id                AS manager_id,
    p.full_name         AS manager_name,
    COUNT(DISTINCT md.driver_id)                   AS team_size,
    COUNT(DISTINCT d.id) FILTER (WHERE d.status = 'available') AS online_count,
    COUNT(DISTINCT t.id)                           AS total_trips,
    COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'completed') AS completed_trips,
    COUNT(DISTINCT v.id) FILTER (WHERE v.manager_id = p.id)    AS vehicle_count
  FROM public.profiles p
  LEFT JOIN public.manager_drivers md ON md.manager_id = p.id
  LEFT JOIN public.drivers d          ON d.id = md.driver_id AND d.is_active = true
  LEFT JOIN public.trips t            ON t.driver_id = d.id
  LEFT JOIN public.vehicles v         ON v.manager_id = p.id AND v.is_active = true
  WHERE p.role = 'manager' AND p.is_active = true
  GROUP BY p.id, p.full_name
  ORDER BY p.full_name;
END;
$$ LANGUAGE plpgsql;

SELECT 'Vehicle-manager migration applied!' AS status;

-- =============================================
-- MIGRATION: Manager Teams + Maintenance Requests
-- Run after schema.sql
-- Safe to run multiple times
-- =============================================

-- =============================================
-- TABLE: manager_drivers
-- Admin assigns which drivers belong to which manager
-- =============================================
CREATE TABLE IF NOT EXISTS public.manager_drivers (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  manager_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  driver_id   UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(manager_id, driver_id)
);

ALTER TABLE public.manager_drivers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage manager_drivers" ON public.manager_drivers;
DROP POLICY IF EXISTS "Managers can view their own team" ON public.manager_drivers;

CREATE POLICY "Admins can manage manager_drivers"
  ON public.manager_drivers FOR ALL
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "Managers can view their own team"
  ON public.manager_drivers FOR SELECT
  USING (manager_id = auth.uid());

-- =============================================
-- TABLE: vehicle_maintenance_requests
-- Drivers request repairs; managers request admin to change vehicle status
-- =============================================
CREATE TABLE IF NOT EXISTS public.vehicle_maintenance_requests (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  vehicle_id       UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  requested_by     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  request_type     TEXT NOT NULL DEFAULT 'repair'
                   CHECK (request_type IN ('repair', 'status_change', 'inspection', 'other')),
  current_status   TEXT NOT NULL,  -- vehicle status at time of request
  requested_status TEXT,           -- only for status_change requests
  description      TEXT NOT NULL,
  priority         TEXT NOT NULL DEFAULT 'normal'
                   CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status           TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'acknowledged', 'in_progress', 'resolved', 'rejected')),
  resolved_by      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  resolved_at      TIMESTAMPTZ,
  admin_notes      TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.vehicle_maintenance_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage maintenance requests" ON public.vehicle_maintenance_requests;
DROP POLICY IF EXISTS "Managers can view and create maintenance requests" ON public.vehicle_maintenance_requests;
DROP POLICY IF EXISTS "Drivers can create and view their own requests" ON public.vehicle_maintenance_requests;

CREATE POLICY "Admins can manage maintenance requests"
  ON public.vehicle_maintenance_requests FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "Managers can view and create maintenance requests"
  ON public.vehicle_maintenance_requests FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'manager')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'manager'))
  );

CREATE POLICY "Drivers can create and view their own requests"
  ON public.vehicle_maintenance_requests FOR ALL
  USING (requested_by = auth.uid())
  WITH CHECK (
    requested_by = auth.uid()
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'driver')
  );

-- Trigger for updated_at
DROP TRIGGER IF EXISTS set_vmr_updated_at ON public.vehicle_maintenance_requests;
CREATE TRIGGER set_vmr_updated_at
  BEFORE UPDATE ON public.vehicle_maintenance_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- FUNCTION: get_manager_team_stats
-- Returns driver stats for a manager's assigned team
-- =============================================
CREATE OR REPLACE FUNCTION public.get_manager_team_stats(p_manager_id UUID)
RETURNS TABLE (
  driver_id        UUID,
  driver_name      TEXT,
  driver_status    TEXT,
  employee_id      TEXT,
  phone            TEXT,
  total_trips      INTEGER,
  completed_trips  BIGINT,
  active_trips     BIGINT,
  rating           NUMERIC,
  vehicle_make     TEXT,
  vehicle_model    TEXT,
  vehicle_plate    TEXT,
  vehicle_status   TEXT
) SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id                  AS driver_id,
    pr.full_name          AS driver_name,
    d.status              AS driver_status,
    d.employee_id         AS employee_id,
    pr.phone              AS phone,
    d.total_trips         AS total_trips,
    COUNT(t.id) FILTER (WHERE t.status = 'completed') AS completed_trips,
    COUNT(t.id) FILTER (WHERE t.status IN ('assigned','in_progress')) AS active_trips,
    d.rating              AS rating,
    v.make                AS vehicle_make,
    v.model               AS vehicle_model,
    v.plate_number        AS vehicle_plate,
    v.status              AS vehicle_status
  FROM public.manager_drivers md
  JOIN public.drivers d      ON d.id = md.driver_id
  JOIN public.profiles pr    ON pr.id = d.profile_id
  LEFT JOIN public.vehicles v ON v.id = d.current_vehicle_id
  LEFT JOIN public.trips t   ON t.driver_id = d.id
  WHERE md.manager_id = p_manager_id
    AND d.is_active = true
  GROUP BY d.id, pr.full_name, d.status, d.employee_id, pr.phone,
           d.total_trips, d.rating, v.make, v.model, v.plate_number, v.status
  ORDER BY pr.full_name;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- FUNCTION: get_manager_vehicles
-- Returns vehicles assigned to a manager's team drivers
-- =============================================
CREATE OR REPLACE FUNCTION public.get_manager_vehicles(p_manager_id UUID)
RETURNS TABLE (
  vehicle_id     UUID,
  make           TEXT,
  model          TEXT,
  year           INTEGER,
  plate_number   TEXT,
  color          TEXT,
  vehicle_type   TEXT,
  status         TEXT,
  fuel_type      TEXT,
  capacity       INTEGER,
  driver_name    TEXT,
  driver_id      UUID,
  pending_requests BIGINT
) SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
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
    COUNT(vmr.id) FILTER (WHERE vmr.status = 'pending') AS pending_requests
  FROM public.manager_drivers md
  JOIN public.drivers d       ON d.id = md.driver_id
  JOIN public.profiles pr     ON pr.id = d.profile_id
  JOIN public.vehicles v      ON v.id = d.current_vehicle_id
  LEFT JOIN public.vehicle_maintenance_requests vmr ON vmr.vehicle_id = v.id
  WHERE md.manager_id = p_manager_id
    AND d.is_active = true
    AND v.is_active = true
  GROUP BY v.id, v.make, v.model, v.year, v.plate_number, v.color,
           v.vehicle_type, v.status, v.fuel_type, v.capacity, pr.full_name, d.id
  ORDER BY v.make, v.model;
END;
$$ LANGUAGE plpgsql;

SELECT 'Manager teams migration applied successfully!' AS status;

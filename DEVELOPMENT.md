# Katlego Logistics — Development Documentation

## Project Overview
Full-stack logistics management system built with Next.js 14 + Supabase.
South African fleet/driver/trip management for three user roles: admin, manager, driver, and end-user.

**Live URL**: Preview via Arena sandbox (port 3000)
**Repository**: thabofromrichfield/katlego
**Active branch**: arena/01a05d6b-katlego → force-pushed to `main` for user deploys

---

## Tech Stack
| Layer | Tech |
|---|---|
| Framework | Next.js 16.3.4 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind v4 + **100% inline styles for layout** (Tailwind v4 strips responsive classes at build time) |
| Database | Supabase (PostgreSQL + RLS + Realtime) |
| Auth | Supabase Auth (email/password, no email confirmation) |
| Maps | Leaflet + CartoDB light_all tiles (free) |
| Geocoding | Nominatim (OpenStreetMap, no API key) |
| Toast | react-hot-toast |

---

## Critical Known Constraints
1. **Tailwind v4 — NO breakpoint classes** (`sm:`, `lg:`, `xl:` etc.) — they are stripped at build.
   **Rule**: All layout, spacing, and grid must use `style={{}}` inline objects.
   Use `gridTemplateColumns: 'repeat(auto-fill, minmax(Npx, 1fr))'` for responsive grids.
2. **No server-side rendering** — all protected pages are CSR (`'use client'`) due to cookie/session timing.
3. **Supabase URL**: `http://supabasekong-l7gihbchirkalykcytsmifhb.84.8.140.123.sslip.io` (port 80 via Coolify proxy)
4. **No SERVICE_ROLE_KEY** — all DB ops go through the anon client with RLS.
5. **User deploy command**: `git fetch origin && git reset --hard origin/main && rm -rf .next && npm install && npm run dev`

---

## Role System
| Role | Access | Panel |
|---|---|---|
| `admin` | Everything — manages all vehicles, all drivers, all managers, all trips | `/admin` |
| `manager` | Their assigned team of drivers + those drivers' vehicles | `/admin` (filtered) |
| `driver` | Their own trips, availability toggle | `/driver` |
| `user` | Book trips, view own trips | `/dashboard` |

### Role routing
- `/admin/*` — admin AND manager
- `/driver/*` — driver (admin/manager can also access for debugging)
- `/dashboard/*` — user

---

## Database Schema (current)

### `profiles`
```
id (uuid PK → auth.users)
full_name, phone, avatar_url
role: 'admin' | 'manager' | 'driver' | 'user'
is_active, created_at, updated_at
```

### `vehicles`
```
id (uuid PK)
plate_number (unique), make, model, year, color
capacity, vehicle_type: sedan|suv|van|truck|minibus|bus
status: available | on_trip | maintenance | offline
fuel_type: petrol|diesel|electric|hybrid
mileage, last_service_date, next_service_date, insurance_expiry
notes, is_active, created_at, updated_at
```

### `drivers`
```
id (uuid PK)
profile_id → profiles.id
employee_id (unique), license_number (unique), license_expiry, license_class
status: available | on_trip | off_duty | leave | suspended
rating (decimal), total_trips
current_vehicle_id → vehicles.id
emergency_contact_name, emergency_contact_phone
address, date_of_birth, date_hired, notes
is_active, created_at, updated_at
```

### `trips`
```
id (uuid PK)
booking_reference (unique, auto-generated)
requester_id → profiles.id
driver_id → drivers.id
vehicle_id → vehicles.id
pickup_address, pickup_lat, pickup_lng
destination_address, destination_lat, destination_lng
trip_type: immediate | scheduled
scheduled_datetime
actual_pickup_time, actual_dropoff_time
status: pending | approved | assigned | in_progress | completed | cancelled | rejected
priority: low | normal | high | urgent
passenger_count, purpose, notes, cancellation_reason
fare_amount, payment_status: unpaid|paid|waived
passenger_rating, driver_rating, passenger_feedback
created_at, updated_at
```

### `trip_logs`
```
id, trip_id, changed_by, status_from, status_to, note, created_at
```

### `notifications`
```
id, user_id, title, message
type: info | success | warning | error
is_read, related_trip_id, created_at
```

### `manager_drivers` (NEW — migration required)
```
id (uuid PK)
manager_id → profiles.id   (role must be manager)
driver_id  → drivers.id
assigned_by → profiles.id  (role must be admin)
assigned_at TIMESTAMPTZ
```
Purpose: Admin assigns which drivers belong to which manager's team.

### `vehicle_maintenance_requests` (NEW — migration required)
```
id (uuid PK)
vehicle_id → vehicles.id
requested_by → profiles.id   (driver or manager)
request_type: repair | status_change | inspection | other
current_status TEXT           (vehicle's current status when request made)
requested_status TEXT         (what status change is being requested, nullable)
description TEXT NOT NULL
priority: low | normal | high | urgent
status: pending | acknowledged | in_progress | resolved | rejected
resolved_by → profiles.id
resolved_at TIMESTAMPTZ
admin_notes TEXT
created_at, updated_at
```
Purpose: Drivers request repairs; managers request status changes to admin.

---

## Migration Files
Run in Supabase SQL Editor in order:
1. `supabase/schema.sql` — initial tables + RLS
2. `supabase/fix_email_confirmation.sql` — skip email confirm
3. `supabase/fix_rls_recursion.sql` — auth.jwt() based policies
4. `supabase/fix_role_function.sql` — get_my_role() RPC
5. `supabase/migration_manager_teams.sql` — **NEW** manager_drivers + vehicle_maintenance_requests tables

---

## Application Pages

### Auth
- `/login` — split panel, inline styles, 3-tier role resolution → redirects by role
- `/register` — role selection (admin/manager/driver/user)
- `/forgot-password` — email reset

### Admin Panel (`/admin/*`)
- `/admin` — Operations dashboard (admin: global stats; manager: team-specific view)
- `/admin/vehicles` — Fleet CRUD (admin: all vehicles; manager: team vehicles)
- `/admin/drivers` — Driver CRUD + status (admin: all; manager: team only)
- `/admin/reports` — Analytics (admin: global; manager: team-scoped)
- `/admin/settings` — Account settings

### Driver Panel (`/driver/*`)
- `/driver` — Dashboard: active trip, stats, vehicle info, on/off duty toggle
- `/driver/trips` — Assigned trips, status updates
- `/driver/notifications` — Alerts
- `/driver/settings` — Profile + password

### User Panel (`/dashboard/*`)
- `/dashboard` — Stats + quick book
- `/dashboard/book` — Book trip (immediate or scheduled, address autocomplete + map)
- `/dashboard/trips` — Trip history + cancel
- `/dashboard/notifications` — Alerts
- `/dashboard/settings` — Profile + password

---

## Component Library
All in `src/components/ui/`:
- `Badge` — 7 variants (success/info/warning/danger/default/purple/outline), dot prop
- `Button` — primary/outline/ghost/danger, loading spinner, icon prop
- `Input` / `Textarea` — inline-style, icon left/right, label/error/hint
- `Select` — custom SVG chevron, inline-style
- `SearchInput` — icon at left:10px, text at paddingLeft:34px
- `Modal` — fixed overlay, flex-start, 65vh body scroll, ESC closes
- `Card` / `CardHeader` / `CardTitle` / `CardContent` / `CardFooter`
- `StatCard` — accent bar, trend icons

Layout:
- `Sidebar` — role-aware nav, inline styles throughout, profile chip
- `PageHeader` — title + badge + subtitle + actions slot

---

## Feature Development Log

### Round 1 — Initial Build
- Next.js project scaffolding
- Supabase schema, RLS, auth
- All panels: admin, driver, user
- Role-based routing middleware

### Round 2 — Auth & Map Fixes
- Login 3-tier role resolution (RPC → profile select → user_metadata)
- Address autocomplete (Nominatim, ZA-filtered)
- Location picker (Leaflet, CartoDB tiles)
- Icon overlap fixes, SearchInput swaps

### Round 3 — UI Bug Fixes (Screenshots)
- CartoDB `light_all` tile (was `rastertiles/voyager` — required paid API key)
- Input/Select full inline-style rewrite (Tailwind v4 compat)
- Modal: fixed overlay, flex-start, 48px top padding, body 65vh scroll
- Settings pages: maxWidth inline (640/680px)

### Round 4 — Root cause fix: Tailwind v4 layout
- Deleted `.next` cache, force-pushed arena branch → main
- ALL grids converted to `gridTemplateColumns: repeat(auto-fill, minmax(Npx,1fr))`
- ALL spacing/layout converted to inline `style={{}}` — no Tailwind for layout

### Round 5 — Manager Team System (CURRENT)
New features being built:
- `manager_drivers` join table: admin assigns drivers to managers
- `vehicle_maintenance_requests` table: driver requests repair, manager requests status change
- Driver on/off duty toggle → realtime Supabase channel → manager dashboard shows live status
- Manager dashboard: team-only view (assigned drivers only), driver breakdown table with status + trip count
- Fleet Vehicles (manager view): assigned vehicles only, maintenance request flow
- Removed: Trip Management tab from manager nav; Recent Trip Requests from manager dashboard
- Removed: User Management page (no clear business value without deep admin tooling)

---

## Design System Tokens (globals.css)
```
--brand-primary: #2563eb
--brand-navy: #0f172a
--surface-page: #f8fafc
--surface-card: #ffffff
--surface-border: #e2e8f0
--text-primary: #0f172a
--text-secondary: #475569
--text-muted: #94a3b8
```

Status colours:
- success: #059669 / bg #d1fae5
- warning: #d97706 / bg #fef3c7
- danger: #e11d48 / bg #ffe4e6
- info: #0284c7 / bg #e0f2fe
- purple: #7c3aed / bg #ede9fe

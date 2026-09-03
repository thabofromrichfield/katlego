'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { AddressAutocomplete } from '@/components/map/address-autocomplete'
import {
  Calendar, AlertCircle, CheckCircle2, Zap, Clock,
  Navigation, Loader2, Map, ChevronDown, ChevronUp,
} from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'

const LocationPicker = dynamic(
  () => import('@/components/map/location-picker').then(m => m.LocationPicker),
  { ssr: false, loading: () => (
    <div style={{ height: 300, borderRadius: 16, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid #e2e8f0' }}>
      <div style={{ textAlign: 'center' }}>
        <Loader2 style={{ width: 22, height: 22, color: '#94a3b8', animation: 'spin 0.75s linear infinite', margin: '0 auto 8px' }} />
        <p style={{ fontSize: 13, color: '#94a3b8' }}>Loading map…</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  )}
)

const JHB = { lat: -26.2041, lng: 28.0473 }
type GeoState = 'idle' | 'detecting' | 'done' | 'denied'

function BookTripPageInner() {
  const sp = useSearchParams()
  const [tripType,         setTripType]         = useState<'immediate'|'scheduled'>(sp.get('type') === 'scheduled' ? 'scheduled' : 'immediate')
  const [pickupAddress,    setPickupAddress]    = useState('')
  const [pickupLat,        setPickupLat]        = useState(JHB.lat)
  const [pickupLng,        setPickupLng]        = useState(JHB.lng)
  const [pickupCoordsSet,  setPickupCoordsSet]  = useState(false)
  const [destAddress,      setDestAddress]      = useState('')
  const [destLat,          setDestLat]          = useState<number|null>(null)
  const [destLng,          setDestLng]          = useState<number|null>(null)
  const [scheduledAt,      setScheduledAt]      = useState('')
  const [priority,         setPriority]         = useState('normal')
  const [passengers,       setPassengers]       = useState('1')
  const [notes,            setNotes]            = useState('')
  const [showMap,          setShowMap]          = useState(false)
  const [loading,          setLoading]          = useState(false)
  const [success,          setSuccess]          = useState<any>(null)
  const [formError,        setFormError]        = useState('')
  const [geoState,         setGeoState]         = useState<GeoState>('idle')

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, { headers: { 'Accept-Language': 'en' } })
      const d = await r.json()
      return d.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`
    } catch { return `${lat.toFixed(5)}, ${lng.toFixed(5)}` }
  }, [])

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) { toast.error('Geolocation not supported by your browser'); return }
    setGeoState('detecting')
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude: lat, longitude: lng } = pos.coords
        const addr = await reverseGeocode(lat, lng)
        setPickupLat(lat); setPickupLng(lng)
        setPickupAddress(addr); setPickupCoordsSet(true)
        setShowMap(true); setGeoState('done')
        toast.success('Location detected! You can fine-tune by dragging the pin.')
      },
      err => {
        setGeoState(err.code === 1 ? 'denied' : 'idle')
        if (err.code === 1) toast.error('Location permission denied. Type your address instead.')
        else toast.error('Could not detect location. Please type your address.')
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    )
  }, [reverseGeocode])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    if (!pickupAddress.trim())  { setFormError('Please enter or detect a pickup address.'); return }
    if (!destAddress.trim())    { setFormError('Please enter a destination.'); return }
    if (tripType === 'scheduled' && !scheduledAt) { setFormError('Please select a date and time.'); return }
    const pax = parseInt(passengers, 10)
    if (isNaN(pax) || pax < 1) { setFormError('Passenger count must be at least 1.'); return }

    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }

    const ref = `KL-${Date.now().toString(36).toUpperCase()}`
    const { data, error: err } = await supabase.from('trips').insert({
      requester_id:        user.id,
      pickup_address:      pickupAddress.trim(),
      pickup_lat:          pickupCoordsSet ? pickupLat : null,
      pickup_lng:          pickupCoordsSet ? pickupLng : null,
      destination_address: destAddress.trim(),
      destination_lat:     destLat,
      destination_lng:     destLng,
      trip_type:           tripType,
      scheduled_datetime:  tripType === 'scheduled' ? new Date(scheduledAt).toISOString() : null,
      priority, passenger_count: pax,
      notes: notes.trim() || null,
      status: 'pending', booking_reference: ref,
    }).select().single()

    if (err) { setFormError(err.message); setLoading(false); return }
    toast.success('Trip booked!')
    setSuccess(data)
    setLoading(false)
  }

  const resetForm = () => {
    setSuccess(null); setPickupAddress(''); setDestAddress('')
    setPickupCoordsSet(false); setPickupLat(JHB.lat); setPickupLng(JHB.lng)
    setDestLat(null); setDestLng(null); setNotes(''); setScheduledAt('')
    setShowMap(false); setGeoState('idle')
  }

  const inputBase: React.CSSProperties = { height: 46, width: '100%', padding: '0 14px', border: '1.5px solid #e2e8f0', borderRadius: 12, fontSize: 14, color: '#0f172a', background: 'white', outline: 'none', boxSizing: 'border-box' }
  const labelStyle: React.CSSProperties = { fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6, display: 'block' }

  // ── Success ──
  if (success) {
    return (
      <div style={{ maxWidth: 440, margin: '0 auto', textAlign: 'center', padding: '48px 0' }}>
        <div style={{ width: 72, height: 72, background: '#d1fae5', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <CheckCircle2 style={{ width: 36, height: 36, color: '#059669' }} />
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', marginBottom: 8 }}>Trip Booked!</h2>
        <p style={{ fontSize: 13, color: '#64748b', marginBottom: 8 }}>Your booking reference:</p>
        <div style={{ display: 'inline-block', background: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: 14, padding: '10px 24px', marginBottom: 20 }}>
          <p style={{ fontSize: 22, fontFamily: 'monospace', fontWeight: 900, color: '#1d4ed8' }}>{success.booking_reference}</p>
        </div>
        <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7, marginBottom: 28 }}>
          Our team will review and approve your request shortly.<br />You'll be notified once a driver is assigned.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Link href="/dashboard/trips" style={{ height: 42, padding: '0 20px', borderRadius: 12, border: '1.5px solid #e2e8f0', background: 'white', fontSize: 14, fontWeight: 600, color: '#374151', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
            View My Trips
          </Link>
          <button onClick={resetForm} style={{ height: 42, padding: '0 20px', borderRadius: 12, background: '#2563eb', color: 'white', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            Book Another
          </button>
        </div>
      </div>
    )
  }

  // ── Form ──
  return (
    <div style={{ maxWidth: 640, width: '100%' }}>
      <PageHeader title="Book a Trip" subtitle="Request transport and we'll assign a driver for you." />

      {/* Trip type toggle */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        {([
          { value: 'immediate', label: 'Book Now',  icon: Zap,   desc: 'Get a driver ASAP' },
          { value: 'scheduled', label: 'Schedule',  icon: Clock, desc: 'Choose a future time' },
        ] as const).map(opt => {
          const active = tripType === opt.value
          return (
            <button key={opt.value} type="button" onClick={() => setTripType(opt.value)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 16, border: `2px solid ${active ? '#2563eb' : '#e2e8f0'}`, background: active ? '#eff6ff' : 'white', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
              <div style={{ width: 40, height: 40, background: active ? '#2563eb' : '#f1f5f9', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <opt.icon style={{ width: 18, height: 18, color: active ? 'white' : '#64748b' }} />
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: active ? '#1d4ed8' : '#374151', marginBottom: 2 }}>{opt.label}</p>
                <p style={{ fontSize: 12, color: '#94a3b8' }}>{opt.desc}</p>
              </div>
            </button>
          )
        })}
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* ── PICKUP ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <AddressAutocomplete
                label="Pickup Address"
                required
                value={pickupAddress}
                onChange={v => { setPickupAddress(v); if (!v) { setPickupCoordsSet(false) } }}
                onSelect={(lat, lng, addr) => { setPickupLat(lat); setPickupLng(lng); setPickupAddress(addr); setPickupCoordsSet(true) }}
                placeholder="Start typing your pickup address…"
                hint="Suggestions appear as you type — powered by OpenStreetMap"
                rightElement={
                  <button
                    type="button" onClick={detectLocation}
                    disabled={geoState === 'detecting'}
                    title="Detect my location"
                    style={{ display: 'flex', alignItems: 'center', gap: 5, height: 28, padding: '0 10px', background: geoState === 'done' ? '#f0fdf4' : '#eff6ff', border: `1px solid ${geoState === 'done' ? '#bbf7d0' : '#bfdbfe'}`, borderRadius: 8, fontSize: 11, fontWeight: 700, color: geoState === 'done' ? '#059669' : '#2563eb', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {geoState === 'detecting'
                      ? <Loader2 style={{ width: 12, height: 12, animation: 'spin 0.75s linear infinite' }} />
                      : <Navigation style={{ width: 12, height: 12 }} />
                    }
                    <span className="hidden sm:inline">
                      {geoState === 'done' ? 'Located' : geoState === 'detecting' ? 'Detecting…' : 'Use GPS'}
                    </span>
                  </button>
                }
              />

              {/* GPS badge */}
              {pickupCoordsSet && (
                <p style={{ fontSize: 12, color: '#059669', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle2 style={{ width: 13, height: 13, flexShrink: 0 }} />
                  GPS coordinates saved ({pickupLat.toFixed(4)}, {pickupLng.toFixed(4)})
                </p>
              )}

              {/* Map toggle */}
              <button type="button" onClick={() => setShowMap(v => !v)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#2563eb', padding: 0, alignSelf: 'flex-start' }}>
                <Map style={{ width: 14, height: 14 }} />
                {showMap ? 'Hide map' : 'Pin location on map'}
                {showMap ? <ChevronUp style={{ width: 13, height: 13 }} /> : <ChevronDown style={{ width: 13, height: 13 }} />}
              </button>

              {showMap && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <p style={{ fontSize: 12, color: '#64748b' }}>Tap the map or drag the pin to set your exact pickup point.</p>
                  <LocationPicker
                    lat={pickupLat} lng={pickupLng} label="Pickup"
                    onPick={(lat, lng, addr) => { setPickupLat(lat); setPickupLng(lng); setPickupAddress(addr); setPickupCoordsSet(true) }}
                  />
                </div>
              )}
            </div>

            {/* ── DESTINATION ── */}
            <AddressAutocomplete
              label="Destination"
              required
              value={destAddress}
              onChange={setDestAddress}
              onSelect={(lat, lng, addr) => { setDestLat(lat); setDestLng(lng); setDestAddress(addr) }}
              placeholder="Where are you going?"
              hint="Suggestions appear as you type"
              accentColor="#7c3aed"
            />

            {/* ── SCHEDULED DATE ── */}
            {tripType === 'scheduled' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={labelStyle}>Date & Time <span style={{ color: '#e11d48' }}>*</span></label>
                <input
                  type="datetime-local" value={scheduledAt} required
                  min={new Date(Date.now() + 5 * 60_000).toISOString().slice(0, 16)}
                  onChange={e => setScheduledAt(e.target.value)}
                  style={{ ...inputBase }}
                  onFocus={e => e.target.style.borderColor = '#2563eb'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
                <p style={{ fontSize: 12, color: '#94a3b8' }}>Must be at least 5 minutes from now</p>
              </div>
            )}

            {/* ── PRIORITY + PASSENGERS ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={labelStyle}>Priority</label>
                <div style={{ position: 'relative' }}>
                  <select value={priority} onChange={e => setPriority(e.target.value)}
                    style={{ ...inputBase, paddingRight: 32, appearance: 'none' as any }}
                    onFocus={e => e.target.style.borderColor = '#2563eb'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}>
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">🚨 Urgent</option>
                  </select>
                  <ChevronDown style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: '#94a3b8', pointerEvents: 'none' }} />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={labelStyle}>Passengers</label>
                <input type="number" value={passengers} min={1} max={20}
                  onChange={e => setPassengers(e.target.value)}
                  style={{ ...inputBase }}
                  onFocus={e => e.target.style.borderColor = '#2563eb'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>
            </div>

            {/* ── NOTES ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={labelStyle}>Notes <span style={{ fontWeight: 400, color: '#94a3b8', fontSize: 12 }}>(optional)</span></label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="e.g. Gate code, luggage, special instructions for the driver…"
                rows={3}
                style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #e2e8f0', borderRadius: 12, fontSize: 14, color: '#0f172a', background: 'white', outline: 'none', resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                onFocus={e => e.target.style.borderColor = '#2563eb'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>

            {/* Error */}
            {formError && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 12, padding: '12px 14px' }}>
                <AlertCircle style={{ width: 16, height: 16, color: '#e11d48', flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 13, color: '#be123c', fontWeight: 500 }}>{formError}</p>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 12 }}>
              <Link href="/dashboard" style={{ flex: 1, height: 46, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12, border: '1.5px solid #e2e8f0', background: 'white', fontSize: 14, fontWeight: 600, color: '#374151', textDecoration: 'none', transition: 'background 0.15s' }}>
                Cancel
              </Link>
              <button type="submit" disabled={loading}
                style={{ flex: 1, height: 46, background: loading ? '#93c5fd' : '#2563eb', color: 'white', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 16px rgba(37,99,235,0.25)' }}>
                {loading ? (
                  <><Loader2 style={{ width: 16, height: 16, animation: 'spin 0.75s linear infinite' }} /> Booking…</>
                ) : tripType === 'immediate' ? (
                  <><Zap style={{ width: 16, height: 16 }} /> Request Trip Now</>
                ) : (
                  <><Calendar style={{ width: 16, height: 16 }} /> Schedule Trip</>
                )}
              </button>
            </div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function BookTripPage() {
  return <Suspense><BookTripPageInner /></Suspense>
}

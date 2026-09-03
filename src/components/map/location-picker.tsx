'use client'

import { useEffect, useRef, useState } from 'react'

interface LocationPickerProps {
  lat: number
  lng: number
  label?: string
  onPick: (lat: number, lng: number, address: string) => void
}

export function LocationPicker({ lat, lng, label = 'Pickup', onPick }: LocationPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<any>(null)
  const markerRef    = useRef<any>(null)
  const [geocoding, setGeocoding] = useState(false)

  async function reverseGeocode(rlat: number, rlng: number) {
    setGeocoding(true)
    try {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${rlat}&lon=${rlng}&format=json`,
        { headers: { 'Accept-Language': 'en' } }
      )
      const d = await r.json()
      onPick(rlat, rlng, d.display_name ?? `${rlat.toFixed(5)}, ${rlng.toFixed(5)}`)
    } catch {
      onPick(rlat, rlng, `${rlat.toFixed(5)}, ${rlng.toFixed(5)}`)
    } finally {
      setGeocoding(false)
    }
  }

  useEffect(() => {
    if (!containerRef.current) return

    const el = containerRef.current as any
    if (el._leaflet_id != null) {
      mapRef.current?.remove()
      mapRef.current = null
      markerRef.current = null
      el._leaflet_id = undefined
    }

    let map: any, marker: any

    import('leaflet').then((L) => {
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      if (!containerRef.current) return

      map = L.map(containerRef.current, {
        center: [lat, lng],
        zoom: 15,
        zoomControl: true,
        scrollWheelZoom: true,
        attributionControl: true,
      })

      // CartoDB Positron Light — clean, minimal, no API key required, Google Maps-like
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map)

      // Clean custom marker — simple dot with pulse
      const markerIcon = L.divIcon({
        className: '',
        html: `
          <div style="position:relative;width:40px;height:40px">
            <div style="
              position:absolute;inset:0;
              background:rgba(37,99,235,0.18);
              border-radius:50%;
              animation:mp 2s ease-in-out infinite;
            "></div>
            <div style="
              position:absolute;top:50%;left:50%;
              transform:translate(-50%,-50%);
              width:18px;height:18px;
              background:#2563eb;
              border-radius:50%;
              border:3px solid white;
              box-shadow:0 2px 12px rgba(37,99,235,0.5);
            "></div>
          </div>
          <style>
            @keyframes mp{0%,100%{transform:scale(1);opacity:.18}50%{transform:scale(1.9);opacity:.06}}
          </style>
        `,
        iconSize:   [40, 40],
        iconAnchor: [20, 20],
      })

      marker = L.marker([lat, lng], { icon: markerIcon, draggable: true }).addTo(map)
      marker.bindPopup(
        `<div style="font-size:13px;font-weight:600;color:#0f172a;padding:2px 0">${label}</div>
         <div style="font-size:12px;color:#64748b;margin-top:2px">Drag or tap to adjust</div>`,
        { offset: [0, -14], closeButton: false }
      ).openPopup()

      marker.on('dragend', () => {
        const p = marker.getLatLng()
        reverseGeocode(p.lat, p.lng)
      })
      map.on('click', (e: any) => {
        marker.setLatLng(e.latlng)
        reverseGeocode(e.latlng.lat, e.latlng.lng)
      })

      mapRef.current    = map
      markerRef.current = marker
    })

    return () => {
      try { map?.remove() } catch {}
      try { mapRef.current?.remove() } catch {}
      mapRef.current    = null
      markerRef.current = null
      if (containerRef.current) (containerRef.current as any)._leaflet_id = undefined
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return
    markerRef.current.setLatLng([lat, lng])
    mapRef.current.setView([lat, lng], 15, { animate: true })
  }, [lat, lng])

  return (
    <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', border: '1.5px solid #e2e8f0', boxShadow: '0 2px 16px rgba(15,23,42,0.08)', height: 300 }}>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div ref={containerRef} style={{ height: '100%', width: '100%' }} />

      {geocoding && (
        <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 1000, background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 16px rgba(15,23,42,0.1)', pointerEvents: 'none' }}>
          <svg style={{ width: 14, height: 14, color: '#2563eb', animation: 'spin 0.75s linear infinite' }} viewBox="0 0 24 24" fill="none">
            <circle opacity=".25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path opacity=".75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Getting address…</span>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', zIndex: 1000, background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(8px)', color: 'white', fontSize: 11, fontWeight: 500, padding: '6px 14px', borderRadius: 100, pointerEvents: 'none', whiteSpace: 'nowrap' }}>
        📍 Tap map or drag pin to set pickup
      </div>
    </div>
  )
}

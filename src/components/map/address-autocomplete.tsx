'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { MapPin, X, Loader2 } from 'lucide-react'

interface Suggestion { display_name: string; lat: string; lon: string }

interface AddressAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onSelect?: (lat: number, lng: number, address: string) => void
  placeholder?: string
  required?: boolean
  label?: string
  hint?: string
  accentColor?: string   // ring colour class when focused
  rightElement?: React.ReactNode
}

export function AddressAutocomplete({
  value, onChange, onSelect,
  placeholder = 'Start typing an address…',
  required, label, hint,
  accentColor = '#2563eb',
  rightElement,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading]         = useState(false)
  const [open, setOpen]               = useState(false)
  const debounceRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const search = useCallback((q: string) => {
    if (q.trim().length < 3) { setSuggestions([]); setOpen(false); return }
    setLoading(true)
    fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&countrycodes=za&addressdetails=0`,
      { headers: { 'Accept-Language': 'en' } }
    )
      .then(r => r.json())
      .then((results: Suggestion[]) => {
        setSuggestions(results)
        setOpen(results.length > 0)
      })
      .catch(() => setSuggestions([]))
      .finally(() => setLoading(false))
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    onChange(v)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(v), 400)
  }

  const handleSelect = (s: Suggestion) => {
    onChange(s.display_name)
    onSelect?.(parseFloat(s.lat), parseFloat(s.lon), s.display_name)
    setSuggestions([])
    setOpen(false)
  }

  const handleClear = () => {
    onChange('')
    setSuggestions([])
    setOpen(false)
  }

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && (
        <label style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>
          {label}{required && <span style={{ color: '#e11d48', marginLeft: 2 }}>*</span>}
        </label>
      )}

      <div style={{ position: 'relative' }}>
        {/* Left icon */}
        <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
          {loading
            ? <Loader2 style={{ width: 16, height: 16, color: accentColor, animation: 'spin 0.75s linear infinite' }} />
            : <MapPin style={{ width: 16, height: 16, color: '#94a3b8' }} />
          }
        </div>

        <input
          type="text"
          value={value}
          onChange={handleChange}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          required={required}
          autoComplete="off"
          style={{
            height: 46, width: '100%',
            paddingLeft: 40,
            paddingRight: (value || rightElement) ? 40 : 14,
            border: `1.5px solid #e2e8f0`,
            borderRadius: 12, fontSize: 14, color: '#0f172a',
            background: 'white', outline: 'none', boxSizing: 'border-box',
            transition: 'border-color 0.15s',
          }}
          onFocusCapture={e => e.target.style.borderColor = accentColor}
          onBlurCapture={e => e.target.style.borderColor = '#e2e8f0'}
        />

        {/* Right: clear or custom element */}
        {(value || rightElement) && (
          <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: 4 }}>
            {rightElement}
            {value && (
              <button type="button" onClick={handleClear}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
                <X style={{ width: 14, height: 14 }} />
              </button>
            )}
          </div>
        )}

        {/* Suggestions dropdown */}
        {open && suggestions.length > 0 && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 9999,
            background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 14,
            boxShadow: '0 8px 32px rgba(15,23,42,0.12)', marginTop: 4,
            overflow: 'hidden',
          }}>
            {suggestions.map((s, i) => (
              <button
                key={i}
                type="button"
                onMouseDown={() => handleSelect(s)}
                style={{
                  width: '100%', textAlign: 'left', padding: '10px 14px',
                  background: 'none', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  borderBottom: i < suggestions.length - 1 ? '1px solid #f1f5f9' : 'none',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                <MapPin style={{ width: 14, height: 14, color: accentColor, flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: 13, color: '#374151', lineHeight: 1.4 }}>
                  {s.display_name}
                </span>
              </button>
            ))}
          </div>
        )}
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>

      {hint && <p style={{ fontSize: 12, color: '#94a3b8' }}>{hint}</p>}
    </div>
  )
}

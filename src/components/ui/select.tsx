import { cn } from '@/lib/utils'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  hint?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

export function Select({ label, error, hint, options, placeholder, className, id, ...props }: SelectProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
      {label && (
        <label htmlFor={inputId} style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block' }}>
          {label}
          {props.required && <span style={{ color: '#e11d48', marginLeft: 2 }}>*</span>}
        </label>
      )}
      <div style={{ position: 'relative', width: '100%' }}>
        <select
          id={inputId}
          style={{
            height: 44, width: '100%', boxSizing: 'border-box',
            paddingLeft: 14, paddingRight: 36,
            border: error ? '1.5px solid #fca5a5' : '1.5px solid #e2e8f0',
            borderRadius: 12, fontSize: 14, color: '#0f172a',
            background: 'white', outline: 'none', appearance: 'none',
            fontFamily: 'inherit', cursor: 'pointer',
          }}
          onFocus={e => e.target.style.borderColor = '#2563eb'}
          onBlur={e => e.target.style.borderColor = error ? '#fca5a5' : '#e2e8f0'}
          className={className}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {/* Custom arrow */}
        <svg style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: '#94a3b8', pointerEvents: 'none' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      {error && <p style={{ fontSize: 12, color: '#ef4444', fontWeight: 500 }}>⚠ {error}</p>}
      {hint && !error && <p style={{ fontSize: 12, color: '#94a3b8' }}>{hint}</p>}
    </div>
  )
}

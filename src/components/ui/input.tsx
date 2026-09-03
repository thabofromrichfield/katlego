import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  icon?: LucideIcon
  iconRight?: LucideIcon
  onIconRightClick?: () => void
}

export function Input({
  label,
  error,
  hint,
  icon: Icon,
  iconRight: IconRight,
  onIconRightClick,
  className,
  id,
  style,
  ...props
}: InputProps) {
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
        {Icon && (
          <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'flex', alignItems: 'center', width: 16, height: 16 }}>
            <Icon style={{ width: 15, height: 15, color: '#94a3b8' }} />
          </div>
        )}
        <input
          id={inputId}
          style={{
            height: 44, width: '100%', boxSizing: 'border-box',
            paddingLeft: Icon ? 38 : 14,
            paddingRight: IconRight ? 38 : 14,
            border: error ? '1.5px solid #fca5a5' : '1.5px solid #e2e8f0',
            borderRadius: 12, fontSize: 14, color: '#0f172a',
            background: props.disabled ? '#f8fafc' : 'white',
            outline: 'none', fontFamily: 'inherit',
            cursor: props.disabled ? 'not-allowed' : 'text',
            ...style,
          }}
          onFocus={e => { if (!props.disabled) e.target.style.borderColor = error ? '#f87171' : '#2563eb' }}
          onBlur={e => { e.target.style.borderColor = error ? '#fca5a5' : '#e2e8f0' }}
          className={className}
          {...props}
        />
        {IconRight && (
          <button
            type="button"
            onClick={onIconRightClick}
            style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', padding: 2 }}
          >
            <IconRight style={{ width: 16, height: 16 }} />
          </button>
        )}
      </div>
      {error && <p style={{ fontSize: 12, color: '#ef4444', fontWeight: 500 }}>⚠ {error}</p>}
      {hint && !error && <p style={{ fontSize: 12, color: '#94a3b8' }}>{hint}</p>}
    </div>
  )
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export function Textarea({ label, error, hint, className, id, ...props }: TextareaProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
      {label && (
        <label htmlFor={inputId} style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block' }}>
          {label}
          {props.required && <span style={{ color: '#e11d48', marginLeft: 2 }}>*</span>}
        </label>
      )}
      <textarea
        id={inputId}
        style={{
          width: '100%', boxSizing: 'border-box', padding: '10px 14px',
          border: error ? '1.5px solid #fca5a5' : '1.5px solid #e2e8f0',
          borderRadius: 12, fontSize: 14, color: '#0f172a',
          background: 'white', outline: 'none', resize: 'none', fontFamily: 'inherit',
        }}
        onFocus={e => e.target.style.borderColor = '#2563eb'}
        onBlur={e => e.target.style.borderColor = error ? '#fca5a5' : '#e2e8f0'}
        className={className}
        {...props}
      />
      {error && <p style={{ fontSize: 12, color: '#ef4444', fontWeight: 500 }}>⚠ {error}</p>}
      {hint && !error && <p style={{ fontSize: 12, color: '#94a3b8' }}>{hint}</p>}
    </div>
  )
}

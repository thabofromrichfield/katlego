import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SearchInputProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
}

/**
 * SearchInput — search icon at left:10px, text padding pl-9 (36px).
 * Icon is 16px wide, ends at 26px. Text starts at 36px. 10px gap. No overlap.
 * Uses inline style for the input so Tailwind purge never strips critical padding.
 */
export function SearchInput({ value, onChange, placeholder = 'Search…', className }: SearchInputProps) {
  return (
    <div className={cn('relative flex-shrink-0', className)}>
      <Search
        style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: '#94a3b8', pointerEvents: 'none', flexShrink: 0 }}
      />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          height: 36, width: '100%',
          paddingLeft: 34, paddingRight: 12,
          border: '1.5px solid #e2e8f0', borderRadius: 10,
          fontSize: 13, color: '#0f172a', background: 'white',
          outline: 'none', boxSizing: 'border-box',
          fontFamily: 'inherit',
        }}
        onFocus={e => e.target.style.borderColor = '#2563eb'}
        onBlur={e => e.target.style.borderColor = '#e2e8f0'}
      />
    </div>
  )
}

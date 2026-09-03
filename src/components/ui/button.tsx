import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  icon?: LucideIcon
  iconRight?: LucideIcon
  loading?: boolean
  fullWidth?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconRight: IconRight,
  loading,
  fullWidth,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const base = [
    'inline-flex items-center justify-center gap-2 font-semibold rounded-xl',
    'transition-all duration-150 focus-visible:outline-none focus-visible:ring-2',
    'focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none select-none',
    'whitespace-nowrap shrink-0',
  ].join(' ')

  const variants = {
    primary:  'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-sm hover:shadow-md focus-visible:ring-blue-500',
    secondary:'bg-slate-100 text-slate-700 hover:bg-slate-200 active:bg-slate-300 focus-visible:ring-slate-400',
    ghost:    'bg-transparent text-slate-600 hover:bg-slate-100 active:bg-slate-200 focus-visible:ring-slate-400',
    danger:   'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-sm hover:shadow-md focus-visible:ring-rose-500',
    success:  'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 shadow-sm hover:shadow-md focus-visible:ring-emerald-500',
    outline:  'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 active:bg-slate-100 focus-visible:ring-slate-400',
  }

  const sizes = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base',
  }

  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'

  return (
    <button
      className={cn(base, variants[variant], sizes[size], fullWidth && 'w-full', className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className={cn('animate-spin shrink-0', iconSize)} viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : Icon ? (
        <Icon className={cn('shrink-0', iconSize)} />
      ) : null}
      {children && <span>{children}</span>}
      {!loading && IconRight && <IconRight className={cn('shrink-0', iconSize)} />}
    </button>
  )
}

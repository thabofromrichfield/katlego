import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'navy'
  dot?: boolean
}

export function Badge({ children, className, variant = 'default', dot }: BadgeProps) {
  const variants = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-sky-50 text-sky-700 border-sky-200',
    purple: 'bg-violet-50 text-violet-700 border-violet-200',
    navy: 'bg-slate-800 text-white border-slate-700',
  }

  const dotColors = {
    default: 'bg-slate-400',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    info: 'bg-sky-500',
    purple: 'bg-violet-500',
    navy: 'bg-white',
  }

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border tracking-wide',
      variants[variant],
      className
    )}>
      {dot && (
        <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse', dotColors[variant])} />
      )}
      {children}
    </span>
  )
}

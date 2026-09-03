import { cn } from '@/lib/utils'
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  iconColor?: string
  iconBg?: string
  trend?: { value: number; label: string }
  accent?: string
  className?: string
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-blue-600',
  iconBg = 'bg-blue-50',
  trend,
  accent,
  className,
}: StatCardProps) {
  const isPositive = (trend?.value ?? 0) >= 0

  return (
    <div className={cn(
      'relative bg-white rounded-2xl border border-slate-100 shadow-sm p-5 overflow-hidden group hover:shadow-md transition-all duration-200',
      className
    )}>
      {/* Subtle accent top bar */}
      {accent && (
        <div className={cn('absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl', accent)} />
      )}

      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
          <p className="mt-2 text-3xl font-extrabold text-slate-900 tabular-nums leading-none">{value}</p>
          {subtitle && (
            <p className="mt-1.5 text-xs text-slate-500">{subtitle}</p>
          )}
          {trend && (
            <div className="mt-2 flex items-center gap-1">
              {isPositive
                ? <TrendingUp className="h-3 w-3 text-emerald-600" />
                : <TrendingDown className="h-3 w-3 text-rose-600" />
              }
              <span className={cn('text-xs font-semibold', isPositive ? 'text-emerald-600' : 'text-rose-600')}>
                {isPositive ? '+' : ''}{trend.value}%
              </span>
              <span className="text-xs text-slate-400">{trend.label}</span>
            </div>
          )}
        </div>
        <div className={cn('p-3 rounded-xl shrink-0 ml-3 transition-transform duration-200 group-hover:scale-110', iconBg)}>
          <Icon className={cn('h-5 w-5', iconColor)} />
        </div>
      </div>
    </div>
  )
}

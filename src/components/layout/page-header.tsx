import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  className?: string
  badge?: React.ReactNode
}

export function PageHeader({ title, subtitle, actions, className, badge }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8', className)}>
      <div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">{title}</h1>
          {badge && badge}
        </div>
        {subtitle && <p className="mt-1 text-sm text-slate-500 font-medium">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap shrink-0">{actions}</div>}
    </div>
  )
}

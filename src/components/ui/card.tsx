import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  style?: React.CSSProperties
}

export function Card({ children, className, hover, style }: CardProps) {
  return (
    <div
      className={cn('bg-white rounded-2xl border border-slate-100 shadow-sm', hover && 'transition-all duration-200 hover:shadow-md', className)}
      style={style}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('px-6 py-5 border-b border-slate-100', className)}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={cn('text-base font-bold text-slate-900 tracking-tight', className)}>
      {children}
    </h3>
  )
}

export function CardDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn('text-sm text-slate-500 mt-0.5', className)}>
      {children}
    </p>
  )
}

export function CardContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('px-6 py-5', className)}>{children}</div>
}

export function CardFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('px-6 py-4 bg-slate-50 rounded-b-2xl border-t border-slate-100', className)}>
      {children}
    </div>
  )
}

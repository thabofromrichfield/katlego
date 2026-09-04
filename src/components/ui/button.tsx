'use client'

import { LucideIcon } from 'lucide-react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  icon?: LucideIcon
  iconRight?: LucideIcon
  loading?: boolean
  fullWidth?: boolean
}

const VARIANTS: Record<string, { bg: string; hoverBg: string; color: string; border?: string; shadow?: string }> = {
  primary:   { bg: '#2563eb', hoverBg: '#1d4ed8', color: '#ffffff', shadow: '0 4px 14px rgba(37,99,235,0.28)' },
  secondary: { bg: '#f1f5f9', hoverBg: '#e2e8f0', color: '#334155' },
  ghost:     { bg: 'transparent', hoverBg: '#f1f5f9', color: '#475569' },
  danger:    { bg: '#e11d48', hoverBg: '#be123c', color: '#ffffff', shadow: '0 4px 14px rgba(225,29,72,0.28)' },
  success:   { bg: '#059669', hoverBg: '#047857', color: '#ffffff', shadow: '0 4px 14px rgba(5,150,105,0.28)' },
  outline:   { bg: '#ffffff', hoverBg: '#f8fafc', color: '#334155', border: '1.5px solid #e2e8f0' },
}

const SIZES: Record<string, { h: number; px: number; fs: number; radius: number; gap: number; icon: number }> = {
  sm: { h: 32, px: 12, fs: 12, radius: 10, gap: 6,  icon: 14 },
  md: { h: 40, px: 16, fs: 14, radius: 12, gap: 8,  icon: 16 },
  lg: { h: 48, px: 24, fs: 16, radius: 12, gap: 8,  icon: 20 },
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
  style,
  ...props
}: ButtonProps) {
  const v = VARIANTS[variant] ?? VARIANTS.primary
  const s = SIZES[size] ?? SIZES.md
  const isDisabled = disabled || loading

  return (
    <button
      className={className}
      disabled={isDisabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: s.gap,
        height: s.h,
        padding: `0 ${s.px}px`,
        borderRadius: s.radius,
        fontSize: s.fs,
        fontWeight: 600,
        fontFamily: 'inherit',
        lineHeight: 1,
        whiteSpace: 'nowrap',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.55 : 1,
        // fullWidth must never combine with a forced flex-shrink — that is what
        // caused the Cancel/Save footer to overflow and scroll horizontally.
        width: fullWidth ? '100%' : 'auto',
        minWidth: fullWidth ? 0 : undefined,
        flexShrink: fullWidth ? 1 : 0,
        boxSizing: 'border-box',
        background: v.bg,
        color: v.color,
        border: v.border ?? 'none',
        boxShadow: v.shadow ?? 'none',
        transition: 'background 0.15s, box-shadow 0.15s, opacity 0.15s',
        ...style,
      }}
      onMouseEnter={e => { if (!isDisabled) (e.currentTarget as HTMLElement).style.background = v.hoverBg }}
      onMouseLeave={e => { if (!isDisabled) (e.currentTarget as HTMLElement).style.background = v.bg }}
      {...props}
    >
      {loading ? (
        <svg style={{ width: s.icon, height: s.icon, flexShrink: 0, animation: 'spin 0.75s linear infinite' }} viewBox="0 0 24 24" fill="none">
          <circle opacity=".25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path opacity=".75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : Icon ? (
        <Icon style={{ width: s.icon, height: s.icon, flexShrink: 0 }} />
      ) : null}
      {children && <span>{children}</span>}
      {!loading && IconRight && <IconRight style={{ width: s.icon, height: s.icon, flexShrink: 0 }} />}
    </button>
  )
}

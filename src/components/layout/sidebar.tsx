'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Car, Users, Bell, Settings,
  LogOut, BarChart3, Menu, X, ChevronRight, Truck, Shield, MapPin,
} from 'lucide-react'
import { generateInitials } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import type { Profile } from '@/types/database'

interface SidebarProps { profile: Profile; unreadCount?: number }

// Admin: no trip management — only fleet, drivers, reports, user roles
const adminNavItems = [
  { href: '/admin',          label: 'Dashboard',    icon: LayoutDashboard, exact: true },
  { href: '/admin/vehicles', label: 'Fleet',        icon: Car },
  { href: '/admin/drivers',  label: 'All Drivers',  icon: Users },
  { href: '/admin/reports',  label: 'Reports',      icon: BarChart3 },
  { href: '/admin/users',    label: 'User Roles',   icon: Shield },
]

// Manager sees only their team — no trips tab, no user management
const managerNavItems = [
  { href: '/admin',          label: 'Team Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/vehicles', label: 'Team Fleet',     icon: Car },
  { href: '/admin/drivers',  label: 'My Drivers',     icon: Users },
  { href: '/admin/reports',  label: 'Team Reports',   icon: BarChart3 },
]

const userNavItems = [
  { href: '/dashboard',               label: 'Dashboard',     icon: LayoutDashboard, exact: true },
  { href: '/dashboard/book',          label: 'Book a Trip',   icon: Truck },
  { href: '/dashboard/trips',         label: 'My Trips',      icon: Car },
  { href: '/dashboard/notifications', label: 'Notifications', icon: Bell },
]

const ROLE_THEME = {
  admin:   { bg: 'linear-gradient(to bottom,#0f172a,#1e293b)', accent: '#3b82f6', ring: '#60a5fa', badgeBg: 'rgba(59,130,246,0.2)', badgeColor: '#93c5fd', badgeBorder: 'rgba(59,130,246,0.3)', label: '⚡ Admin Panel' },
  manager: { bg: 'linear-gradient(to bottom,#0f172a,#1e293b)', accent: '#8b5cf6', ring: '#a78bfa', badgeBg: 'rgba(139,92,246,0.2)', badgeColor: '#c4b5fd', badgeBorder: 'rgba(139,92,246,0.3)', label: '📊 Manager Panel' },
  driver:  { bg: 'linear-gradient(to bottom,#064e3b,#0f172a)', accent: '#10b981', ring: '#34d399', badgeBg: 'rgba(16,185,129,0.2)', badgeColor: '#6ee7b7', badgeBorder: 'rgba(16,185,129,0.3)', label: '🚗 Driver Panel' },
  user:    { bg: 'linear-gradient(to bottom,#1e3a5f,#0f172a)', accent: '#3b82f6', ring: '#60a5fa', badgeBg: 'rgba(59,130,246,0.2)', badgeColor: '#93c5fd', badgeBorder: 'rgba(59,130,246,0.3)', label: '👤 User Panel' },
}

export function Sidebar({ profile, unreadCount = 0 }: SidebarProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const role = profile.role as keyof typeof ROLE_THEME
  const theme = ROLE_THEME[role] ?? ROLE_THEME.user
  const isAdmin   = role === 'admin'
  const isManager = role === 'manager'
  const navItems  = isAdmin ? adminNavItems : isManager ? managerNavItems : userNavItems
  const settingsHref = (isAdmin || isManager) ? '/admin/settings' : '/dashboard/settings'

  const handleSignOut = async () => {
    await createClient().auth.signOut()
    window.location.href = '/login'
  }

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + '/')

  const SidebarContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: theme.bg }}>

      {/* Logo */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, background: theme.accent, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 4px 16px ${theme.accent}50` }}>
            <Truck style={{ width: 20, height: 20, color: 'white' }} />
          </div>
          <div>
            <p style={{ fontWeight: 800, color: 'white', fontSize: 16, lineHeight: 1.1, letterSpacing: '-0.3px' }}>Katlego</p>
            <p style={{ fontWeight: 600, color: 'rgba(255,255,255,0.35)', fontSize: 10, letterSpacing: 2.5, textTransform: 'uppercase', marginTop: 2 }}>Logistics</p>
          </div>
        </div>
      </div>

      {/* Role badge */}
      <div style={{ padding: '12px 16px 4px' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '5px 12px', borderRadius: 99, fontSize: 11, fontWeight: 700, letterSpacing: '0.02em', background: theme.badgeBg, color: theme.badgeColor, border: `1px solid ${theme.badgeBorder}` }}>
          {theme.label}
        </span>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '8px 10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {navItems.map((item) => {
          const active = isActive(item.href, item.exact)
          const hasNotif = item.href.includes('notifications') && unreadCount > 0
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', borderRadius: 12,
                fontSize: 14, fontWeight: active ? 700 : 500,
                color: active ? 'white' : 'rgba(255,255,255,0.55)',
                background: active ? `${theme.accent}30` : 'transparent',
                textDecoration: 'none', transition: 'all 0.15s',
                borderLeft: active ? `3px solid ${theme.accent}` : '3px solid transparent',
              }}
            >
              <item.icon style={{ width: 18, height: 18, flexShrink: 0, color: active ? theme.accent : 'rgba(255,255,255,0.45)' }} />
              <span style={{ flex: 1, lineHeight: 1 }}>{item.label}</span>
              {hasNotif && (
                <span style={{ background: '#ef4444', color: 'white', fontSize: 10, fontWeight: 700, borderRadius: 99, height: 18, minWidth: 18, padding: '0 4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
              {active && <ChevronRight style={{ width: 14, height: 14, color: 'rgba(255,255,255,0.3)' }} />}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div style={{ padding: '8px 10px 12px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Link
          href={settingsHref}
          onClick={() => setMobileOpen(false)}
          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 12, fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.55)', textDecoration: 'none', borderLeft: '3px solid transparent' }}
        >
          <Settings style={{ width: 18, height: 18, flexShrink: 0, color: 'rgba(255,255,255,0.4)' }} />
          <span>Settings</span>
        </Link>

        {/* Profile chip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', margin: '4px 0 2px' }}>
          <div style={{ width: 34, height: 34, background: theme.accent, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 12, fontWeight: 800, flexShrink: 0, boxShadow: `0 0 0 2px ${theme.ring}50` }}>
            {generateInitials(profile.full_name)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>{profile.full_name}</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textTransform: 'capitalize', marginTop: 1 }}>{role}</p>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 12, fontSize: 14, fontWeight: 500, color: '#fca5a5', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
        >
          <LogOut style={{ width: 18, height: 18, flexShrink: 0 }} />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile hamburger */}
      <button
        style={{ position: 'fixed', top: 16, left: 16, zIndex: 50, padding: 10, background: '#0f172a', color: 'white', borderRadius: 12, border: 'none', cursor: 'pointer' }}
        className="lg-mobile-btn"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X style={{ width: 20, height: 20 }} /> : <Menu style={{ width: 20, height: 20 }} />}
      </button>

      {mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 40, backdropFilter: 'blur(4px)' }} onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile drawer */}
      <aside style={{ position: 'fixed', top: 0, bottom: 0, left: 0, zIndex: 40, width: 256, transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)', transition: 'transform 0.25s ease' }} className="lg-mobile-drawer">
        <SidebarContent />
      </aside>

      {/* Desktop sidebar */}
      <aside style={{ width: 256, flexShrink: 0, height: '100vh', position: 'sticky', top: 0 }} className="lg-desktop-sidebar">
        <SidebarContent />
      </aside>

      <style>{`
        .lg-mobile-btn { display: none; }
        .lg-mobile-drawer { display: none; }
        @media (max-width: 1023px) {
          .lg-mobile-btn { display: flex !important; }
          .lg-mobile-drawer { display: block !important; }
          .lg-desktop-sidebar { display: none !important; }
        }
      `}</style>
    </>
  )
}

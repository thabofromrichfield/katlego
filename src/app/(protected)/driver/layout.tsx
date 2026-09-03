'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { LayoutDashboard, ClipboardList, Bell, Settings, LogOut, Truck, Menu, X, ChevronRight } from 'lucide-react'
import { generateInitials } from '@/lib/utils'
import type { Profile } from '@/types/database'

const navItems = [
  { href: '/driver',               label: 'Dashboard',     icon: LayoutDashboard, exact: true },
  { href: '/driver/trips',         label: 'My Trips',      icon: ClipboardList },
  { href: '/driver/notifications', label: 'Notifications', icon: Bell },
  { href: '/driver/settings',      label: 'Settings',      icon: Settings },
]

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const init = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { window.location.href = '/login'; return }

        const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        if (!prof || !['driver', 'admin', 'manager'].includes(prof.role)) { window.location.href = '/dashboard'; return }

        setProfile(prof)

        const { count } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_read', false)
        setUnreadCount(count ?? 0)
      } catch {
        window.location.href = '/login'
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [pathname])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : (pathname === href || pathname.startsWith(href + '/'))

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f8fafc' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 44, height: 44, border: '3px solid #059669', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.75s linear infinite', margin: '0 auto 14px' }} />
          <p style={{ color: '#64748b', fontSize: 14, fontWeight: 500 }}>Loading…</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      </div>
    )
  }

  if (!profile) return null

  const SidebarContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'linear-gradient(to bottom, #064e3b, #0f172a)' }}>
      {/* Logo */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, background: '#059669', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 16px rgba(5,150,105,0.4)' }}>
            <Truck style={{ width: 20, height: 20, color: 'white' }} />
          </div>
          <div>
            <p style={{ fontWeight: 800, color: 'white', fontSize: 16, lineHeight: 1.1 }}>Katlego</p>
            <p style={{ fontWeight: 600, color: 'rgba(255,255,255,0.4)', fontSize: 10, letterSpacing: 2.5, textTransform: 'uppercase', marginTop: 2 }}>Logistics</p>
          </div>
        </div>
      </div>

      {/* Badge */}
      <div style={{ padding: '12px 16px 8px' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 12px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: 'rgba(5,150,105,0.2)', color: '#6ee7b7', border: '1px solid rgba(5,150,105,0.3)' }}>
          🚗 Driver Panel
        </span>
      </div>

      {/* Nav */}
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
                color: active ? 'white' : 'rgba(255,255,255,0.6)',
                background: active ? 'rgba(255,255,255,0.15)' : 'transparent',
                textDecoration: 'none', transition: 'all 0.15s',
              }}
            >
              <item.icon style={{ width: 18, height: 18, flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {hasNotif && (
                <span style={{ background: '#ef4444', color: 'white', fontSize: 10, fontWeight: 700, borderRadius: 99, height: 20, minWidth: 20, padding: '0 4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
              {active && <ChevronRight style={{ width: 14, height: 14, color: 'rgba(255,255,255,0.3)' }} />}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div style={{ padding: '8px 10px 12px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Profile chip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', margin: '4px 0' }}>
          <div style={{ width: 34, height: 34, background: '#059669', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 13, fontWeight: 800, flexShrink: 0, boxShadow: '0 0 0 2px rgba(52,211,153,0.4)' }}>
            {generateInitials(profile.full_name)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.2 }}>{profile.full_name}</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Driver</p>
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
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f8fafc' }}>
      {/* Mobile hamburger */}
      <button
        style={{ position: 'fixed', top: 16, left: 16, zIndex: 50, padding: 10, background: '#064e3b', color: 'white', borderRadius: 12, border: 'none', cursor: 'pointer', display: 'none' }}
        className="mobile-menu-btn"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X style={{ width: 20, height: 20 }} /> : <Menu style={{ width: 20, height: 20 }} />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 40, backdropFilter: 'blur(4px)' }} onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile drawer */}
      <aside style={{ position: 'fixed', top: 0, bottom: 0, left: 0, zIndex: 40, width: 256, transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)', transition: 'transform 0.3s ease' }} className="lg-hidden-drawer">
        <SidebarContent />
      </aside>

      {/* Desktop sidebar */}
      <aside style={{ width: 256, flexShrink: 0, height: '100vh', position: 'sticky', top: 0, display: 'flex', flexDirection: 'column' }} className="desktop-sidebar">
        <SidebarContent />
      </aside>

      <main style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>
        <div style={{ width: '100%', maxWidth: 1024, margin: '0 auto', padding: '28px 24px' }}>
          {children}
        </div>
      </main>

      <style>{`
        @media (max-width: 1023px) {
          .desktop-sidebar { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
        @media (min-width: 1024px) {
          .lg-hidden-drawer { display: none !important; }
        }
      `}</style>
    </div>
  )
}

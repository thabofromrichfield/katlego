'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Sidebar } from '@/components/layout/sidebar'
import type { Profile } from '@/types/database'

function getRoleDestination(role: string): string {
  if (role === 'admin' || role === 'manager') return '/admin'
  if (role === 'driver') return '/driver'
  return '/dashboard'
}

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const isDriverRoute = pathname.startsWith('/driver')

  useEffect(() => {
    const init = async () => {
      try {
        const supabase = createClient()
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) { window.location.href = '/login'; return }

        let role = 'user'
        const { data: rpcRole } = await supabase.rpc('get_my_role')
        if (rpcRole) {
          role = rpcRole
        } else {
          const { data: profileData } = await supabase.from('profiles').select('role').eq('id', user.id).single()
          role = profileData?.role ?? user.user_metadata?.role ?? 'user'
        }

        const onAdmin     = pathname.startsWith('/admin')
        const onDashboard = pathname.startsWith('/dashboard')

        if (onAdmin && !['admin', 'manager'].includes(role)) { window.location.href = getRoleDestination(role); return }
        if (onDashboard && role === 'driver') { window.location.href = '/driver'; return }

        if (isDriverRoute) { setLoading(false); return }

        const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        if (prof) {
          setProfile(prof)
        } else {
          await supabase.from('profiles').upsert({ id: user.id, full_name: user.user_metadata?.full_name ?? user.email ?? 'User', role }, { onConflict: 'id' })
          const { data: retryProf } = await supabase.from('profiles').select('*').eq('id', user.id).single()
          if (!retryProf) { window.location.href = '/login'; return }
          setProfile(retryProf)
        }

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

  if (isDriverRoute) return <>{children}</>

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f8fafc' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 44, height: 44, border: '3px solid #2563eb', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.75s linear infinite', margin: '0 auto 14px' }} />
          <p style={{ color: '#64748b', fontSize: 14, fontWeight: 500 }}>Loading…</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      </div>
    )
  }

  if (!profile) return null

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f8fafc' }}>
      <Sidebar profile={profile} unreadCount={unreadCount} />
      <main style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>
        <div style={{ width: '100%', maxWidth: 1280, margin: '0 auto', padding: '28px 24px' }}>
          {children}
        </div>
      </main>
    </div>
  )
}

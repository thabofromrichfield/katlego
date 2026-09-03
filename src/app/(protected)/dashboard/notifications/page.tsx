'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Bell, BellOff, CheckCheck } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  const load = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    setUserId(user.id)
    const { data } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    setNotifications(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    const supabase = createClient()
    const ch = supabase.channel('user-notifications').on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, load).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  const markRead = async (id: string) => {
    const supabase = createClient()
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n))
  }

  const markAllRead = async () => {
    if (!userId) return
    const supabase = createClient()
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false)
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    toast.success('All notifications marked as read')
  }

  const unread = notifications.filter((n) => !n.is_read)

  const TYPE_ICON: Record<string, string> = {
    trip_approved: '✅', trip_rejected: '❌', trip_assigned: '🚗',
    trip_started: '🟢', trip_completed: '🏁', trip_cancelled: '🚫', default: '🔔',
  }

  return (
    <div className="animate-fadeIn">
      <PageHeader
        title="Notifications"
        subtitle={unread.length > 0 ? `${unread.length} unread` : 'All caught up'}
        actions={
          unread.length > 0 && (
            <Button variant="outline" size="sm" icon={CheckCheck} onClick={markAllRead}>
              Mark all read
            </Button>
          )
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>All Notifications</CardTitle>
          <CardDescription>{notifications.length} total</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-16 skeleton" />)}</div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><BellOff className="h-7 w-7 text-slate-300" /></div>
              <p className="text-slate-400 font-semibold text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => !n.is_read && markRead(n.id)}
                  className={`w-full flex items-start gap-4 px-6 py-4 text-left transition-colors ${n.is_read ? 'hover:bg-slate-50/40' : 'bg-blue-50/50 hover:bg-blue-50'}`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-base ${n.is_read ? 'bg-slate-100' : 'bg-blue-100'}`}>
                    {TYPE_ICON[n.type] ?? TYPE_ICON.default}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold leading-snug ${n.is_read ? 'text-slate-600' : 'text-slate-900'}`}>{n.title}</p>
                    {n.message && <p className="text-xs text-slate-500 mt-0.5 leading-snug">{n.message}</p>}
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1.5">
                    <span className="text-[11px] text-slate-400">{formatRelativeTime(n.created_at)}</span>
                    {!n.is_read && <span className="w-2 h-2 bg-blue-500 rounded-full" />}
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

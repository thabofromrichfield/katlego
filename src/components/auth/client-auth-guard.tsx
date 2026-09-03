'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface ClientAuthGuardProps {
  children: React.ReactNode
  requiredRole?: 'admin' | 'manager' | 'any'
}

export function ClientAuthGuard({ children, requiredRole = 'any' }: ClientAuthGuardProps) {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    const check = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          router.replace('/login')
          return
        }

        if (requiredRole !== 'any') {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

          const role = profile?.role ?? 'user'
          const allowed = requiredRole === 'admin'
            ? role === 'admin'
            : ['admin', 'manager'].includes(role)

          if (!allowed) {
            router.replace('/dashboard')
            return
          }
        }

        setAuthorized(true)
      } catch {
        // Network issue - allow through, individual pages handle their own auth
        setAuthorized(true)
      } finally {
        setChecking(false)
      }
    }
    check()
  }, [router, requiredRole])

  if (checking) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!authorized) return null

  return <>{children}</>
}

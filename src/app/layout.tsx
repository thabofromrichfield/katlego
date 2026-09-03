import type { Metadata } from 'next'
import './globals.css'
import { ToastProvider } from '@/components/toast-provider'

export const metadata: Metadata = {
  title: 'Katlego Logistics',
  description: 'Logistics Management System - Fleet, Drivers, and Trip Management',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        {children}
        <ToastProvider />
      </body>
    </html>
  )
}

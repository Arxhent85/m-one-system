'use client'

import { useState } from 'react'
import AdminSidebar from './AdminSidebar'
import AdminHeader from './AdminHeader'
import type { Profile } from '@/lib/supabase/database.types'

interface AdminLayoutWrapperProps {
  profile: Profile | null
  children: React.ReactNode
}

export default function AdminLayoutWrapper({ profile, children }: AdminLayoutWrapperProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-dvh overflow-hidden bg-surface-950">
      {/* Desktop & Mobile Responsive Sidebar */}
      <AdminSidebar
        profile={profile}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminHeader
          profile={profile}
          onOpenMobileNav={() => setMobileOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-6">
          {children}
        </main>
      </div>
    </div>
  )
}

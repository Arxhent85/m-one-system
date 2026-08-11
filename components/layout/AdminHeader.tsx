'use client'

import { Bell, Search, Menu, Package } from 'lucide-react'
import type { Profile } from '@/lib/supabase/database.types'

interface AdminHeaderProps {
  profile: Profile | null
  onOpenMobileNav?: () => void
}

export default function AdminHeader({ profile: _profile, onOpenMobileNav }: AdminHeaderProps) {
  return (
    <header className="h-16 shrink-0 flex items-center gap-3 px-4 sm:px-6 border-b border-surface-700/50 bg-surface-900/50 backdrop-blur-sm">
      {/* Mobile Hamburger Button */}
      {onOpenMobileNav && (
        <button
          onClick={onOpenMobileNav}
          className="lg:hidden p-2 rounded-xl bg-surface-800 text-surface-200 hover:text-white active:scale-95 transition-all shrink-0"
          aria-label="Menü öffnen"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      {/* Mobile Logo Brand */}
      <div className="flex items-center gap-2 lg:hidden">
        <div className="w-7 h-7 rounded-lg bg-gradient-brand flex items-center justify-center shadow-glow">
          <Package className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="font-bold text-surface-50 text-sm">M ONE</span>
      </div>

      {/* Suche */}
      <div className="flex-1 max-w-md relative hidden sm:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500 pointer-events-none" />
        <input
          type="search"
          placeholder="Suchen… (Produkte, Kunden, Aufträge)"
          className="input pl-9 py-2 text-sm bg-surface-800/50 w-full"
        />
      </div>

      {/* Aktionen */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Benachrichtigungen */}
        <button className="btn-icon relative" aria-label="Benachrichtigungen">
          <Bell className="w-4 h-4 text-surface-400" />
          {/* Ungelesener Punkt */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-500 ring-2 ring-surface-900" />
        </button>
      </div>
    </header>
  )
}

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Package, Warehouse, Users, ShoppingCart,
  BarChart3, Settings, Truck, ArrowLeftRight, LogOut, ChevronRight,
  Coins,
} from 'lucide-react'
import { cn } from '@/lib/utils/helpers'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Profile } from '@/lib/supabase/database.types'

const navGroups = [
  {
    label: 'Überblick',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Lager',
    items: [
      { href: '/inventory',           label: 'Bestände',     icon: Warehouse },
      { href: '/inventory/transfers', label: 'Umlagerungen', icon: ArrowLeftRight },
      { href: '/products',            label: 'Produkte',     icon: Package },
    ],
  },
  {
    label: 'Vertrieb & Lohn',
    items: [
      { href: '/orders',    label: 'Aufträge', icon: ShoppingCart },
      { href: '/customers', label: 'Kunden',   icon: Users },
      { href: '/payroll',   label: 'Lohn',     icon: Coins },
    ],
  },
  {
    label: 'Auswertungen',
    items: [
      { href: '/analytics',           label: 'Übersicht',   icon: BarChart3 },
      { href: '/analytics/products',  label: 'Produkte',    icon: Package },
      { href: '/analytics/customers', label: 'Kunden',      icon: Users },
      { href: '/analytics/vehicles',  label: 'Fahrzeuge',   icon: Truck },
    ],
  },
]


import { X } from 'lucide-react'

interface AdminSidebarProps {
  profile: Profile | null
  mobileOpen?: boolean
  onClose?: () => void
}

export default function AdminSidebar({ profile, mobileOpen = false, onClose }: AdminSidebarProps) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const sidebarContent = (
    <aside className="w-64 shrink-0 flex flex-col h-full bg-surface-900 border-r border-surface-700/50">
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-surface-700/50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center shadow-glow">
            <Package className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-bold text-surface-50 text-sm">M ONE ERP</span>
            <p className="text-[10px] text-surface-500 leading-none">Warenwirtschaft</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-surface-400 hover:text-surface-100 hover:bg-surface-800"
            aria-label="Menü schließen"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 scroll-hidden">
        <div className="space-y-6">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="text-[10px] font-semibold text-surface-500 uppercase tracking-widest px-3 mb-2">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = pathname === item.href ||
                    (item.href !== '/dashboard' && pathname.startsWith(item.href))
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => onClose?.()}
                      className={cn('nav-item', isActive && 'nav-item-active')}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="flex-1">{item.label}</span>
                      {isActive && <ChevronRight className="w-3 h-3 text-brand-400" />}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      {/* Footer: Profil + Logout */}
      <div className="border-t border-surface-700/50 p-3 shrink-0">
        <Link
          href="/settings"
          onClick={() => onClose?.()}
          className={cn('nav-item mb-1', pathname === '/settings' && 'nav-item-active')}
        >
          <Settings className="w-4 h-4 shrink-0" />
          <span className="flex-1">Einstellungen</span>
        </Link>

        <div className="flex items-center gap-3 px-3 py-2.5 mt-1">
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center text-white text-xs font-bold shrink-0">
            {profile?.full_name?.charAt(0)?.toUpperCase() ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-surface-200 truncate">
              {profile?.full_name ?? 'Benutzer'}
            </p>
            <p className="text-xs text-surface-500 capitalize">{profile?.role ?? '—'}</p>
          </div>
          <button
            onClick={handleLogout}
            className="btn-icon text-surface-500 hover:text-danger-400 hover:bg-danger-900/30"
            aria-label="Abmelden"
            title="Abmelden"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )

  return (
    <>
      {/* Desktop Sidebar (always visible on lg and above) */}
      <div className="hidden lg:flex h-full">
        {sidebarContent}
      </div>

      {/* Mobile Drawer (visible on mobile only when mobileOpen is true) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
          />
          {/* Drawer Container */}
          <div className="relative z-10 w-72 max-w-[85vw] h-full shadow-2xl animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  )
}

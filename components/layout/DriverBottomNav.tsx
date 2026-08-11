'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ShoppingCart, Package, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils/helpers'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Profile } from '@/lib/supabase/database.types'

const navItems = [
  { href: '/driver/home',  label: 'Start',     icon: Home },
  { href: '/driver/sell',  label: 'Verkauf',   icon: ShoppingCart },
  { href: '/driver/stock', label: 'Bestand',   icon: Package },
]

interface DriverBottomNavProps {
  profile: Profile | null
}

export default function DriverBottomNav({ profile: _profile }: DriverBottomNavProps) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 pb-safe bg-surface-900/95 backdrop-blur-md border-t border-surface-700/50">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-1 px-4 py-2 rounded-xl min-w-[64px] transition-all duration-150',
                isActive
                  ? 'text-brand-400 bg-brand-900/40'
                  : 'text-surface-500 hover:text-surface-300 active:bg-surface-800/50'
              )}
            >
              <Icon className={cn('w-5 h-5 transition-transform', isActive && 'scale-110')} />
              <span className="text-[11px] font-medium leading-none">{label}</span>
            </Link>
          )
        })}

        {/* Abmelden */}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl min-w-[64px] text-surface-500 hover:text-danger-400 active:bg-danger-900/30 transition-all duration-150"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-[11px] font-medium leading-none">Abmelden</span>
        </button>
      </div>
    </nav>
  )
}

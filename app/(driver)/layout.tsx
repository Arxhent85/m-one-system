import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import DriverBottomNav from '@/components/layout/DriverBottomNav'

export default async function DriverLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const demoRole = cookieStore.get('m_one_demo_role')?.value

  let profile = {
    id: 'demo-driver-id',
    full_name: 'Fahrer Mensuri (Fahrzeug 1)',
    role: 'driver' as const,
    location_id: '22222222-2222-2222-2222-222222222222',
    phone: '+49 171 9876543',
    avatar_url: null,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  if (!demoRole) {
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: dbProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (dbProfile) {
          profile = dbProfile
        }
      }
    } catch (e) {
      // Fallback to demo driver for instant mobile testing
    }
  }

  return (
    <div className="flex flex-col h-dvh bg-surface-950 overflow-hidden">
      {/* Hauptinhalt mit reichlich Bottom-Padding für Nav & Action Buttons */}
      <main className="flex-1 overflow-y-auto pb-32 pt-safe">
        {children}
      </main>

      {/* Bottom Navigation für Fahrer-PWA */}
      <DriverBottomNav profile={profile} />
    </div>
  )
}

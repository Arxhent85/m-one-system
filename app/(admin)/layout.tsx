import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import AdminLayoutWrapper from '@/components/layout/AdminLayoutWrapper'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const demoRole = cookieStore.get('m_one_demo_role')?.value

  let profile = null

  if (demoRole === 'admin') {
    profile = {
      id: 'demo-admin-id',
      full_name: 'Max Mustermann (Admin)',
      role: 'admin' as const,
      location_id: 'loc-1',
      phone: '+49 170 1234567',
      avatar_url: null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  } else {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: dbProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
    const profileData = dbProfile as any
    if (profileData?.role === 'driver') redirect('/driver/home')
    profile = profileData
  }

  return <AdminLayoutWrapper profile={profile}>{children}</AdminLayoutWrapper>
}

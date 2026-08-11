import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

/**
 * Root-Seite: leitet standardmäßig direkt zum Admin-Dashboard weiter
 */
export default async function RootPage() {
  const cookieStore = await cookies()
  const demoRole = cookieStore.get('m_one_demo_role')?.value

  if (demoRole === 'driver') {
    redirect('/driver/sell')
  }

  redirect('/dashboard')
}

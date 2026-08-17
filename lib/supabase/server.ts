import { createServerClient, type CookieMethodsServer } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { type Database } from './database.types'

const DEFAULT_URL = 'https://yqfrwdytpjxkzkskkvyk.supabase.co'
const DEFAULT_KEY = 'sb_publishable_xrshRnwuZaw1YhGze9meUQ_mHOm5Pcn'

/**
 * Supabase Server-Client für Server Components, Server Actions und Route Handlers.
 * Muss in jedem Request neu erstellt werden (Next.js cookies() ist request-scoped).
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component — Cookies können nicht gesetzt werden, das ist OK
          }
        },
      },
    }
  )
}

/**
 * Supabase Service-Role-Client für privilegierte Operationen.
 * NUR auf dem Server verwenden, niemals an den Client senden!
 */
export function createServiceClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_KEY,
    {
      cookies: {
        getAll() { return [] },
        setAll() {},
      },
    }
  )
}


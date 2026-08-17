import { createBrowserClient } from '@supabase/ssr'
import { type Database } from './database.types'

const DEFAULT_URL = 'https://yqfrwdytpjxkzkskkvyk.supabase.co'
const DEFAULT_KEY = 'sb_publishable_xrshRnwuZaw1YhGze9meUQ_mHOm5Pcn'


/**
 * Supabase Browser-Client für Client-Komponenten und Client-side Abfragen.
 * Singleton-Pattern: wird nur einmal erstellt.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_KEY
  )
}


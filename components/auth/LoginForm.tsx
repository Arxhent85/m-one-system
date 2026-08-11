'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Loader2, LogIn, Warehouse, Truck, ArrowRight } from 'lucide-react'

export default function LoginForm() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        setError(
          error.message === 'Invalid login credentials'
            ? 'E-Mail oder Passwort ist falsch'
            : error.message
        )
        return
      }

      // Fetch user profile to determine role
      const { data: { user: authUser } } = await supabase.auth.getUser()
      let role = 'admin'
      if (authUser) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', authUser.id)
          .single()
        if ((profile as any)?.role) role = (profile as any).role
      }
      
      document.cookie = `m_one_demo_role=${role}; path=/; max-age=86400`
      
      if (role === 'driver') {
        router.push('/driver/sell')
      } else {
        router.push('/dashboard')
      }
      router.refresh()
    } catch {
      setError('Ein Fehler ist aufgetreten')
    } finally {
      setLoading(false)
    }
  }

  function handleModeSelect(mode: 'admin' | 'mensuri' | 'qerimi') {
    if (mode === 'admin') {
      document.cookie = 'm_one_demo_role=admin; path=/; max-age=86400'
      router.push('/dashboard')
    } else if (mode === 'mensuri') {
      document.cookie = 'm_one_demo_role=driver; path=/; max-age=86400'
      router.push('/driver/sell?driver=mensuri')
    } else if (mode === 'qerimi') {
      document.cookie = 'm_one_demo_role=driver; path=/; max-age=86400'
      router.push('/driver/sell?driver=qerimi')
    }
    router.refresh()
  }

  return (
    <div className="space-y-5">
      {/* 3 Portal Modus Optionen */}
      <div className="space-y-2.5">
        <label className="text-[11px] font-bold text-surface-300 uppercase tracking-widest block text-center mb-2">
          Wohin möchtest du wechseln?
        </label>

        {/* 1. Hauptlager & Büro Dashboard */}
        <button
          type="button"
          onClick={() => handleModeSelect('admin')}
          className="w-full p-3.5 rounded-xl border border-brand-500/40 bg-gradient-to-r from-brand-950/80 via-surface-900 to-surface-900 hover:border-brand-400 hover:shadow-glow transition-all text-left flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-brand-800/60 text-brand-400 border border-brand-500/30 flex items-center justify-center shrink-0">
              <Warehouse className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-surface-50 text-sm">
                Büro & Hauptlager Dashboard
              </p>
              <p className="text-xs text-surface-400">Verwaltung, Produkte & Bestände</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-brand-400 group-hover:translate-x-1 transition-transform shrink-0" />
        </button>

        {/* 2. Fahrer Mensuri (Fahrzeug 1) */}
        <button
          type="button"
          onClick={() => handleModeSelect('mensuri')}
          className="w-full p-3.5 rounded-xl border border-emerald-500/40 bg-gradient-to-r from-emerald-950/80 via-surface-900 to-surface-900 hover:border-emerald-400 hover:shadow-glow transition-all text-left flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-800/60 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-surface-50 text-sm flex items-center gap-2">
                Fahrzeug 1 — Depo Mensuri
                <span className="text-[10px] font-mono font-normal bg-emerald-900/60 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-700/50">2xxxx</span>
              </p>
              <p className="text-xs text-surface-400">Mensuri POS Kasse (Nur Kundennummern 2xxxx)</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition-transform shrink-0" />
        </button>

        {/* 3. Fahrer Qerimi (Fahrzeug 2) */}
        <button
          type="button"
          onClick={() => handleModeSelect('qerimi')}
          className="w-full p-3.5 rounded-xl border border-cyan-500/40 bg-gradient-to-r from-cyan-950/80 via-surface-900 to-surface-900 hover:border-cyan-400 hover:shadow-glow transition-all text-left flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-800/60 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-surface-50 text-sm flex items-center gap-2">
                Fahrzeug 2 — Depo Qerimi
                <span className="text-[10px] font-mono font-normal bg-cyan-900/60 text-cyan-300 px-1.5 py-0.2 rounded border border-cyan-700/50">1xxxx</span>
              </p>
              <p className="text-xs text-surface-400">Qerimi POS Kasse (Nur Kundennummern 1xxxx)</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-1 transition-transform shrink-0" />
        </button>
      </div>

      {/* Trennlinie */}
      <div className="relative flex items-center justify-center pt-1">
        <div className="border-t border-surface-700/50 w-full" />
        <span className="bg-surface-900 px-3 text-[10px] text-surface-500 font-medium uppercase tracking-wider relative shrink-0">
          Oder Passwort Login
        </span>
      </div>

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label htmlFor="email" className="label text-xs">E-Mail</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input py-2 text-xs"
            placeholder="name@unternehmen.de"
            autoComplete="email"
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="password" className="label text-xs">Passwort</label>
          <div className="relative">
            <input
              id="password"
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input pr-10 py-2 text-xs"
              placeholder="••••••••"
              autoComplete="current-password"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-200"
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-2.5 rounded-lg bg-danger-900/40 border border-danger-500/30 text-danger-400 text-xs">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="btn-secondary w-full py-2 text-xs font-semibold"
          disabled={loading || !email || !password}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : <LogIn className="w-4 h-4 mx-auto" />}
        </button>
      </form>
    </div>
  )
}

import type { Metadata } from 'next'
import { Settings, Info } from 'lucide-react'
import SettingsResetClient from './SettingsResetClient'

export const metadata: Metadata = { title: 'Einstellungen | M ONE ERP' }

export default function SettingsPage() {
  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-2xl font-bold text-surface-50 flex items-center gap-2">
          <Settings className="w-6 h-6 text-brand-400" />
          Einstellungen
        </h1>
        <p className="text-surface-400 text-sm mt-1">System- und Benutzereinstellungen</p>
      </div>

      <div className="glass-card p-6">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-brand-400 shrink-0 mt-0.5" />
          <div>
            <h2 className="font-semibold text-surface-100 mb-1">M ONE ERP System</h2>
            <p className="text-surface-400 text-sm">
              Supabase Projekt: <span className="text-brand-400 font-mono text-xs">yqfrwdytpjxkzkskkvyk</span>
            </p>
            <p className="text-surface-400 text-sm mt-1">
              Standorte: Hauptlager Depot (M-ONE), Fahrzeug 1 (Mensuri), Fahrzeug 2 (Qerimi)
            </p>
          </div>
        </div>
      </div>

      {/* Client-seitiger Reset-Bereich */}
      <SettingsResetClient />
    </div>
  )
}

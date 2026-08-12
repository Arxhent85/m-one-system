'use client'

import { useState } from 'react'
import { RotateCcw, Trash2, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react'
import { resetStockToInitial } from '@/lib/stockStore'

import MOCK_2026_SALES from '@/lib/mock2026Sales.json'

export default function SettingsResetClient() {
  const [salesCleared, setSalesCleared] = useState(false)
  const [stockReset, setStockReset] = useState(false)
  const [demoLoaded, setDemoLoaded] = useState(false)
  const [confirmStock, setConfirmStock] = useState(false)

  async function loadDemo2026() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('m_one_sales_cleared')
      localStorage.setItem('m_one_sales_history_v1', JSON.stringify(MOCK_2026_SALES))
    }
    try {
      await fetch('/api/sales/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'load_2026_demo' }),
      })
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('m_one_stock_changed'))
        window.dispatchEvent(new Event('m_one_sale_recorded'))
      }
      setDemoLoaded(true)
      setTimeout(() => setDemoLoaded(false), 3000)
    } catch (e) {
      console.warn('Demo load error:', e)
    }
  }

  async function clearSalesOnly() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('m_one_sales_cleared', 'true')
      localStorage.setItem('m_one_sales_history_v1', '[]')
      localStorage.removeItem('m_one_transfers_history_v3')
      window.dispatchEvent(new Event('m_one_stock_changed'))
      window.dispatchEvent(new Event('m_one_sale_recorded'))
    }
    try {
      await fetch('/api/sales/record', { method: 'DELETE' })
    } catch (e) {
      console.warn('Reset server API error:', e)
    }
    setSalesCleared(true)
    setTimeout(() => setSalesCleared(false), 3000)
  }

  async function resetAll() {
    resetStockToInitial()
    if (typeof window !== 'undefined') {
      localStorage.setItem('m_one_sales_cleared', 'true')
      localStorage.setItem('m_one_sales_history_v1', '[]')
      localStorage.removeItem('m_one_transfers_history_v3')
      window.dispatchEvent(new Event('m_one_stock_changed'))
      window.dispatchEvent(new Event('m_one_sale_recorded'))
    }
    try {
      await fetch('/api/sales/record', { method: 'DELETE' })
    } catch (e) {
      console.warn('Reset server API error:', e)
    }
    setStockReset(true)
    setConfirmStock(false)
    setTimeout(() => setStockReset(false), 3000)
  }

  return (
    <div className="space-y-4">

      {/* 2026 Echtdaten importieren */}
      <div className="glass-card p-5 border border-emerald-500/30 bg-emerald-950/10">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-900/40 border border-emerald-700/40 flex items-center justify-center shrink-0">
              <RefreshCw className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-semibold text-surface-100">2026 Echtdaten importieren</h3>
              <p className="text-surface-400 text-sm mt-0.5">
                Lädt alle 253 Verkaufs-Fakturen aus dem ersten Halbjahr 2026 in das System.<br />
                <span className="text-emerald-400 text-xs font-semibold">253 Fakturen · 26.541,80 € Gesamtvolumen 2026</span>
              </p>
            </div>
          </div>
          <button
            onClick={loadDemo2026}
            className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-900/40 border border-emerald-700/60 text-emerald-300 text-sm font-semibold hover:bg-emerald-900/70 transition-colors"
          >
            {demoLoaded ? (
              <><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Geladen!</>
            ) : (
              <><RefreshCw className="w-4 h-4" /> 2026 Daten laden</>
            )}
          </button>
        </div>
      </div>

      {/* Nur Verkaufshistorie löschen */}
      <div className="glass-card p-5 border border-surface-700/50">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-900/40 border border-amber-700/40 flex items-center justify-center shrink-0">
              <Trash2 className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h3 className="font-semibold text-surface-100">Verkaufshistorie löschen</h3>
              <p className="text-surface-400 text-sm mt-0.5">
                Löscht alle erfassten Verkäufe und Umlagerungen aus dem Speicher.<br />
                <span className="text-surface-500 text-xs">Lagerbestände bleiben unverändert.</span>
              </p>
            </div>
          </div>
          <button
            onClick={clearSalesOnly}
            className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-900/40 border border-amber-700/60 text-amber-300 text-sm font-semibold hover:bg-amber-900/70 transition-colors"
          >
            {salesCleared ? (
              <><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Gelöscht!</>
            ) : (
              <><Trash2 className="w-4 h-4" /> Verlauf löschen</>
            )}
          </button>
        </div>
      </div>

      {/* Kompletter Lager-Reset auf Excel-Ausgangswerte */}
      <div className="glass-card p-5 border border-danger-800/50">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-danger-900/40 border border-danger-700/40 flex items-center justify-center shrink-0">
              <RotateCcw className="w-4 h-4 text-danger-400" />
            </div>
            <div>
              <h3 className="font-semibold text-danger-300">Vollständiger System-Reset</h3>
              <p className="text-surface-400 text-sm mt-0.5">
                Setzt alle Lagerbestände auf die ursprünglichen Excel-Werte zurück.<br />
                <span className="text-danger-500 text-xs font-semibold">⚠ Alle Verkäufe und Umlagerungen werden gelöscht!</span>
              </p>
            </div>
          </div>
          {!confirmStock ? (
            <button
              onClick={() => setConfirmStock(true)}
              className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg bg-danger-900/40 border border-danger-700/60 text-danger-300 text-sm font-semibold hover:bg-danger-900/70 transition-colors"
            >
              <RotateCcw className="w-4 h-4" /> Zurücksetzen
            </button>
          ) : (
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-danger-400 font-semibold">Sicher?</span>
              <button
                onClick={resetAll}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-danger-700 border border-danger-500 text-white text-sm font-bold hover:bg-danger-600 transition-colors"
              >
                {stockReset ? (
                  <><CheckCircle2 className="w-4 h-4" /> Zurückgesetzt!</>
                ) : (
                  <><RefreshCw className="w-4 h-4" /> Ja, jetzt!</>
                )}
              </button>
              <button
                onClick={() => setConfirmStock(false)}
                className="px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-surface-300 text-sm hover:bg-surface-700 transition-colors"
              >
                Abbruch
              </button>
            </div>
          )}
        </div>

        {stockReset && (
          <div className="mt-3 flex items-center gap-2 text-sm text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            Alle Bestände erfolgreich auf Excel-Ausgangswerte zurückgesetzt.
          </div>
        )}
      </div>

    </div>
  )
}

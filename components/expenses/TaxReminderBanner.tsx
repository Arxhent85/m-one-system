'use client'

import { useState } from 'react'
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  ExternalLink,
  HelpCircle,
  Landmark,
  Plus,
  Receipt,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils/currency'
import type { TaxReminder } from '@/lib/expenseStore'

interface TaxReminderBannerProps {
  taxReminder: TaxReminder
  onBookTax: (taxReminder: TaxReminder) => void
}

export default function TaxReminderBanner({ taxReminder, onBookTax }: TaxReminderBannerProps) {
  const [showDetails, setShowDetails] = useState(false)

  const isDueOrOverdue = taxReminder.status === 'due' || taxReminder.status === 'overdue'

  return (
    <div
      className={`rounded-2xl border transition-all shadow-lg overflow-hidden ${
        taxReminder.isPaid
          ? 'bg-gradient-to-r from-emerald-950/80 via-surface-900 to-surface-950 border-emerald-800/60'
          : isDueOrOverdue
          ? 'bg-gradient-to-r from-rose-950/80 via-amber-950/40 to-surface-950 border-amber-600/70 shadow-amber-950/30'
          : 'bg-gradient-to-r from-surface-900 via-surface-900 to-surface-950 border-surface-700'
      }`}
    >
      <div className="p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Left Icon & Main Text */}
        <div className="flex items-start gap-3.5 min-w-0">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
              taxReminder.isPaid
                ? 'bg-emerald-900/80 text-emerald-300 border border-emerald-700'
                : 'bg-rose-900/80 text-rose-300 border border-rose-700 animate-pulse'
            }`}
          >
            {taxReminder.isPaid ? (
              <CheckCircle2 className="w-6 h-6" />
            ) : (
              <Landmark className="w-6 h-6" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                  taxReminder.isPaid
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-700/60'
                    : taxReminder.status === 'overdue'
                    ? 'bg-rose-950 text-rose-300 border-rose-700/60'
                    : 'bg-amber-950 text-amber-300 border-amber-700/60'
                }`}
              >
                {taxReminder.isPaid
                  ? '✓ Steuer bezahlt'
                  : taxReminder.status === 'overdue'
                  ? '⚠️ Überfällig seit 15.'
                  : '⏳ Fällig am 15.'}
              </span>
              <span className="text-xs text-surface-400 font-medium">
                Monat: <strong className="text-surface-200">{taxReminder.monthLabel}</strong>
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-black text-surface-50 mt-1 flex items-center gap-2">
              <span>Steuer-Meldung & Fälligkeit (ATK Kosovo)</span>
            </h3>

            <p className="text-xs text-surface-300 mt-0.5">
              {taxReminder.isPaid ? (
                <span className="text-emerald-400 font-medium">
                  Die Steuer für {taxReminder.monthLabel} wurde erfolgreich berechnet und verbucht.
                </span>
              ) : (
                <span>
                  Fälligkeit: <strong>15. {taxReminder.dueDate.slice(5, 7)}.{taxReminder.dueDate.slice(0, 4)}</strong> · Berechnete Steuer: <strong className="text-rose-400 font-mono text-sm">{formatCurrency(taxReminder.estimatedTaxAmount)}</strong>
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Right CTA / Action Buttons */}
        <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0 justify-end">
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="px-3 py-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-surface-300 text-xs font-semibold border border-surface-700 transition-colors"
          >
            {showDetails ? 'Berechnung ausblenden' : 'Berechnung prüfen'}
          </button>

          {!taxReminder.isPaid && (
            <button
              type="button"
              onClick={() => onBookTax(taxReminder)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 active:scale-95 text-white text-xs font-bold shadow-lg flex items-center gap-1.5 transition-all shadow-rose-950/40"
            >
              <Receipt className="w-4 h-4" />
              <span>Als bezahlt buchen</span>
            </button>
          )}
        </div>
      </div>

      {/* Expanded Calculation Details */}
      {showDetails && (
        <div className="p-4 sm:p-5 border-t border-surface-800/80 bg-surface-950/70 space-y-3 animate-in fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-surface-900 border border-surface-800">
              <p className="text-[11px] text-surface-400 uppercase font-semibold">1. Monatsumsatz</p>
              <p className="text-base font-black text-emerald-400 font-mono mt-0.5">
                {formatCurrency(taxReminder.totalRevenue)}
              </p>
              <p className="text-[10px] text-surface-500 mt-0.5">Alle 2026 Verkäufe</p>
            </div>

            <div className="p-3 rounded-xl bg-surface-900 border border-surface-800">
              <p className="text-[11px] text-surface-400 uppercase font-semibold">2. Abzugsfähige Kosten</p>
              <p className="text-base font-black text-rose-400 font-mono mt-0.5">
                − {formatCurrency(taxReminder.totalDeductibleExpenses)}
              </p>
              <p className="text-[10px] text-surface-500 mt-0.5">Löhne, Diesel, Miete, Strom</p>
            </div>

            <div className="p-3 rounded-xl bg-surface-900 border border-surface-800">
              <p className="text-[11px] text-surface-400 uppercase font-semibold">3. Steuerliche Bemessung</p>
              <p className="text-base font-black text-surface-100 font-mono mt-0.5">
                {formatCurrency(Math.max(0, taxReminder.totalRevenue - taxReminder.totalDeductibleExpenses))}
              </p>
              <p className="text-[10px] text-surface-500 mt-0.5">Gewinn vor Steuern</p>
            </div>

            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60">
              <p className="text-[11px] text-rose-300 uppercase font-semibold">4. Steuerbetrag (10% ATK)</p>
              <p className="text-base font-black text-rose-400 font-mono mt-0.5">
                {formatCurrency(taxReminder.estimatedTaxAmount)}
              </p>
              <p className="text-[10px] text-rose-300/80 mt-0.5">Fällig am 15. des Folgemonats</p>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-surface-400 pt-1">
            <span className="flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-surface-500" />
              Automatische Fristenprüfung: Gesetzliche Steuerfrist im Kosovo ist der 15. jedes Folgemonats.
            </span>
            <span className="font-mono text-surface-300">
              Referenz: ATK-TVSH-{taxReminder.monthKey}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

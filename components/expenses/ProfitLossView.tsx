'use client'

import { useMemo, useState } from 'react'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  BarChart3,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Fuel,
  Building,
  Zap,
  Landmark,
  Wrench,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'
import { formatCurrency, formatNumber } from '@/lib/utils/currency'
import {
  EXPENSE_CATEGORIES_META,
  type MonthlyFinancialSummary,
  type ExpenseCategory,
} from '@/lib/expenseStore'

interface ProfitLossViewProps {
  summaries: MonthlyFinancialSummary[]
}

export default function ProfitLossView({ summaries }: ProfitLossViewProps) {
  const [selectedYear, setSelectedYear] = useState('2026')

  // Overall totals across all months
  const totals = useMemo(() => {
    return summaries.reduce(
      (acc, m) => {
        acc.revenue += m.revenue
        acc.totalExpenses += m.totalExpenses
        acc.netProfit += m.netProfit
        acc.salaries += m.salariesExpense
        acc.fuel += m.fuelExpense
        acc.electricity += m.electricityExpense
        acc.rent += m.rentExpense
        acc.tax += m.taxExpense
        acc.maintenance += m.maintenanceExpense
        acc.other += m.materialsExpense + m.otherExpense
        return acc
      },
      {
        revenue: 0,
        totalExpenses: 0,
        netProfit: 0,
        salaries: 0,
        fuel: 0,
        electricity: 0,
        rent: 0,
        tax: 0,
        maintenance: 0,
        other: 0,
      }
    )
  }, [summaries])

  const overallMarginPercent = totals.revenue > 0 ? (totals.netProfit / totals.revenue) * 100 : 0

  // Category breakdown for distribution
  const categoryBreakdown = useMemo(() => {
    const totalExp = totals.totalExpenses || 1
    return [
      {
        category: 'salary' as ExpenseCategory,
        label: 'Löhne & Gehälter (Fahrer Mensuri & Qerimi)',
        amount: totals.salaries,
        percent: (totals.salaries / totalExp) * 100,
        icon: '👥',
        color: '#10b981',
        barColor: 'bg-emerald-500',
      },
      {
        category: 'fuel' as ExpenseCategory,
        label: 'Treibstoff (Diesel Fahrzeuge)',
        amount: totals.fuel,
        percent: (totals.fuel / totalExp) * 100,
        icon: '⛽',
        color: '#f59e0b',
        barColor: 'bg-amber-500',
      },
      {
        category: 'rent' as ExpenseCategory,
        label: 'Miete (Hauptlager Fushë Kosovë)',
        amount: totals.rent,
        percent: (totals.rent / totalExp) * 100,
        icon: '🏢',
        color: '#8b5cf6',
        barColor: 'bg-purple-500',
      },
      {
        category: 'electricity' as ExpenseCategory,
        label: 'Strom & Energie (KEDS)',
        amount: totals.electricity,
        percent: (totals.electricity / totalExp) * 100,
        icon: '⚡',
        color: '#eab308',
        barColor: 'bg-yellow-500',
      },
      {
        category: 'maintenance' as ExpenseCategory,
        label: 'Fahrzeug-Wartung & Reparaturen',
        amount: totals.maintenance,
        percent: (totals.maintenance / totalExp) * 100,
        icon: '🔧',
        color: '#3b82f6',
        barColor: 'bg-blue-500',
      },
      {
        category: 'other' as ExpenseCategory,
        label: 'Sonstige Betriebskosten',
        amount: totals.other,
        percent: (totals.other / totalExp) * 100,
        icon: '📝',
        color: '#94a3b8',
        barColor: 'bg-surface-500',
      },
    ].sort((a, b) => b.amount - a.amount)
  }, [totals])

  // Max value for monthly chart scaling
  const maxMonthRevenue = useMemo(() => {
    return Math.max(...summaries.map((s) => s.revenue), 1)
  }, [summaries])

  return (
    <div className="space-y-6">
      {/* KPI Top Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Revenue */}
        <div className="glass-card p-4 border border-surface-700/60 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-surface-400 font-semibold uppercase tracking-wider">
              Gesamtumsatz (2026)
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-400 font-mono">
            {formatCurrency(totals.revenue)}
          </p>
          <p className="text-[11px] text-surface-400 mt-1">
            Aus allen {summaries.length} Geschäftsmonaten
          </p>
        </div>

        {/* Total Expenses */}
        <div className="glass-card p-4 border border-surface-700/60 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-surface-400 font-semibold uppercase tracking-wider">
              Gesamtausgaben (2026)
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-950/80 text-rose-400 border border-rose-800/60 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-400 font-mono">
            {formatCurrency(totals.totalExpenses)}
          </p>
          <p className="text-[11px] text-surface-400 mt-1">
            Löhne, Diesel, Miete, Strom, Service
          </p>
        </div>

        {/* Net Profit */}
        <div className="glass-card p-4 border border-brand-800/60 bg-brand-950/20 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-brand-300 font-semibold uppercase tracking-wider">
              Reingewinn (EBITDA)
            </span>
            <div className="w-8 h-8 rounded-xl bg-brand-900/80 text-brand-300 border border-brand-700/60 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white font-mono">
            {formatCurrency(totals.netProfit)}
          </p>
          <p className="text-[11px] text-brand-400 mt-1 font-semibold">
            Reiner Gewinn nach allen Betriebskosten
          </p>
        </div>

        {/* Profit Margin */}
        <div className="glass-card p-4 border border-surface-700/60 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-surface-400 font-semibold uppercase tracking-wider">
              Reingewinn-Marge
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-950/80 text-indigo-400 border border-indigo-800/60 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-indigo-300 font-mono">
            {overallMarginPercent.toFixed(1)} %
          </p>
          <p className="text-[11px] text-surface-400 mt-1">
            Vom Umsatz verbleibender Reingewinn
          </p>
        </div>
      </div>

      {/* SECTION 2: MONTHLY PROFIT & LOSS BAR CHART */}
      <div className="glass-card p-5 border border-surface-700/60 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-surface-100 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-brand-400" />
              Monatlicher GuV-Verlauf (Umsatz vs. Kosten vs. Reingewinn)
            </h3>
            <p className="text-xs text-surface-400 mt-0.5">
              Direkter Monatsvergleich aller Einnahmen und Ausgaben für 2026
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <div className="w-3 h-3 rounded bg-emerald-500"></div>
              <span>Umsatz</span>
            </div>
            <div className="flex items-center gap-1.5 text-rose-400">
              <div className="w-3 h-3 rounded bg-rose-500"></div>
              <span>Ausgaben</span>
            </div>
            <div className="flex items-center gap-1.5 text-brand-300">
              <div className="w-3 h-3 rounded bg-brand-500"></div>
              <span>Reingewinn</span>
            </div>
          </div>
        </div>

        {/* Visual Monthly Bars */}
        <div className="space-y-3 pt-2">
          {summaries.map((m) => {
            const revWidth = Math.max(5, (m.revenue / maxMonthRevenue) * 100)
            const expWidth = Math.max(3, (m.totalExpenses / maxMonthRevenue) * 100)
            const profitWidth = Math.max(3, (Math.max(0, m.netProfit) / maxMonthRevenue) * 100)

            return (
              <div key={m.monthKey} className="p-3 rounded-xl bg-surface-950/60 border border-surface-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-surface-100">{m.monthLabel}</span>
                  <div className="flex items-center gap-3 font-mono text-xs">
                    <span className="text-emerald-400 font-bold">{formatCurrency(m.revenue)}</span>
                    <span className="text-surface-600">/</span>
                    <span className="text-rose-400 font-bold">{formatCurrency(m.totalExpenses)}</span>
                    <span className="text-surface-600">/</span>
                    <span className="text-white font-black bg-brand-950 px-2 py-0.5 rounded border border-brand-800/40">
                      Gewinn: {formatCurrency(m.netProfit)} ({m.profitMarginPercent}%)
                    </span>
                  </div>
                </div>

                {/* Progress bars */}
                <div className="space-y-1">
                  {/* Revenue Bar */}
                  <div className="h-2 rounded-full bg-surface-900 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${revWidth}%` }}
                    />
                  </div>
                  {/* Expense & Profit Bar */}
                  <div className="flex gap-1 h-2 rounded-full bg-surface-900 overflow-hidden">
                    <div
                      className="h-full bg-rose-500 rounded-full transition-all duration-500"
                      style={{ width: `${expWidth}%` }}
                      title={`Ausgaben: ${formatCurrency(m.totalExpenses)}`}
                    />
                    <div
                      className="h-full bg-brand-500 rounded-full transition-all duration-500"
                      style={{ width: `${profitWidth}%` }}
                      title={`Reingewinn: ${formatCurrency(m.netProfit)}`}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* SECTION 3: COST DISTRIBUTION BREAKDOWN */}
      <div className="glass-card p-5 border border-surface-700/60 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-surface-100 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-brand-400" />
            Kostenverteilung (Wo fließt das Geld hin?)
          </h3>
          <p className="text-xs text-surface-400 mt-0.5">
            Prozentuale Aufteilung der Gesamtausgaben für das Jahr 2026
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {categoryBreakdown.map((cat) => (
            <div key={cat.label} className="p-3.5 rounded-xl bg-surface-950/70 border border-surface-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-surface-200 flex items-center gap-1.5">
                  <span>{cat.icon}</span>
                  <span className="truncate">{cat.label.split('(')[0].trim()}</span>
                </span>
                <span className="font-mono font-black text-surface-100">{cat.percent.toFixed(1)} %</span>
              </div>

              <div className="h-2 rounded-full bg-surface-900 overflow-hidden">
                <div
                  className={`h-full ${cat.barColor} rounded-full transition-all duration-500`}
                  style={{ width: `${Math.max(5, cat.percent)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-surface-400 font-mono">
                <span>Summe 2026:</span>
                <strong className="text-surface-100 font-bold">{formatCurrency(cat.amount)}</strong>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 4: FULL P&L DETAILED TABLE */}
      <div className="glass-card overflow-hidden border border-surface-700/60 shadow-lg">
        <div className="p-4 border-b border-surface-800 bg-surface-950/70 flex items-center justify-between">
          <h3 className="text-sm font-bold text-surface-100 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-brand-400" />
            Vollständige Monats-GuV Tabelle (2026)
          </h3>
          <span className="text-xs text-surface-400 font-mono">{summaries.length} Monate</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-surface-800 bg-surface-950/90 text-surface-400 font-semibold text-xs uppercase tracking-wider">
                <th className="px-4 py-3">Monat</th>
                <th className="px-4 py-3 text-right">Einnahmen (Umsatz)</th>
                <th className="px-4 py-3 text-right">👥 Löhne</th>
                <th className="px-4 py-3 text-right">⛽ Diesel</th>
                <th className="px-4 py-3 text-right">🏢 Miete & Strom</th>
                <th className="px-4 py-3 text-right">Sonstiges</th>
                <th className="px-4 py-3 text-right text-rose-400 font-bold">Gesamtkosten</th>
                <th className="px-4 py-3 text-right text-brand-400 font-black">Reingewinn</th>
                <th className="px-4 py-3 text-center">Marge</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-800/40 font-mono text-xs">
              {summaries.map((m, idx) => {
                const rentAndElec = m.rentExpense + m.electricityExpense
                const other = m.maintenanceExpense + m.materialsExpense + m.otherExpense + m.taxExpense

                return (
                  <tr
                    key={m.monthKey}
                    className={`hover:bg-brand-950/20 transition-colors ${
                      idx % 2 === 0 ? 'bg-surface-900/10' : 'bg-surface-900/40'
                    }`}
                  >
                    <td className="px-4 py-3 font-sans font-bold text-surface-100">
                      {m.monthLabel}
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-400 font-bold">
                      {formatCurrency(m.revenue)}
                    </td>
                    <td className="px-4 py-3 text-right text-surface-300">
                      {formatCurrency(m.salariesExpense)}
                    </td>
                    <td className="px-4 py-3 text-right text-surface-300">
                      {formatCurrency(m.fuelExpense)}
                    </td>
                    <td className="px-4 py-3 text-right text-surface-300">
                      {formatCurrency(rentAndElec)}
                    </td>
                    <td className="px-4 py-3 text-right text-surface-400">
                      {formatCurrency(other)}
                    </td>
                    <td className="px-4 py-3 text-right text-rose-400 font-bold">
                      {formatCurrency(m.totalExpenses)}
                    </td>
                    <td className="px-4 py-3 text-right text-white font-black text-sm">
                      {formatCurrency(m.netProfit)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-sans text-[11px] font-bold px-2 py-0.5 rounded-full bg-brand-950 text-brand-300 border border-brand-800/40">
                        {m.profitMarginPercent}%
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            {/* Table Summary Footer */}
            <tfoot>
              <tr className="border-t-2 border-surface-700 bg-surface-950 font-mono text-xs font-bold">
                <td className="px-4 py-3.5 font-sans text-surface-100 uppercase tracking-wider">
                  Gesamt 2026
                </td>
                <td className="px-4 py-3.5 text-right text-emerald-400 text-sm">
                  {formatCurrency(totals.revenue)}
                </td>
                <td className="px-4 py-3.5 text-right text-surface-200">
                  {formatCurrency(totals.salaries)}
                </td>
                <td className="px-4 py-3.5 text-right text-surface-200">
                  {formatCurrency(totals.fuel)}
                </td>
                <td className="px-4 py-3.5 text-right text-surface-200">
                  {formatCurrency(totals.rent + totals.electricity)}
                </td>
                <td className="px-4 py-3.5 text-right text-surface-300">
                  {formatCurrency(totals.maintenance + totals.other + totals.tax)}
                </td>
                <td className="px-4 py-3.5 text-right text-rose-400 text-sm">
                  {formatCurrency(totals.totalExpenses)}
                </td>
                <td className="px-4 py-3.5 text-right text-white text-base font-black">
                  {formatCurrency(totals.netProfit)}
                </td>
                <td className="px-4 py-3.5 text-center">
                  <span className="font-sans text-xs font-black px-2.5 py-1 rounded-full bg-brand-900 text-brand-200 border border-brand-700">
                    {overallMarginPercent.toFixed(1)}%
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}

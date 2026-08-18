'use client'

import { useState, useMemo, useEffect } from 'react'
import {
  DollarSign,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Calendar,
  Fuel,
  Zap,
  Building,
  Users,
  Landmark,
  Wrench,
  Package,
  Receipt,
  Eye,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Truck,
  TrendingDown,
  TrendingUp,
  X,
  Sparkles,
} from 'lucide-react'
import { formatCurrency, formatNumber } from '@/lib/utils/currency'
import {
  getAllExpenses,
  saveExpense,
  deleteExpense,
  getMonthlyFinancialSummaries,
  getTaxReminderForMonth,
  EXPENSE_CATEGORIES_META,
  type ExpenseEntry,
  type ExpenseCategory,
  type TaxReminder,
} from '@/lib/expenseStore'
import { getSalesHistory } from '@/lib/stockStore'
import ExpenseModal from './ExpenseModal'
import TaxReminderBanner from './TaxReminderBanner'
import ProfitLossView from './ProfitLossView'

export default function ExpenseListView() {
  const [salesList, setSalesList] = useState<any[]>([])
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([])
  const [activeTab, setActiveTab] = useState<'expenses' | 'pnl' | 'tax'>('expenses')

  // Filters
  const [selectedMonth, setSelectedMonth] = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedVehicle, setSelectedVehicle] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc')

  // Modals
  const [modalData, setModalData] = useState<{ isOpen: boolean; initialData?: Partial<ExpenseEntry> }>({
    isOpen: false,
  })
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)

  // Load data & sync with sales
  useEffect(() => {
    function loadData() {
      fetch('/api/sales/record')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.sales) && data.sales.length > 0) {
            setSalesList(data.sales)
            setExpenses(getAllExpenses(data.sales))
          } else {
            const localSales = getSalesHistory()
            setSalesList(localSales)
            setExpenses(getAllExpenses(localSales))
          }
        })
        .catch(() => {
          const localSales = getSalesHistory()
          setSalesList(localSales)
          setExpenses(getAllExpenses(localSales))
        })
    }

    loadData()
    window.addEventListener('m_one_expenses_updated', loadData)
    window.addEventListener('m_one_sale_recorded', loadData)
    return () => {
      window.removeEventListener('m_one_expenses_updated', loadData)
      window.removeEventListener('m_one_sale_recorded', loadData)
    }
  }, [])

  // Financial Summaries for P&L and Tax
  const financialSummaries = useMemo(() => {
    return getMonthlyFinancialSummaries(salesList, expenses)
  }, [salesList, expenses])

  // Extract available months
  const availableMonths = useMemo(() => {
    const set = new Set<string>()
    expenses.forEach((e) => {
      if (e.month && e.month.match(/^\d{4}-\d{2}$/)) set.add(e.month)
    })
    return Array.from(set).sort().reverse()
  }, [expenses])

  // Latest / Current Month's Tax Reminder
  const currentTaxReminder = useMemo(() => {
    // Determine the month to show reminder for (latest completed or current month)
    const targetMonth = selectedMonth !== 'all' ? selectedMonth : availableMonths[0] || '2026-08'
    return getTaxReminderForMonth(targetMonth, salesList, expenses)
  }, [selectedMonth, availableMonths, salesList, expenses])

  // Filtered & Sorted Expenses List
  const processedExpenses = useMemo(() => {
    return expenses
      .filter((e) => {
        // Month filter
        if (selectedMonth !== 'all' && e.month !== selectedMonth) return false

        // Category filter
        if (selectedCategory !== 'all' && e.category !== selectedCategory) return false

        // Vehicle filter
        if (selectedVehicle !== 'all') {
          if (selectedVehicle === 'vehicle-1' && e.vehicleId !== 'vehicle-1' && e.driverName !== 'Mensuri') return false
          if (selectedVehicle === 'vehicle-2' && e.vehicleId !== 'vehicle-2' && e.driverName !== 'Qerimi') return false
          if (selectedVehicle === 'depot' && e.vehicleId !== 'depot') return false
        }

        // Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase()
          const matchTitle = e.title?.toLowerCase().includes(q)
          const matchNotes = e.notes?.toLowerCase().includes(q)
          const matchRef = e.taxReference?.toLowerCase().includes(q)
          const matchDriver = e.driverName?.toLowerCase().includes(q)
          if (!matchTitle && !matchNotes && !matchRef && !matchDriver) return false
        }

        return true
      })
      .sort((a, b) => {
        if (sortBy === 'date_desc') return b.date.localeCompare(a.date)
        if (sortBy === 'date_asc') return a.date.localeCompare(b.date)
        if (sortBy === 'amount_desc') return b.amount - a.amount
        if (sortBy === 'amount_asc') return a.amount - b.amount
        return 0
      })
  }, [expenses, selectedMonth, selectedCategory, selectedVehicle, searchQuery, sortBy])

  // Overall Totals for Header KPIs
  const totalAmountFiltered = useMemo(() => {
    return processedExpenses.reduce((s, e) => s + e.amount, 0)
  }, [processedExpenses])

  const totalFuelAmount = useMemo(() => {
    return processedExpenses.filter((e) => e.category === 'fuel').reduce((s, e) => s + e.amount, 0)
  }, [processedExpenses])

  const totalSalariesAmount = useMemo(() => {
    return processedExpenses.filter((e) => e.category === 'salary').reduce((s, e) => s + e.amount, 0)
  }, [processedExpenses])

  // Handle Tax Booking from Banner
  function handleBookTax(taxReminder: TaxReminder) {
    setModalData({
      isOpen: true,
      initialData: {
        title: `Steuer-Zahlung ATK (${taxReminder.monthLabel})`,
        category: 'tax',
        amount: taxReminder.estimatedTaxAmount,
        date: taxReminder.dueDate,
        taxReference: `ATK-TVSH-${taxReminder.monthKey}`,
        notes: `Steuererklärung für ${taxReminder.monthLabel} (10% Gewinnsteuer auf Basis von ${formatCurrency(taxReminder.totalRevenue)} Umsatz).`,
      },
    })
  }

  function handleSaveExpense(entry: ExpenseEntry) {
    saveExpense(entry)
    setModalData({ isOpen: false })
    setExpenses(getAllExpenses(salesList))
  }

  function handleDeleteExpense(id: string) {
    if (confirm('Möchtest du diese Ausgabe wirklich löschen?')) {
      deleteExpense(id)
      setExpenses(getAllExpenses(salesList))
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-surface-100 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-950 border border-brand-800/60 flex items-center justify-center text-brand-400">
              <DollarSign className="w-5 h-5" />
            </div>
            <span>Betriebsausgaben, Finanzen & GuV</span>
          </h1>
          <p className="text-xs text-surface-400 mt-1">
            Laufende Kosten (Treibstoff, Strom, Miete), automatische Fahrerlöhne, monatliche Steuerabrechnung & Gewinnrechnung
          </p>
        </div>

        {/* Top Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setModalData({ isOpen: true })}
            className="btn-primary py-2.5 px-4 text-xs font-bold shadow-glow flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Ausgabe erfassen</span>
          </button>
        </div>
      </div>

      {/* Tax Reminder Banner (Always visible on top) */}
      <TaxReminderBanner
        taxReminder={currentTaxReminder}
        onBookTax={handleBookTax}
      />

      {/* Top KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="glass-card p-4 border border-surface-700/60 flex items-center justify-between">
          <div>
            <p className="text-xs text-surface-400 font-semibold uppercase">Gesamtausgaben</p>
            <p className="text-2xl font-black text-rose-400 font-mono mt-0.5">
              {formatCurrency(totalAmountFiltered)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-950/80 text-rose-400 border border-rose-800/60 flex items-center justify-center">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card p-4 border border-surface-700/60 flex items-center justify-between">
          <div>
            <p className="text-xs text-surface-400 font-semibold uppercase">⛽ Diesel & Treibstoff</p>
            <p className="text-2xl font-black text-amber-400 font-mono mt-0.5">
              {formatCurrency(totalFuelAmount)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-950/80 text-amber-400 border border-amber-800/60 flex items-center justify-center">
            <Fuel className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card p-4 border border-surface-700/60 flex items-center justify-between">
          <div>
            <p className="text-xs text-surface-400 font-semibold uppercase">👥 Fahrerlöhne (Auto)</p>
            <p className="text-2xl font-black text-emerald-400 font-mono mt-0.5">
              {formatCurrency(totalSalariesAmount)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card p-4 border border-surface-700/60 flex items-center justify-between">
          <div>
            <p className="text-xs text-surface-400 font-semibold uppercase">Erfasste Posten</p>
            <p className="text-2xl font-black text-surface-100 font-mono mt-0.5">
              {processedExpenses.length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-surface-800 text-surface-300 flex items-center justify-center">
            <Receipt className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-surface-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('expenses')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'expenses'
              ? 'bg-brand-600 text-white shadow-glow'
              : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Alle Ausgaben ({processedExpenses.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pnl')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'pnl'
              ? 'bg-brand-600 text-white shadow-glow'
              : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Gewinn & Verlust (GuV)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('tax')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'tax'
              ? 'bg-brand-600 text-white shadow-glow'
              : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800'
          }`}
        >
          <Landmark className="w-4 h-4" />
          <span>Steuer-Abrechnung (Frist 15.)</span>
        </button>
      </div>

      {/* TAB 1: ALL EXPENSES LIST */}
      {activeTab === 'expenses' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Filters & Search Toolbar */}
          <div className="glass-card p-4 border border-surface-700/60 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Search */}
              <div className="relative lg:col-span-2">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ausgaben suchen nach Grund, Notiz, Fahrer..."
                  className="w-full pl-10 pr-4 py-2 bg-surface-900 border border-surface-700 rounded-xl text-xs font-semibold text-white placeholder:text-surface-500 focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>

              {/* Month Filter */}
              <div>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-900 border border-surface-700 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-brand-500 transition-colors"
                >
                  <option value="all">Alle Monate ({availableMonths.length})</option>
                  {availableMonths.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-900 border border-surface-700 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-brand-500 transition-colors"
                >
                  <option value="all">Alle Kategorien</option>
                  {(Object.keys(EXPENSE_CATEGORIES_META) as ExpenseCategory[]).map((cat) => (
                    <option key={cat} value={cat}>
                      {EXPENSE_CATEGORIES_META[cat].icon} {EXPENSE_CATEGORIES_META[cat].label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sorting */}
              <div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full px-3 py-2 bg-surface-900 border border-surface-700 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-brand-500 transition-colors"
                >
                  <option value="date_desc">Datum (neueste zuerst)</option>
                  <option value="date_asc">Datum (älteste zuerst)</option>
                  <option value="amount_desc">Betrag (höchste zuerst)</option>
                  <option value="amount_asc">Betrag (niedrigste zuerst)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Expenses Table */}
          <div className="glass-card overflow-hidden border border-surface-700/60 shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-surface-800 bg-surface-950/80 text-surface-400 font-semibold text-xs uppercase tracking-wider">
                    <th className="px-4 py-3 w-28">Datum</th>
                    <th className="px-4 py-3 w-40">Kategorie</th>
                    <th className="px-4 py-3">Bezeichnung / Grund</th>
                    <th className="px-4 py-3 w-44">Zuordnung</th>
                    <th className="px-4 py-3 w-24 text-center">Beleg</th>
                    <th className="px-4 py-3 w-32 text-right">Betrag (€)</th>
                    <th className="px-4 py-3 w-16 text-center">Aktion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-800/40">
                  {processedExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-surface-500">
                        Keine Ausgaben für die gewählten Filter gefunden.
                      </td>
                    </tr>
                  ) : (
                    processedExpenses.map((exp, idx) => {
                      const catMeta = EXPENSE_CATEGORIES_META[exp.category] || EXPENSE_CATEGORIES_META.other
                      const rowBg = idx % 2 === 0 ? 'bg-surface-900/10' : 'bg-surface-900/40'

                      return (
                        <tr
                          key={exp.id}
                          className={`hover:bg-brand-950/20 transition-colors ${rowBg}`}
                        >
                          {/* Date */}
                          <td className="px-4 py-3 font-mono text-xs text-surface-300">
                            {exp.date}
                          </td>

                          {/* Category Badge */}
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg ${catMeta.badgeClass}`}>
                              <span>{catMeta.icon}</span>
                              <span>{catMeta.label.split('(')[0].trim()}</span>
                            </span>
                          </td>

                          {/* Title & Notes */}
                          <td className="px-4 py-3">
                            <div className="font-semibold text-surface-100 flex items-center gap-1.5">
                              <span>{exp.title}</span>
                              {exp.isAutomatic && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/50">
                                  Auto-Lohn
                                </span>
                              )}
                            </div>
                            {exp.notes && (
                              <p className="text-[11px] text-surface-400 mt-0.5 line-clamp-1">
                                {exp.notes}
                              </p>
                            )}
                            {exp.fuelLiters && (
                              <span className="text-[10px] text-amber-400 font-mono mt-0.5 block">
                                ⛽ {exp.fuelLiters} Liter {exp.mileage ? `· KM: ${exp.mileage}` : ''}
                              </span>
                            )}
                          </td>

                          {/* Vehicle / Target Assignment */}
                          <td className="px-4 py-3 text-xs text-surface-300">
                            {exp.vehicleName ? (
                              <span className="inline-flex items-center gap-1">
                                <Truck className="w-3.5 h-3.5 text-surface-500 shrink-0" />
                                <span className="truncate">{exp.vehicleName}</span>
                              </span>
                            ) : (
                              <span className="text-surface-600">—</span>
                            )}
                          </td>

                          {/* Receipt Image Button */}
                          <td className="px-4 py-3 text-center">
                            {exp.receiptImage ? (
                              <button
                                type="button"
                                onClick={() => setLightboxImage(exp.receiptImage!)}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-300 bg-brand-950/80 hover:bg-brand-900 border border-brand-800/60 px-2 py-1 rounded-lg transition-colors"
                                title="Belegfoto ansehen"
                              >
                                <Eye className="w-3.5 h-3.5 text-brand-400" />
                                <span>Beleg</span>
                              </button>
                            ) : (
                              <span className="text-[11px] text-surface-600 italic">—</span>
                            )}
                          </td>

                          {/* Amount */}
                          <td className="px-4 py-3 text-right font-mono text-sm font-black text-rose-400">
                            − {formatCurrency(exp.amount)}
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3 text-center">
                            {!exp.isAutomatic && (
                              <button
                                type="button"
                                onClick={() => handleDeleteExpense(exp.id)}
                                className="p-1.5 text-surface-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors"
                                title="Ausgabe löschen"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="px-4 py-3 border-t border-surface-800 bg-surface-950/80 flex items-center justify-between text-xs text-surface-400 font-mono">
              <span>{processedExpenses.length} Ausgaben angezeigt</span>
              <span className="text-surface-100 font-bold text-sm">
                Gesamt: <span className="text-rose-400 font-black">− {formatCurrency(totalAmountFiltered)}</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: P&L VIEW */}
      {activeTab === 'pnl' && (
        <div className="animate-in fade-in">
          <ProfitLossView summaries={financialSummaries} />
        </div>
      )}

      {/* TAB 3: TAX VIEW */}
      {activeTab === 'tax' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="glass-card p-5 border border-surface-700/60 space-y-4">
            <div>
              <h2 className="text-base font-bold text-surface-100 flex items-center gap-2">
                <Landmark className="w-5 h-5 text-rose-400" />
                Monatliche Steuer-Fälligkeiten (ATK Kosovo Frist: 15. jeden Monats)
              </h2>
              <p className="text-xs text-surface-400 mt-0.5">
                Die Steuer für jeden Geschäftsmonat wird auf Basis von Umsatz minus abzugsfähigen Betriebsausgaben berechnet und ist jeweils am 15. des Folgemonats fällig.
              </p>
            </div>

            <div className="space-y-3">
              {financialSummaries.map((m) => {
                const tax = m.taxReminder
                return (
                  <div
                    key={tax.monthKey}
                    className="p-4 rounded-xl bg-surface-950/70 border border-surface-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-surface-100 text-sm">
                          {tax.monthLabel}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            tax.isPaid
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                              : 'bg-rose-950 text-rose-300 border-rose-800'
                          }`}
                        >
                          {tax.isPaid ? '✓ Bezahlt' : `Fällig am 15. ${tax.dueDate.slice(5, 7)}.`}
                        </span>
                      </div>
                      <p className="text-xs text-surface-400 mt-1 font-mono">
                        Umsatz: <span className="text-emerald-400 font-bold">{formatCurrency(tax.totalRevenue)}</span> · Kosten: <span className="text-rose-400">{formatCurrency(tax.totalDeductibleExpenses)}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right font-mono">
                        <p className="text-[10px] text-surface-400 uppercase">Berechnete Steuer (10%)</p>
                        <p className="text-base font-black text-rose-400">{formatCurrency(tax.estimatedTaxAmount)}</p>
                      </div>

                      {!tax.isPaid && (
                        <button
                          type="button"
                          onClick={() => handleBookTax(tax)}
                          className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md transition-colors"
                        >
                          Zahlung buchen
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add / Edit Expense */}
      {modalData.isOpen && (
        <ExpenseModal
          initialData={modalData.initialData}
          onClose={() => setModalData({ isOpen: false })}
          onSaved={handleSaveExpense}
        />
      )}

      {/* Fullscreen Lightbox for Receipts */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-60 bg-black/95 flex items-center justify-center p-4 cursor-pointer animate-in fade-in"
        >
          <div className="relative max-w-3xl max-h-[90vh]">
            <img src={lightboxImage} alt="Beleg" className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl" />
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute -top-3 -right-3 p-2 bg-surface-800 text-white rounded-full border border-surface-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

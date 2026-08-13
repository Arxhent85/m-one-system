'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Users, Trophy, MapPin, AlertCircle, TrendingUp,
  Clock, ArrowUpRight, Search, Phone, Calendar, CheckCircle2, ChevronRight, Eye
} from 'lucide-react'
import { formatCurrency, formatNumber } from '@/lib/utils/currency'
import { getSalesHistory } from '@/lib/stockStore'
import MOCK_CUSTOMERS from '@/lib/mockCustomers.json'
import CustomerDetailModal from './CustomerDetailModal'
import ProductDetailModal from './ProductDetailModal'

import MOCK_2026_SALES from '@/lib/mock2026Sales.json'

interface Customer {
  customer_number: string
  company_name: string
  city?: string
  agent?: string
  phone?: string
}

export default function CustomerAnalyticsView() {
  const [salesList, setSalesList] = useState<any[]>(MOCK_2026_SALES)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'overview' | 'top_customers' | 'cities' | 'churn_risk'>('overview')
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null)

  useEffect(() => {
    function loadData() {
      const isCleared = typeof window !== 'undefined' && localStorage.getItem('m_one_sales_cleared') === 'true'
      const local = getSalesHistory()

      fetch('/api/sales/record')
        .then((res) => res.json())
        .then((data) => {
          const serverSales = data.success && Array.isArray(data.sales) ? data.sales : []
          const combined = [...serverSales]
          local.forEach((l: any) => {
            if (!combined.some((c) => c.id === l.id || c.order_number === l.order_number)) {
              combined.push(l)
            }
          })
          if (combined.length > 0) {
            setSalesList(combined)
          } else if (isCleared) {
            setSalesList([])
          } else {
            setSalesList(MOCK_2026_SALES)
          }
        })
        .catch(() => {
          if (local.length > 0) {
            setSalesList(local)
          } else if (isCleared) {
            setSalesList([])
          } else {
            setSalesList(MOCK_2026_SALES)
          }
        })
    }

    loadData()
    window.addEventListener('focus', loadData)
    window.addEventListener('m_one_sale_recorded', loadData)
    return () => {
      window.removeEventListener('focus', loadData)
      window.removeEventListener('m_one_sale_recorded', loadData)
    }
  }, [])

  // 1. Aggregierte Kunden-Statistiken berechnen
  const customerStats = useMemo(() => {
    const map: Record<string, {
      customer_number: string
      company_name: string
      city: string
      agent: string
      total_revenue: number
      orders_count: number
      last_order_date: string
      items_bought: number
    }> = {}

    const rawCustomers: Customer[] = Array.isArray(MOCK_CUSTOMERS)
      ? (MOCK_CUSTOMERS as Customer[])
      : ((MOCK_CUSTOMERS as any)?.default || [])

    // Kundenstamm initialisieren
    if (Array.isArray(rawCustomers)) {
      rawCustomers.forEach((c) => {
        if (c && c.customer_number) {
          map[c.customer_number] = {
            customer_number: c.customer_number,
            company_name: c.company_name || `Kunde #${c.customer_number}`,
            city: c.city || 'Unbekannt',
            agent: c.agent || 'Zentrale',
            total_revenue: 0,
            orders_count: 0,
            last_order_date: 'Keine Bestellung 2026',
            items_bought: 0,
          }
        }
      })
    }

    // Verkäufe aggregieren
    salesList.forEach((s) => {
      const custNo = s.customer_number
      if (custNo && map[custNo]) {
        map[custNo].total_revenue += s.total_amount || 0
        map[custNo].orders_count += 1
        map[custNo].last_order_date = s.created_at ? s.created_at.substring(0, 10) : new Date().toISOString().slice(0, 10)
        map[custNo].items_bought += (s.items || []).reduce((sum: number, i: any) => sum + (i.qty || 1), 0)
      } else if (custNo) {
        // Falls neuer Kunde nicht im Stamm war
        map[custNo] = {
          customer_number: custNo,
          company_name: s.customer_name || `Kunde #${custNo}`,
          city: 'Unbekannt',
          agent: s.driver_name || 'Fahrer',
          total_revenue: s.total_amount || 0,
          orders_count: 1,
          last_order_date: s.created_at ? s.created_at.substring(0, 10) : new Date().toISOString().slice(0, 10),
          items_bought: (s.items || []).reduce((sum: number, i: any) => sum + (i.qty || 1), 0),
        }
      }
    })

    return Object.values(map)
  }, [salesList])

  // 2. Top-Kunden (nach Umsatz)
  const topCustomers = useMemo(() => {
    return [...customerStats].sort((a, b) => b.total_revenue - a.total_revenue)
  }, [customerStats])

  const bestCustomer = topCustomers[0]

  // 3. Städte-Auswertung (Umsatz & Kunden pro Stadt)
  const cityStats = useMemo(() => {
    const cityMap: Record<string, { city: string; customerCount: number; totalRevenue: number; ordersCount: number }> = {}

    customerStats.forEach((c) => {
      const cityName = c.city || 'Unbekannt'
      if (!cityMap[cityName]) {
        cityMap[cityName] = { city: cityName, customerCount: 0, totalRevenue: 0, ordersCount: 0 }
      }
      cityMap[cityName].customerCount += 1
      cityMap[cityName].totalRevenue += c.total_revenue
      cityMap[cityName].ordersCount += c.orders_count
    })

    return Object.values(cityMap).sort((a, b) => b.totalRevenue - a.totalRevenue || b.customerCount - a.customerCount)
  }, [customerStats])

  const topCity = cityStats[0]

  // 4. Inaktive Kunden / Churn-Risiko (Kunden ohne Bestellung 2026)
  const inactiveCustomers = useMemo(() => {
    return customerStats.filter((c) => c.orders_count === 0)
  }, [customerStats])

  // 5. Durchschnittlicher Bestellwert (AOV)
  const totalRevenueAll = useMemo(() => salesList.reduce((s, x) => s + (x.total_amount || 0), 0), [salesList])
  const averageOrderValue = salesList.length > 0 ? totalRevenueAll / salesList.length : 0

  // Filtered List for Search
  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return topCustomers
    const q = searchQuery.toLowerCase()
    return topCustomers.filter(
      (c) =>
        c.company_name.toLowerCase().includes(q) ||
        c.customer_number.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q) ||
        c.agent.toLowerCase().includes(q)
    )
  }, [topCustomers, searchQuery])

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-surface-50 flex items-center gap-2">
          <Users className="w-6 h-6 text-brand-400" />
          Kunden-Analysen & Intelligenz 2026
        </h1>
        <p className="text-surface-400 text-sm mt-1">
          Echtzeit-Auswertung von {MOCK_CUSTOMERS.length} gewerblichen Kunden nach Umsatz, Regionen & Kaufverhalten
        </p>
      </div>

      {/* KPI HIGHLIGHT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Top Kunde */}
        <div className="glass-card p-4 border border-brand-500/30 bg-brand-950/20 shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-brand-400 uppercase tracking-wider">Umsatzkönig 2026</span>
            <div className="w-8 h-8 rounded-lg bg-brand-900/60 text-brand-400 flex items-center justify-center border border-brand-700/40">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-lg font-bold text-surface-50 truncate">{bestCustomer?.company_name || '—'}</p>
            <p className="text-xs text-surface-400 font-mono">
              Kd.-Nr. {bestCustomer?.customer_number} · {bestCustomer?.city}
            </p>
          </div>
          <div className="pt-2 border-t border-surface-800/60 flex justify-between items-center text-xs">
            <span className="text-surface-400">Gesamtumsatz</span>
            <span className="font-bold text-emerald-400 tabular-nums">{formatCurrency(bestCustomer?.total_revenue || 0)}</span>
          </div>
        </div>

        {/* Stärkste Stadt */}
        <div className="glass-card p-4 border border-emerald-500/30 bg-emerald-950/20 shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Top Region / Stadt</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-900/60 text-emerald-400 flex items-center justify-center border border-emerald-700/40">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-lg font-bold text-surface-50 truncate">{topCity?.city || '—'}</p>
            <p className="text-xs text-surface-400 font-mono">{topCity?.customerCount || 0} gewerbliche Kunden</p>
          </div>
          <div className="pt-2 border-t border-surface-800/60 flex justify-between items-center text-xs">
            <span className="text-surface-400">Regional-Umsatz</span>
            <span className="font-bold text-emerald-400 tabular-nums">{formatCurrency(topCity?.totalRevenue || 0)}</span>
          </div>
        </div>

        {/* Ø Bestellwert (AOV) */}
        <div className="glass-card p-4 border border-amber-500/30 bg-amber-950/20 shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Ø Bestellwert (AOV)</span>
            <div className="w-8 h-8 rounded-lg bg-amber-900/60 text-amber-400 flex items-center justify-center border border-amber-700/40">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-xl font-bold text-surface-50 tabular-nums">{formatCurrency(averageOrderValue)}</p>
            <p className="text-xs text-surface-400 font-mono">Pro Fakturierung</p>
          </div>
          <div className="pt-2 border-t border-surface-800/60 flex justify-between items-center text-xs">
            <span className="text-surface-400">Erfasste Aufträge</span>
            <span className="font-bold text-surface-100 tabular-nums">{salesList.length} Verkäufe</span>
          </div>
        </div>

        {/* Rückhol-Kandidaten */}
        <div className="glass-card p-4 border border-rose-500/30 bg-rose-950/20 shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">Rückhol-Potenzial</span>
            <div className="w-8 h-8 rounded-lg bg-rose-900/60 text-rose-400 flex items-center justify-center border border-rose-700/40">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-xl font-bold text-rose-400 tabular-nums">{inactiveCustomers.length} Kunden</p>
            <p className="text-xs text-surface-400 font-mono">Ohne Kauf 2026</p>
          </div>
          <div className="pt-2 border-t border-surface-800/60 flex justify-between items-center text-xs">
            <span className="text-surface-400">Reaktivierungs-Quote</span>
            <span className="font-bold text-surface-100 tabular-nums">
              {Math.round(((customerStats.length - inactiveCustomers.length) / (customerStats.length || 1)) * 100)}% aktiv
            </span>
          </div>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-surface-800 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-brand-500 text-white shadow-glow'
              : 'bg-surface-900 text-surface-400 hover:text-surface-100 hover:bg-surface-800'
          }`}
        >
          🏆 Kunden-Ranking & Gesamtübersicht
        </button>
        <button
          onClick={() => setActiveTab('cities')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'cities'
              ? 'bg-brand-500 text-white shadow-glow'
              : 'bg-surface-900 text-surface-400 hover:text-surface-100 hover:bg-surface-800'
          }`}
        >
          🏙️ Städte-Ranking ({cityStats.length} Städte)
        </button>
        <button
          onClick={() => setActiveTab('churn_risk')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'churn_risk'
              ? 'bg-rose-500 text-white shadow-glow'
              : 'bg-surface-900 text-surface-400 hover:text-surface-100 hover:bg-surface-800'
          }`}
        >
          ⚠️ Schläfer & Rückhol-Kandidaten ({inactiveCustomers.length})
        </button>
      </div>

      {/* TAB CONTENT: STÄDTE RANKING */}
      {activeTab === 'cities' && (
        <div className="glass-card p-5 border border-surface-700/50 shadow-lg space-y-4">
          <h2 className="font-semibold text-surface-100 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-400" />
            Städte-Ranking & Regionale Kundenverteilung
          </h2>
          <div className="space-y-4">
            {cityStats.map((city, idx) => {
              const maxCityRevenue = cityStats[0]?.totalRevenue || 1
              const barWidth = Math.max(4, (city.totalRevenue / maxCityRevenue) * 100)
              return (
                <div key={city.city} className="p-3 rounded-xl bg-surface-900/60 border border-surface-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-surface-800 text-brand-400 border border-surface-700 flex items-center justify-center text-xs font-bold">
                        #{idx + 1}
                      </span>
                      <div>
                        <span className="font-bold text-surface-50 text-sm">{city.city}</span>
                        <span className="text-xs text-surface-400 ml-2">({city.customerCount} Kunden)</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-emerald-400 tabular-nums">
                        {formatCurrency(city.totalRevenue)}
                      </span>
                      <span className="text-[10px] text-surface-500 block font-mono">
                        {city.ordersCount} Verkäufe
                      </span>
                    </div>
                  </div>
                  {/* Visual Bar */}
                  <div className="h-2 bg-surface-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-brand rounded-full transition-all duration-500"
                      style={{ width: city.totalRevenue > 0 ? `${barWidth}%` : '5%' }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* TAB CONTENT: CHURN / SCHLÄFER */}
      {activeTab === 'churn_risk' && (
        <div className="glass-card p-5 border border-rose-500/30 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-surface-100 flex items-center gap-2 text-rose-400">
                <AlertCircle className="w-5 h-5" />
                Inaktive Kunden / Rückhol-Aktionen ({inactiveCustomers.length})
              </h2>
              <p className="text-xs text-surface-400 mt-0.5">
                Kunden aus der Kundenkartei, die 2026 noch keine Bestellung getätigt haben.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-surface-800 bg-surface-950/80 text-surface-400 font-semibold text-xs uppercase tracking-wider">
                  <th className="px-4 py-3">Kd.-Nr.</th>
                  <th className="px-4 py-3">Firmenname</th>
                  <th className="px-4 py-3">Stadt</th>
                  <th className="px-4 py-3">Zuständiger Fahrer</th>
                  <th className="px-4 py-3 text-right">Aktion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-800/40">
                {inactiveCustomers.slice(0, 25).map((c) => (
                  <tr key={c.customer_number} className="hover:bg-rose-950/10 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-brand-400 text-xs">{c.customer_number}</td>
                    <td className="px-4 py-3 font-medium text-surface-100">{c.company_name}</td>
                    <td className="px-4 py-3 text-xs text-surface-300">{c.city}</td>
                    <td className="px-4 py-3 text-xs text-surface-400">{c.agent}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-400 bg-rose-950/60 border border-rose-800/50 px-2.5 py-1 rounded-lg">
                        <Clock className="w-3 h-3" /> Schläfer
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: OVERVIEW & TOP CUSTOMERS */}
      {(activeTab === 'overview' || activeTab === 'top_customers') && (
        <div className="glass-card p-5 border border-surface-700/50 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="font-semibold text-surface-100 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-brand-400" />
              Kundenliste & Umsatz-Ranking 2026
            </h2>
            {/* Search Input */}
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Kd.-Nr., Name oder Ort suchen..."
                className="input pl-9 py-1.5 text-xs bg-surface-800/60 w-full"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-surface-800/80 bg-surface-950/60 text-surface-400 font-semibold text-xs uppercase tracking-wider">
                  <th className="px-4 py-3">Rang</th>
                  <th className="px-4 py-3">Kd.-Nr.</th>
                  <th className="px-4 py-3">Kunde / Firma</th>
                  <th className="px-4 py-3">Ort</th>
                  <th className="px-4 py-3">Fahrer / Touren</th>
                  <th className="px-4 py-3 text-center">Fakturen</th>
                  <th className="px-4 py-3 text-right">Umsatz 2026</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-800/40">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-surface-500 text-sm">
                      Keine Kunden gefunden.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((c, idx) => {
                    const hasSales = c.total_revenue > 0
                    return (
                      <tr
                        key={c.customer_number}
                        onClick={() => setSelectedCustomer(c)}
                        className="hover:bg-brand-900/30 cursor-pointer transition-colors group"
                      >
                        <td className="px-4 py-3 text-xs font-bold text-surface-500">
                          {idx + 1 <= 3 ? (
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              idx === 0 ? 'bg-amber-400 text-black shadow-glow' :
                              idx === 1 ? 'bg-slate-300 text-black' : 'bg-amber-700 text-white'
                            }`}>
                              {idx + 1}
                            </span>
                          ) : (
                            `#${idx + 1}`
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs font-bold text-brand-400 bg-brand-950/60 px-2 py-0.5 rounded border border-brand-800/40 group-hover:border-brand-500/80">
                            {c.customer_number}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-surface-100 group-hover:text-brand-300 flex items-center gap-2">
                          {c.company_name}
                          <Eye className="w-3.5 h-3.5 text-surface-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </td>
                        <td className="px-4 py-3 text-xs text-surface-300">
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                            {c.city}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-surface-400">
                          {c.agent}
                        </td>
                        <td className="px-4 py-3 text-center text-xs font-bold tabular-nums">
                          {c.orders_count > 0 ? (
                            <span className="text-emerald-400">{c.orders_count} Verkäufe</span>
                          ) : (
                            <span className="text-surface-600">0</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-bold tabular-nums">
                          {hasSales ? (
                            <span className="text-emerald-400 text-sm font-black">{formatCurrency(c.total_revenue)}</span>
                          ) : (
                            <span className="text-surface-600 text-xs">0,00 €</span>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <CustomerDetailModal
          customer={selectedCustomer}
          sales={salesList}
          onClose={() => setSelectedCustomer(null)}
        />
      )}
    </div>
  )
}

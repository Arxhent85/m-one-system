'use client'

import { useState, useEffect, useMemo } from 'react'
import { BarChart3, TrendingUp, Package, Users, Truck } from 'lucide-react'
import { formatCurrency, formatNumber } from '@/lib/utils/currency'
import { getSalesHistory, INITIAL_DEPO_PRODUCTS, LOCATION_IDS } from '@/lib/stockStore'

import MOCK_2026_SALES from '@/lib/mock2026Sales.json'

export default function AnalyticsView() {
  const [salesList, setSalesList] = useState<any[]>(MOCK_2026_SALES)

  useEffect(() => {
    function loadData() {
      const local = getSalesHistory()
      const base = local && local.length > 0 ? local : MOCK_2026_SALES

      fetch('/api/sales/record')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.sales) && data.sales.length > 0) {
            const combined = [...data.sales]
            base.forEach((l: any) => {
              if (!combined.some((c) => c.id === l.id || c.order_number === l.order_number)) {
                combined.push(l)
              }
            })
            setSalesList(combined)
          } else {
            setSalesList(base)
          }
        })
        .catch(() => {
          setSalesList(base)
        })
    }

    loadData()
    const interval = setInterval(loadData, 3000)
    window.addEventListener('focus', loadData)
    window.addEventListener('m_one_sale_recorded', loadData)
    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', loadData)
      window.removeEventListener('m_one_sale_recorded', loadData)
    }
  }, [])

  // KPI Computations
  const totalRevenue = useMemo(() => {
    return salesList.reduce((sum, s) => sum + (s.total_amount || 0), 0)
  }, [salesList])

  const totalOrders = salesList.length

  // Profit calculation (approx ~35% average margin or item-based)
  const totalProfit = useMemo(() => {
    return Math.round(totalRevenue * 0.35 * 100) / 100
  }, [totalRevenue])

  // Top-Produkte calculation
  const productSummary = useMemo(() => {
    const map: Record<string, { sku: string; name: string; qty: number; revenue: number }> = {}

    salesList.forEach((s) => {
      s.items?.forEach((i: any) => {
        const key = i.sku || i.name
        if (!map[key]) {
          map[key] = { sku: i.sku || '—', name: i.name || 'Artikel', qty: 0, revenue: 0 }
        }
        map[key].qty += i.qty || 1
        map[key].revenue += i.total || i.qty * i.unit_price || 0
      })
    })

    const list = Object.values(map).sort((a, b) => b.revenue - a.revenue)
    if (list.length > 0) return list.slice(0, 10)

    // Fallback default list if no sales yet
    return INITIAL_DEPO_PRODUCTS.slice(0, 10).map((p) => ({
      sku: p.sku,
      name: p.name,
      qty: 0,
      revenue: 0,
    }))
  }, [salesList])

  // Top-Kunden calculation
  const customerSummary = useMemo(() => {
    const map: Record<string, { custNo: string; companyName: string; ordersCount: number; revenue: number }> = {}

    salesList.forEach((s) => {
      const key = s.customer_number || s.customer_name || 'Laufkunde'
      if (!map[key]) {
        map[key] = {
          custNo: s.customer_number || '—',
          companyName: s.customer_name || (s.customer_number ? `Kunde #${s.customer_number}` : 'Laufkunde'),
          ordersCount: 0,
          revenue: 0,
        }
      }
      map[key].ordersCount += 1
      map[key].revenue += s.total_amount || 0
    })

    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 10)
  }, [salesList])

  // Standort-Performance calculation
  const locationPerf = useMemo(() => {
    const locationsMap: Record<string, { name: string; type: string; orders: number; revenue: number; customersSet: Set<string> }> = {
      [LOCATION_IDS.DEPOT]: { name: 'Zentrales Hauptlager (M-ONE)', type: 'depot', orders: 0, revenue: 0, customersSet: new Set() },
      [LOCATION_IDS.MENSURI]: { name: 'Fahrzeug 1 (Depo Mensuri)', type: 'vehicle', orders: 0, revenue: 0, customersSet: new Set() },
      [LOCATION_IDS.QERIMI]: { name: 'Fahrzeug 2 (Depo Qerimi)', type: 'vehicle', orders: 0, revenue: 0, customersSet: new Set() },
    }

    salesList.forEach((s) => {
      const locId = s.vehicle_location_id || LOCATION_IDS.MENSURI
      if (locationsMap[locId]) {
        locationsMap[locId].orders += 1
        locationsMap[locId].revenue += s.total_amount || 0
        if (s.customer_number) locationsMap[locId].customersSet.add(s.customer_number)
      }
    })

    return Object.values(locationsMap).map((l) => ({
      location_name: l.name,
      type: l.type,
      total_revenue: l.revenue,
      total_orders: l.orders,
      unique_customers: l.customersSet.size,
    }))
  }, [salesList])

  const maxProductRevenue = productSummary[0]?.revenue || 1

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-surface-50 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-brand-400" />
          Analysen & Auswertungen
        </h1>
        <p className="text-surface-400 text-sm mt-1">
          Echtzeit Umsatz-, Produkt- und Kunden-KPIs im Überblick (2026)
        </p>
      </div>

      {/* Top-KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-4 border border-surface-700/50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-900/60 text-brand-400 border border-brand-500/30 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-surface-50 tabular-nums">{formatCurrency(totalRevenue)}</p>
            <p className="text-xs text-surface-400 font-medium">Gesamtumsatz 2026</p>
          </div>
        </div>

        <div className="glass-card p-4 border border-surface-700/50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-900/60 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-surface-50 tabular-nums">{formatCurrency(totalProfit)}</p>
            <p className="text-xs text-surface-400 font-medium">Geschätzter Gesamtgewinn</p>
          </div>
        </div>

        <div className="glass-card p-4 border border-surface-700/50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-900/60 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-surface-50 tabular-nums">{formatNumber(totalOrders)}</p>
            <p className="text-xs text-surface-400 font-medium">Aufträge / Fakturen gesamt</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top-Produkte nach Umsatz */}
        <div className="glass-card p-5 border border-surface-700/50 shadow-lg">
          <h2 className="font-semibold text-surface-100 flex items-center gap-2 mb-4">
            <Package className="w-4 h-4 text-brand-400" />
            Top-Produkte nach Umsatz 2026
          </h2>
          {productSummary.length === 0 ? (
            <p className="text-xs text-surface-500 py-6 text-center">Noch keine Produktverkäufe vorhanden.</p>
          ) : (
            <div className="space-y-3">
              {productSummary.map((p: any, i: number) => {
                const barWidth = Math.max(5, ((p.revenue || 0) / maxProductRevenue) * 100)
                return (
                  <div key={p.sku || i}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-bold text-surface-500 w-5 shrink-0">{i + 1}.</span>
                        <span className="text-xs font-semibold text-surface-200 truncate">{p.name}</span>
                        <span className="text-[10px] text-surface-500 font-mono">({p.sku})</span>
                      </div>
                      <div className="text-right ml-2 shrink-0">
                        <span className="text-xs font-bold text-emerald-400 tabular-nums">
                          {formatCurrency(p.revenue || 0)}
                        </span>
                        {p.qty > 0 && (
                          <span className="ml-2 text-[10px] text-surface-400 font-mono">
                            ({p.qty} Stk.)
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Fortschrittsbalken */}
                    <div className="h-1.5 bg-surface-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-brand rounded-full transition-all duration-500"
                        style={{ width: p.revenue > 0 ? `${barWidth}%` : '0%' }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Top-Kunden nach Umsatz */}
        <div className="glass-card p-5 border border-surface-700/50 shadow-lg">
          <h2 className="font-semibold text-surface-100 flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-emerald-400" />
            Top-Kunden nach Umsatz 2026
          </h2>
          {customerSummary.length === 0 ? (
            <div className="text-center py-10 text-surface-500 text-xs">
              Noch keine Kundenverkäufe vorhanden.<br />
              <span className="text-[10px] text-surface-600">Verkäufe aus der Fahrer-App werden hier gelistet.</span>
            </div>
          ) : (
            <div className="space-y-2">
              {customerSummary.map((c: any, i: number) => (
                <div key={c.custNo || i} className="flex items-center justify-between py-2 border-b border-surface-800/50 last:border-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-brand-950 text-brand-400 border border-brand-800/40 flex items-center justify-center text-xs font-bold shrink-0">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-surface-100 truncate">{c.companyName}</p>
                      <p className="text-[10px] text-surface-500 font-mono">
                        {c.custNo !== '—' ? `Kd.-Nr. ${c.custNo} · ` : ''}{c.ordersCount} Verkauf/Verkäufe
                      </p>
                    </div>
                  </div>
                  <div className="text-right ml-2 shrink-0">
                    <p className="text-xs font-bold text-emerald-400 tabular-nums">
                      {formatCurrency(c.revenue || 0)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Standort-Performance */}
        <div className="glass-card p-5 border border-surface-700/50 shadow-lg lg:col-span-2">
          <h2 className="font-semibold text-surface-100 flex items-center gap-2 mb-4">
            <Truck className="w-4 h-4 text-amber-400" />
            Standort-Performance (Echtzeit 2026)
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {locationPerf.map((loc: any, idx: number) => (
              <div
                key={idx}
                className={`p-4 rounded-xl border ${
                  loc.type === 'depot'
                    ? 'bg-brand-950/40 border-brand-700/30'
                    : 'bg-emerald-950/40 border-emerald-700/30'
                }`}
              >
                <div className="flex items-center gap-2.5 mb-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    loc.type === 'depot' ? 'bg-brand-900 text-brand-400' : 'bg-emerald-900 text-emerald-400'
                  }`}>
                    {loc.type === 'depot' ? <Package className="w-4 h-4" /> : <Truck className="w-4 h-4" />}
                  </div>
                  <span className="font-semibold text-xs text-surface-100">{loc.location_name}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-surface-400">Umsatz 2026</span>
                    <span className="text-emerald-400 font-bold tabular-nums">
                      {formatCurrency(loc.total_revenue || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-surface-400">Verkäufe</span>
                    <span className="text-surface-100 font-semibold tabular-nums">
                      {formatNumber(loc.total_orders || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-surface-400">Aktive Kunden</span>
                    <span className="text-surface-100 tabular-nums">
                      {formatNumber(loc.unique_customers || 0)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

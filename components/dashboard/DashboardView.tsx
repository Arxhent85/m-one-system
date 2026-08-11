'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  ShoppingCart, TrendingUp, Warehouse, AlertTriangle,
  Package, Users, ArrowUpRight, Truck, CheckCircle2
} from 'lucide-react'
import { formatCurrency, formatNumber } from '@/lib/utils/currency'
import { getSalesHistory, getStockMap, INITIAL_DEPO_PRODUCTS, LOCATION_IDS } from '@/lib/stockStore'

interface Order {
  id: string
  order_number: string
  created_at: string
  total_amount: number
  payment_method?: string
  status?: string
  customers?: {
    company_name: string
    customer_number?: string
  }
  locations?: {
    name: string
  }
}

interface DashboardViewProps {
  initialOrders: Order[]
  locations: any[]
}

export default function DashboardView({ initialOrders, locations }: DashboardViewProps) {
  const [localSales, setLocalSales] = useState<Order[]>([])
  const [stockMap, setStockMap] = useState<Record<string, Record<string, number>>>({})

  useEffect(() => {
    function loadData() {
      const history = getSalesHistory()
      const localMapped: Order[] = history.map((s) => ({
        id: s.id,
        order_number: s.order_number,
        created_at: s.created_at,
        total_amount: s.total_amount,
        payment_method: s.payment_method,
        status: 'confirmed',
        customers: {
          company_name: s.customer_name,
          customer_number: s.customer_number,
        },
        locations: {
          name: s.vehicle_location_name,
        },
      }))

      fetch('/api/sales/record')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.sales)) {
            const serverMapped: Order[] = data.sales.map((s: any) => ({
              id: s.id,
              order_number: s.order_number,
              created_at: s.created_at,
              total_amount: s.total_amount,
              payment_method: s.payment_method,
              status: 'confirmed',
              customers: {
                company_name: s.customer_name,
                customer_number: s.customer_number,
              },
              locations: {
                name: s.vehicle_location_name,
              },
            }))

            // Merge local and server sales (deduplicate)
            const combined = [...serverMapped]
            localMapped.forEach((l) => {
              if (!combined.some((c) => c.id === l.id || c.order_number === l.order_number)) {
                combined.push(l)
              }
            })
            setLocalSales(combined)
          } else {
            setLocalSales(localMapped)
          }
          if (data.stockMap) setStockMap(data.stockMap)
        })
        .catch(() => {
          setLocalSales(localMapped)
          setStockMap(getStockMap())
        })
    }

    loadData()
    const interval = setInterval(loadData, 3000)
    window.addEventListener('focus', loadData)
    window.addEventListener('m_one_sale_recorded', loadData)
    window.addEventListener('m_one_stock_changed', loadData)
    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', loadData)
      window.removeEventListener('m_one_sale_recorded', loadData)
      window.removeEventListener('m_one_stock_changed', loadData)
    }
  }, [])

  // Combine server orders + local sales
  const allOrders = useMemo(() => {
    const combined = [...localSales]
    for (const o of initialOrders) {
      if (!combined.some((c) => c.id === o.id || c.order_number === o.order_number)) {
        combined.push(o)
      }
    }
    return combined
  }, [initialOrders, localSales])

  const totalRevenue = useMemo(() => allOrders.reduce((s, o) => s + (o.total_amount ?? 0), 0), [allOrders])
  const totalOrderCount = allOrders.length
  const recentOrders = useMemo(() => allOrders.slice(0, 8), [allOrders])

  // Compute Top Products from sales history & stock
  const topProducts = useMemo(() => {
    const history = getSalesHistory()
    const productStats: Record<string, { sku: string; name: string; qty: number; revenue: number }> = {}

    history.forEach((s) => {
      s.items?.forEach((i) => {
        if (!productStats[i.sku]) {
          productStats[i.sku] = { sku: i.sku, name: i.name, qty: 0, revenue: 0 }
        }
        productStats[i.sku].qty += i.qty
        productStats[i.sku].revenue += i.total
      })
    })

    const list = Object.values(productStats).sort((a, b) => b.revenue - a.revenue)
    if (list.length > 0) return list.slice(0, 5)

    // Default fallback to initial depo products with sample stats
    return INITIAL_DEPO_PRODUCTS.slice(0, 5).map((p) => ({
      sku: p.sku,
      name: p.name,
      qty: 0,
      revenue: 0,
    }))
  }, [localSales])

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-surface-50 flex items-center gap-2">
          <LayoutDashboardIcon className="w-6 h-6 text-brand-400" />
          M ONE ERP — Regiezentrum 2026
        </h1>
        <p className="text-surface-400 text-sm mt-1">
          Echtzeit-Überblick · {formatNumber(totalOrderCount)} Verkäufe in 2026 · {locations.length} Standorte
        </p>
      </div>

      {/* ---- KPI CARDS ---- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Gesamtumsatz 2026"
          value={formatCurrency(totalRevenue)}
          icon={<TrendingUp className="w-5 h-5" />}
          trend="2026 YTD"
          trendUp={true}
          color="brand"
        />
        <KpiCard
          label="Erfasste Verkäufe"
          value={formatNumber(totalOrderCount)}
          icon={<ShoppingCart className="w-5 h-5" />}
          color="success"
        />
        <KpiCard
          label="Lager-Standorte"
          value={`${locations.length} Standorte`}
          icon={<Warehouse className="w-5 h-5" />}
          color="neutral"
        />
        <KpiCard
          label="Kundenkartei"
          value="798 Kunden"
          icon={<Users className="w-5 h-5" />}
          color="brand"
        />
      </div>

      {/* ---- HAUPTINHALT: 2 Spalten ---- */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Letzte Aufträge (2/3 Breite) */}
        <div className="lg:col-span-2 glass-card p-5 border border-surface-700/50 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-surface-100 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-brand-400" />
              Letzte erfasste Verkäufe (2026)
            </h2>
            <a href="/orders" className="text-xs text-brand-400 hover:text-brand-300 font-medium">
              Alle {formatNumber(totalOrderCount)} Rechnungen →
            </a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-surface-800/80 bg-surface-950/60 text-surface-400 font-semibold text-xs uppercase tracking-wider">
                  <th className="px-4 py-2.5">Rechnung</th>
                  <th className="px-4 py-2.5">Kunde</th>
                  <th className="px-4 py-2.5">Standort / Fahrzeug</th>
                  <th className="px-4 py-2.5 text-right">Betrag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-800/40">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-surface-500 text-sm">
                      <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-20" />
                      Noch keine Verkäufe erfasst.<br />
                      <span className="text-xs text-surface-600">Verkäufe erscheinen hier sobald Fahrer Aufträge buchen.</span>
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((order: any, idx: number) => {
                    const custName = order.customers?.company_name ?? 'Laufkunde'
                    const custNo = order.customers?.customer_number ?? ''
                    const locName = order.locations?.name ?? 'Depo Qerimi'
                    const dateStr = order.created_at ? order.created_at.substring(0, 10) : new Date().toISOString().slice(0, 10)

                    return (
                      <tr key={order.id ?? idx} className="hover:bg-brand-900/10 transition-colors">
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs font-bold text-brand-400 block">
                            {order.order_number || `FK-2026-${idx + 1}`}
                          </span>
                          <span className="text-[10px] text-surface-500">{dateStr}</span>
                        </td>
                        <td className="px-4 py-3 font-medium text-surface-100">
                          {custNo ? <span className="font-mono text-xs text-surface-400 mr-1.5">[{custNo}]</span> : null}
                          {custName}
                        </td>
                        <td className="px-4 py-3 text-xs text-surface-400">
                          <span className="inline-flex items-center gap-1">
                            <Truck className="w-3 h-3 text-emerald-400 shrink-0" />
                            {locName}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-emerald-400 tabular-nums">
                          {formatCurrency(order.total_amount ?? 0)}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Rechte Spalte: Top-Produkte 2026 & Standorte */}
        <div className="space-y-4">
          
          {/* Top-Produkte nach Umsatz 2026 */}
          <div className="glass-card p-5 border border-surface-700/50 shadow-lg">
            <h2 className="font-semibold text-surface-100 flex items-center gap-2 mb-3">
              <Package className="w-4 h-4 text-brand-400" />
              Top 2026 Produkte
            </h2>
            <div className="space-y-3">
              {topProducts.map((p: any, i: number) => (
                <div key={p.sku ?? i} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-brand-950 text-brand-400 border border-brand-800/40 flex items-center justify-center text-xs font-bold shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-surface-100 truncate">{p.name}</p>
                    <p className="text-[10px] text-surface-500 font-mono">
                      Art.-Nr. {p.sku} {p.qty > 0 ? `· ${formatNumber(p.qty)} Stk.` : ''}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-emerald-400 tabular-nums shrink-0">
                    {formatCurrency(p.revenue)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Standorte Übersicht */}
          <div className="glass-card p-5 border border-surface-700/50 shadow-lg">
            <h2 className="font-semibold text-surface-100 flex items-center gap-2 mb-3">
              <Warehouse className="w-4 h-4 text-emerald-400" />
              Aktive Standorte (3)
            </h2>
            <div className="space-y-2">
              {locations.map((loc: any) => {
                const isDepot = loc.type === 'depot'
                return (
                  <div key={loc.id} className="flex items-center justify-between p-2.5 rounded-lg bg-surface-900/60 border border-surface-800">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded flex items-center justify-center ${
                        isDepot ? 'bg-brand-900 text-brand-400' : 'bg-emerald-900 text-emerald-400'
                      }`}>
                        {isDepot ? <Warehouse className="w-3.5 h-3.5" /> : <Truck className="w-3.5 h-3.5" />}
                      </div>
                      <span className="text-xs font-semibold text-surface-100">{loc.name}</span>
                    </div>
                    <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded font-mono">
                      Aktiv
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

function LayoutDashboardIcon(props: any) {
  return (
    <svg className={props.className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  )
}

interface KpiCardProps {
  label: string
  value: string
  icon: React.ReactNode
  trend?: string
  trendUp?: boolean
  color?: 'brand' | 'success' | 'danger' | 'warning' | 'neutral'
}

function KpiCard({ label, value, icon, trend, trendUp, color = 'brand' }: KpiCardProps) {
  const iconColors = {
    brand: 'bg-brand-900/60 text-brand-400 border-brand-500/30',
    success: 'bg-success-900/60 text-success-500 border-success-500/30',
    danger: 'bg-danger-900/60 text-danger-500 border-danger-500/30',
    warning: 'bg-warning-900/60 text-warning-500 border-warning-500/30',
    neutral: 'bg-surface-800 text-surface-400 border-surface-700',
  }

  return (
    <div className="glass-card p-4 border border-surface-700/50 shadow-lg space-y-3">
      <div className="flex items-start justify-between">
        <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${iconColors[color]}`}>
          {icon}
        </div>
        {trend && (
          <span className="text-[11px] font-bold text-brand-400 bg-brand-950/80 px-2 py-0.5 rounded border border-brand-800/40">
            {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-surface-50 tabular-nums tracking-tight">{value}</p>
        <p className="text-xs text-surface-400 mt-0.5">{label}</p>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  ShoppingCart, TrendingUp, Warehouse, AlertTriangle,
  Package, Users, ArrowUpRight, Truck, CheckCircle2, Eye, User
} from 'lucide-react'
import { formatCurrency, formatNumber } from '@/lib/utils/currency'
import { getSalesHistory, getStockMap, INITIAL_DEPO_PRODUCTS, LOCATION_IDS } from '@/lib/stockStore'
import InvoiceDetailModal from '@/components/orders/InvoiceDetailModal'
import CustomerDetailModal from '@/components/analytics/CustomerDetailModal'
import ProductDetailModal from '@/components/analytics/ProductDetailModal'

import MOCK_2026_SALES from '@/lib/mock2026Sales.json'

interface Order {
  id: string
  order_number: string
  created_at: string
  total_amount: number
  payment_method?: string
  status?: string
  customer_number?: string
  customer_name?: string
  vehicle_location_name?: string
  driver_name?: string
  items?: any[]
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

function mapSaleToOrder(s: any): Order {
  return {
    id: s.id,
    order_number: s.order_number,
    created_at: s.created_at,
    total_amount: s.total_amount,
    payment_method: s.payment_method,
    status: 'confirmed',
    customer_number: s.customer_number ?? s.customers?.customer_number,
    customer_name: s.customer_name ?? s.customers?.company_name,
    vehicle_location_name: s.vehicle_location_name ?? s.locations?.name,
    driver_name: s.driver_name,
    items: s.items ?? [],
    customers: {
      company_name: s.customer_name ?? s.customers?.company_name ?? 'Laufkunde',
      customer_number: s.customer_number ?? s.customers?.customer_number,
    },
    locations: {
      name: s.vehicle_location_name ?? s.locations?.name ?? 'Depo Qerimi',
    },
  }
}

export default function DashboardView({ initialOrders, locations }: DashboardViewProps) {
  const [localSales, setLocalSales] = useState<Order[]>([])
  const [stockMap, setStockMap] = useState<Record<string, Record<string, number>>>({})
  const [isReloading, setIsReloading] = useState(false)

  // Modal State
  const [selectedInvoice, setSelectedInvoice] = useState<Order | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null)

  async function handleLoad2026() {
    setIsReloading(true)
    try {
      const res = await fetch('/api/sales/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'load_2026_demo' }),
      })
      const data = await res.json()
      if (data.success && Array.isArray(data.sales)) {
        setLocalSales(data.sales.map(mapSaleToOrder))
      }
      if (typeof window !== 'undefined') {
        localStorage.removeItem('m_one_sales_cleared')
        localStorage.setItem('m_one_sales_history_v1', JSON.stringify(MOCK_2026_SALES))
        window.dispatchEvent(new Event('m_one_stock_changed'))
        window.dispatchEvent(new Event('m_one_sale_recorded'))
      }
    } catch (e) {
      console.warn('Reload 2026 error:', e)
    } finally {
      setTimeout(() => setIsReloading(false), 2000)
    }
  }

  useEffect(() => {
    function loadData() {
      fetch('/api/sales/record')
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            if (data.isCleared || (Array.isArray(data.sales) && data.sales.length === 0)) {
              setLocalSales([])
            } else if (Array.isArray(data.sales) && data.sales.length > 0) {
              setLocalSales(data.sales.map(mapSaleToOrder))
            }
          }
          setStockMap(getStockMap())
        })
        .catch(() => {
          const local = getSalesHistory()
          setLocalSales(local.map(mapSaleToOrder))
          setStockMap(getStockMap())
        })
    }

    loadData()
    window.addEventListener('focus', loadData)
    window.addEventListener('m_one_sale_recorded', loadData)
    window.addEventListener('m_one_stock_changed', loadData)
    return () => {
      window.removeEventListener('focus', loadData)
      window.removeEventListener('m_one_sale_recorded', loadData)
      window.removeEventListener('m_one_stock_changed', loadData)
    }
  }, [])

  // Authoritative sales from central store
  const allOrders = useMemo(() => {
    return localSales
  }, [localSales])

  const totalRevenue = useMemo(() => allOrders.reduce((s, o) => s + (o.total_amount ?? 0), 0), [allOrders])
  const totalOrderCount = allOrders.length
  const recentOrders = useMemo(() => allOrders.slice(0, 10), [allOrders])


  // Top-Produkte calculation
  const topProducts = useMemo(() => {
    const map: Record<string, { sku: string; name: string; qty: number; revenue: number }> = {}

    allOrders.forEach((order) => {
      (order.items ?? []).forEach((item: any) => {
        if (!item.sku) return
        if (!map[item.sku]) {
          map[item.sku] = { sku: item.sku, name: item.name || item.sku, qty: 0, revenue: 0 }
        }
        map[item.sku].qty += item.qty || 0
        map[item.sku].revenue += item.total || (item.qty || 0) * (item.unit_price || 0)
      })
    })

    const list = Object.values(map).sort((a, b) => b.revenue - a.revenue)
    if (list.length > 0) return list.slice(0, 5)

    return INITIAL_DEPO_PRODUCTS.slice(0, 5).map((p) => ({
      sku: p.sku,
      name: p.name,
      qty: 0,
      revenue: 0,
    }))
  }, [allOrders])

  function openCustomer(order: Order) {
    const custNo = order.customer_number || order.customers?.customer_number || ''
    const custName = order.customer_name || order.customers?.company_name || 'Laufkunde'
    if (!custNo && custName === 'Laufkunde') return

    const custOrders = allOrders.filter(
      (s) => (custNo && s.customer_number === custNo) || s.customer_name === custName
    )
    const totalRev = custOrders.reduce((s, o) => s + (o.total_amount ?? 0), 0)
    const totalItems = custOrders.reduce((s, o) => s + (o.items ?? []).reduce((iq: number, it: any) => iq + (it.qty ?? 0), 0), 0)
    const lastDate = custOrders[0]?.created_at ?? ''

    setSelectedCustomer({
      customer_number: custNo,
      company_name: custName,
      city: '',
      agent: order.driver_name ?? '',
      total_revenue: totalRev,
      orders_count: custOrders.length,
      last_order_date: lastDate,
      items_bought: totalItems,
    })
  }

  function openProduct(prod: any) {
    if (!prod?.sku) return
    const productOrders = allOrders.filter((s) =>
      (s.items ?? []).some((i: any) => i.sku === prod.sku)
    )
    const totalQty = productOrders.reduce((s, o) => {
      const it = (o.items ?? []).find((i: any) => i.sku === prod.sku)
      return s + (it?.qty ?? 0)
    }, 0)
    const totalRev = productOrders.reduce((s, o) => {
      const it = (o.items ?? []).find((i: any) => i.sku === prod.sku)
      return s + (it?.total ?? (it?.qty ?? 0) * (it?.unit_price ?? 0))
    }, 0)

    setSelectedProduct({
      sku: prod.sku,
      name: prod.name,
      total_qty_sold: totalQty || prod.qty,
      total_revenue: totalRev || prod.revenue,
      orders_count: productOrders.length,
    })
  }

  return (
    <div className="space-y-6">

      {/* Modals */}
      {selectedInvoice && (
        <InvoiceDetailModal invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} />
      )}
      {selectedCustomer && (
        <CustomerDetailModal
          customer={selectedCustomer}
          sales={allOrders.map((o) => ({
            ...o,
            customer_number: o.customer_number ?? o.customers?.customer_number,
            customer_name: o.customer_name ?? o.customers?.company_name,
            vehicle_location_name: o.vehicle_location_name ?? o.locations?.name,
          }))}
          onClose={() => setSelectedCustomer(null)}
        />
      )}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          sales={allOrders.map((o) => ({
            ...o,
            customer_number: o.customer_number ?? o.customers?.customer_number,
            customer_name: o.customer_name ?? o.customers?.company_name,
            vehicle_location_name: o.vehicle_location_name ?? o.locations?.name,
          }))}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      {/* 2026 Data Load Banner */}
      <div className="glass-card p-4 border border-emerald-500/30 bg-emerald-950/20 flex flex-wrap items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-900/50 border border-emerald-700/50 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-surface-100 text-sm flex items-center gap-2">
              Verkaufsdatenbasis 2026 (2026 Sells)
              <span className="text-[11px] bg-emerald-900/80 text-emerald-300 px-2 py-0.5 rounded border border-emerald-700/60 font-mono font-bold">
                2.187 Fakturen · 296.929 € · 85.264 Stk.
              </span>
            </h3>
            <p className="text-xs text-surface-400">
              Vollständige Jahreserfassung 2026 (2026 Sells.xlsx)
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLoad2026}
          className="btn-primary py-2 px-4 text-xs font-bold flex items-center gap-2 shadow-glow active:scale-95 transition-all"
        >
          {isReloading ? (
            <>
              <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
              2026 Daten geladen!
            </>
          ) : (
            <>
              📥 2026 Datenbasis laden
            </>
          )}
        </button>
      </div>

      {/* Hero Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Gesamtumsatz 2026 */}
        <div className="glass-card p-5 border border-surface-700/50 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-brand-950 text-brand-400 border border-brand-800/40 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold text-brand-400 bg-brand-950 px-2 py-0.5 rounded-full border border-brand-800/40">
              2026 YTD
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-surface-50 tabular-nums">
              {formatCurrency(totalRevenue)}
            </h3>
            <p className="text-xs text-surface-400 mt-1 font-medium">Gesamtumsatz 2026</p>
          </div>
        </div>

        {/* KPI 2: Erfasste Verkäufe */}
        <div className="glass-card p-5 border border-surface-700/50 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800/40 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-surface-50 tabular-nums">
              {formatNumber(totalOrderCount)}
            </h3>
            <p className="text-xs text-surface-400 mt-1 font-medium">Erfasste Verkäufe</p>
          </div>
        </div>

        {/* KPI 3: Standorte */}
        <div className="glass-card p-5 border border-surface-700/50">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-surface-800 text-surface-300 border border-surface-700 flex items-center justify-center">
              <Warehouse className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-surface-50 tabular-nums">3 Standorte</h3>
            <p className="text-xs text-surface-400 mt-1 font-medium">Lager-Standorte</p>
          </div>
        </div>

        {/* KPI 4: Kundenkartei */}
        <div className="glass-card p-5 border border-surface-700/50">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-amber-950 text-amber-400 border border-amber-800/40 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-surface-50 tabular-nums">798 Kunden</h3>
            <p className="text-xs text-surface-400 mt-1 font-medium">Kundenkartei</p>
          </div>
        </div>

      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Linke 2 Spalten: Letzte erfasste Verkäufe */}
        <div className="lg:col-span-2 glass-card p-5 border border-surface-700/50 shadow-lg space-y-4">
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
                  <th className="px-3 py-2.5 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-800/40">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-surface-500 text-sm">
                      <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-20" />
                      Noch keine Verkäufe erfasst.<br />
                      <span className="text-xs text-surface-600">Verkäufe erscheinen hier sobald Fahrer Aufträge buchen.</span>
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((order: Order, idx: number) => {
                    const custName = order.customer_name || order.customers?.company_name || 'Laufkunde'
                    const custNo = order.customer_number || order.customers?.customer_number || ''
                    const locName = order.vehicle_location_name || order.locations?.name || 'Depo Qerimi'
                    const dateStr = order.created_at ? order.created_at.substring(0, 10) : new Date().toISOString().slice(0, 10)
                    const hasCust = !!(custNo || custName !== 'Laufkunde')

                    return (
                      <tr key={order.id ?? idx} className="hover:bg-brand-900/10 transition-colors group cursor-pointer" onClick={() => setSelectedInvoice(order)}>
                        <td className="px-4 py-3">
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedInvoice(order) }}
                            className="font-mono text-xs font-bold text-brand-400 hover:text-brand-300 hover:underline flex items-center gap-1"
                          >
                            {order.order_number || `FK-2026-${idx + 1}`}
                            <Eye className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                          <span className="text-[10px] text-surface-500">{dateStr}</span>
                        </td>
                        <td className="px-4 py-3 font-medium text-surface-100">
                          {custNo && <span className="font-mono text-xs text-surface-400 mr-1.5">[{custNo}]</span>}
                          {hasCust ? (
                            <button
                              onClick={(e) => { e.stopPropagation(); openCustomer(order) }}
                              className="font-semibold text-surface-100 hover:text-brand-300 hover:underline transition-colors inline-flex items-center gap-1"
                            >
                              {custName}
                              <User className="w-3 h-3 text-brand-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                          ) : (
                            <span className="text-surface-400">{custName}</span>
                          )}
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
                        <td className="px-3 py-3 text-center">
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedInvoice(order) }}
                            className="w-7 h-7 rounded-lg text-surface-500 hover:text-brand-300 hover:bg-brand-900/40 flex items-center justify-center transition-colors"
                            title="Rechnungs-Details anzeigen"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
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
                <div
                  key={p.sku ?? i}
                  onClick={() => openProduct(p)}
                  className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-surface-800/50 cursor-pointer transition-colors group"
                  title="Produkt-Analyse öffnen"
                >
                  <span className="w-6 h-6 rounded-full bg-brand-950 text-brand-400 border border-brand-800/40 flex items-center justify-center text-xs font-bold shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-surface-200 group-hover:text-brand-300 transition-colors truncate">
                      {p.name}
                    </p>
                    <p className="text-[10px] font-mono text-surface-500">
                      Art.-Nr. {p.sku} {p.qty > 0 && `· ${p.qty.toLocaleString('de-DE')} Stk.`}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-emerald-400 tabular-nums shrink-0">
                    {formatCurrency(p.revenue)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Aktive Standorte */}
          <div className="glass-card p-5 border border-surface-700/50 shadow-lg space-y-3">
            <h2 className="font-semibold text-surface-100 flex items-center gap-2">
              <Truck className="w-4 h-4 text-emerald-400" />
              Aktive Standorte (3)
            </h2>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-900/60 border border-surface-700/40">
                <div className="flex items-center gap-2">
                  <Warehouse className="w-4 h-4 text-brand-400 shrink-0" />
                  <span className="font-medium text-surface-200">Hauptlager Depot (M-ONE)</span>
                </div>
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800/40">
                  Aktiv
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-900/60 border border-surface-700/40">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-medium text-surface-200">Fahrzeug 1 (Depo Mensuri)</span>
                </div>
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800/40">
                  Aktiv
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-900/60 border border-surface-700/40">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-medium text-surface-200">Fahrzeug 2 (Depo Qerimi)</span>
                </div>
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800/40">
                  Aktiv
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  )
}

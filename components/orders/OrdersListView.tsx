'use client'

import { useState, useMemo, useEffect } from 'react'
import { ShoppingCart, Search, Truck, Eye, User, Package, MapPin, ExternalLink } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/currency'
import { getSalesHistory } from '@/lib/stockStore'
import MOCK_2026_SALES from '@/lib/mock2026Sales.json'
import InvoiceDetailModal from './InvoiceDetailModal'
import CustomerDetailModal from '@/components/analytics/CustomerDetailModal'
import ProductDetailModal from '@/components/analytics/ProductDetailModal'

interface Order {
  id: string
  order_number: string
  created_at: string
  total_amount: number
  payment_method?: string
  customer_number?: string
  customer_name?: string
  vehicle_location_name?: string
  driver_name?: string
  latitude?: number
  longitude?: number
  gps_accuracy?: number
  google_maps_url?: string
  items?: any[]
  customers?: { company_name: string; customer_number?: string }
  locations?: { name: string }
}

interface OrdersListViewProps {
  orders: Order[]
}

function toRichOrder(s: any): Order {
  return {
    id: s.id,
    order_number: s.order_number,
    created_at: s.created_at,
    total_amount: s.total_amount,
    payment_method: s.payment_method,
    customer_number: s.customer_number ?? s.customers?.customer_number,
    customer_name: s.customer_name ?? s.customers?.company_name,
    vehicle_location_name: s.vehicle_location_name ?? s.locations?.name,
    driver_name: s.driver_name,
    latitude: s.latitude,
    longitude: s.longitude,
    gps_accuracy: s.gps_accuracy,
    google_maps_url: s.google_maps_url,
    items: s.items ?? [],
  }
}

export default function OrdersListView({ orders: initialOrders }: OrdersListViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [driverFilter, setDriverFilter] = useState('all')
  const [allSales, setAllSales] = useState<Order[]>(() => (MOCK_2026_SALES as any[]).map(toRichOrder))
  const [isReloading, setIsReloading] = useState(false)

  // Modals
  const [selectedInvoice, setSelectedInvoice] = useState<Order | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null)

  async function handleLoad2026() {
    setIsReloading(true)
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
      setAllSales((MOCK_2026_SALES as any[]).map(toRichOrder))
    } catch (e) {
      console.warn('Reload 2026 error:', e)
    } finally {
      setTimeout(() => setIsReloading(false), 2000)
    }
  }

  useEffect(() => {
    function loadSales() {
      const isCleared = typeof window !== 'undefined' && localStorage.getItem('m_one_sales_cleared') === 'true'
      if (isCleared) {
        setAllSales([])
        return
      }
      const base = (() => {
        const local = getSalesHistory()
        return local && local.length > 0 ? local : (MOCK_2026_SALES as any[])
      })()
      const baseMapped: Order[] = base.map(toRichOrder)

      fetch('/api/sales/record')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.sales) && data.sales.length > 0) {
            const serverMapped: Order[] = data.sales.map(toRichOrder)
            const combined = [...serverMapped]
            baseMapped.forEach((l) => {
              if (!combined.some((c) => c.id === l.id || c.order_number === l.order_number)) {
                combined.push(l)
              }
            })
            setAllSales(combined)
          } else {
            setAllSales(baseMapped)
          }
        })
        .catch(() => setAllSales(baseMapped))
    }

    loadSales()
    window.addEventListener('m_one_sale_recorded', loadSales)
    return () => window.removeEventListener('m_one_sale_recorded', loadSales)
  }, [])

  const filteredOrders = useMemo(() => {
    return allSales.filter((o) => {
      // Driver filter
      if (driverFilter !== 'all') {
        const matchesDriver =
          (o.driver_name ?? '').toLowerCase().includes(driverFilter.toLowerCase()) ||
          (o.vehicle_location_name ?? '').toLowerCase().includes(driverFilter.toLowerCase())
        if (!matchesDriver) return false
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchNo = (o.order_number ?? '').toLowerCase().includes(q)
        const matchCust = (o.customer_name ?? '').toLowerCase().includes(q)
        const matchCustNo = (o.customer_number ?? '').toLowerCase().includes(q)
        const matchItems = (o.items ?? []).some(
          (i) =>
            (i.name ?? '').toLowerCase().includes(q) ||
            (i.sku ?? '').toLowerCase().includes(q)
        )
        if (!matchNo && !matchCust && !matchCustNo && !matchItems) return false
      }

      return true
    })
  }, [allSales, driverFilter, searchQuery])

  const totalVolume = useMemo(() => {
    return filteredOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0)
  }, [filteredOrders])

  function openInvoice(order: Order) {
    setSelectedInvoice(order)
  }

  function openCustomer(order: Order) {
    const custNo = order.customer_number ?? '—'
    const custName = order.customer_name ?? 'Laufkunde'
    const custOrders = allSales.filter(
      (s) =>
        s.customer_number === custNo ||
        s.customer_name === custName
    )
    const totalRev = custOrders.reduce((s, o) => s + (o.total_amount || 0), 0)
    const totalItems = custOrders.reduce(
      (s, o) => s + (o.items ?? []).reduce((is: number, i: any) => is + (i.qty || 0), 0),
      0
    )
    const lastDate = custOrders[0]?.created_at ?? new Date().toISOString()

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

  function openProduct(item: any) {
    if (!item?.sku) return
    const productOrders = allSales.filter((s) =>
      (s.items ?? []).some((i: any) => i.sku === item.sku)
    )
    const totalQty = productOrders.reduce((s, o) => {
      const it = (o.items ?? []).find((i: any) => i.sku === item.sku)
      return s + (it?.qty ?? 0)
    }, 0)
    const totalRev = productOrders.reduce((s, o) => {
      const it = (o.items ?? []).find((i: any) => i.sku === item.sku)
      return s + (it?.total ?? (it?.qty ?? 0) * (it?.unit_price ?? 0))
    }, 0)
    setSelectedProduct({
      sku: item.sku,
      name: item.name,
      total_qty_sold: totalQty,
      total_revenue: totalRev,
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
          sales={allSales.map((o) => ({
            ...o,
            customer_number: o.customer_number,
            customer_name: o.customer_name,
            vehicle_location_name: o.vehicle_location_name,
          }))}
          onClose={() => setSelectedCustomer(null)}
        />
      )}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          sales={allSales.map((o) => ({
            ...o,
            customer_number: o.customer_number,
            customer_name: o.customer_name,
            vehicle_location_name: o.vehicle_location_name,
          }))}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      {/* Top Banner / Quick Action to Load 2026 Dataset */}
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
              Vollständige Erfassung Januar bis August 2026 (2026 Sells.xlsx)
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

      {/* Controls */}
      <div className="glass-card p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex-1 min-w-[280px]">
            <label className="text-[11px] font-semibold text-surface-400 uppercase tracking-wider block mb-1">
              Faktura NR., Kunde, Artikel suchen
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="FK-2026-xxxx, Kundenname, Art.-Nr..."
                className="input pl-9 py-2 bg-surface-900 border-surface-700 text-surface-100 placeholder:text-surface-500 w-full"
              />
            </div>
          </div>
          <div className="w-56">
            <label className="text-[11px] font-semibold text-surface-400 uppercase tracking-wider block mb-1">
              Fahrzeug / Fahrer
            </label>
            <select
              value={driverFilter}
              onChange={(e) => setDriverFilter(e.target.value)}
              className="input py-2 bg-surface-900 border-surface-700 text-surface-100 w-full"
            >
              <option value="all">Alle Fahrzeuge</option>
              <option value="Mensuri">Depo Mensuri</option>
              <option value="Qerimi">Depo Qerimi</option>
              <option value="Hauptlager">Hauptlager</option>
            </select>
          </div>
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-surface-800/60 text-xs text-surface-400">
          <div>
            Angezeigt: <span className="text-surface-100 font-semibold">{filteredOrders.length.toLocaleString('de-DE')} Verkäufe</span>
          </div>
          <div>
            Umsatzvolumen (2026): <span className="text-emerald-400 font-bold tabular-nums">{formatCurrency(totalVolume)}</span>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="glass-card overflow-hidden border border-surface-700/50 shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-surface-800/80 bg-surface-950/60 text-surface-400 font-semibold text-xs uppercase tracking-wider">
                <th className="px-4 py-3 w-12 text-center">#</th>
                <th className="px-4 py-3 w-36">Faktura NR.</th>
                <th className="px-4 py-3 w-28">Datum</th>
                <th className="px-4 py-3">Kunde</th>
                <th className="px-4 py-3">Artikel (Top)</th>
                <th className="px-4 py-3 w-44">Fahrzeug / Tour</th>
                <th className="px-4 py-3 text-right w-36">Gesamtbetrag</th>
                <th className="px-4 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-800/40">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-surface-500">
                    Keine Verkäufe gefunden.
                  </td>
                </tr>
              ) : (
                filteredOrders.slice(0, 200).map((o, idx) => {
                  const custName = o.customer_name ?? 'Laufkunde'
                  const custNo = o.customer_number ?? ''
                  const locName = o.vehicle_location_name ?? '—'
                  const dateStr = o.created_at ? o.created_at.substring(0, 10) : '—'
                  const topItems = (o.items ?? []).slice(0, 2)
                  const rowBg = idx % 2 === 0 ? 'bg-surface-900/10' : 'bg-surface-900/40'
                  const hasCustomer = !!(custNo || custName !== 'Laufkunde')

                  return (
                    <tr key={o.id ?? idx} className={`${rowBg} hover:bg-brand-900/10 transition-colors`}>
                      <td className="px-4 py-2.5 text-center text-surface-500 text-xs font-mono">
                        {idx + 1}
                      </td>
                      {/* Clickable Invoice Number */}
                      <td className="px-4 py-2.5">
                        <button
                          onClick={() => setSelectedInvoice(o)}
                          className="font-mono text-sm font-bold text-brand-400 hover:text-brand-300 hover:underline transition-colors flex items-center gap-1 group"
                          title="Rechnung öffnen"
                        >
                          {o.order_number}
                          <Eye className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-surface-300 font-mono">
                        {dateStr}
                      </td>
                      {/* Clickable Customer Name */}
                      <td className="px-4 py-2.5">
                        {custNo && <span className="font-mono text-xs text-surface-500 mr-1.5">[{custNo}]</span>}
                        {hasCustomer ? (
                          <button
                            onClick={() => openCustomer(o)}
                            className="font-semibold text-surface-100 hover:text-brand-300 hover:underline transition-colors inline-flex items-center gap-1 group"
                            title="Kundendetails öffnen"
                          >
                            {custName}
                            <User className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-brand-400" />
                          </button>
                        ) : (
                          <span className="text-surface-400">{custName}</span>
                        )}
                      </td>
                      {/* Clickable Top Items */}
                      <td className="px-4 py-2.5">
                        <div className="flex flex-wrap gap-1">
                          {topItems.length === 0 ? (
                            <span className="text-surface-600 text-xs">—</span>
                          ) : (
                            topItems.map((item: any, ii: number) => (
                              <button
                                key={ii}
                                onClick={() => openProduct(item)}
                                className="inline-flex items-center gap-1 text-[11px] bg-surface-800/60 hover:bg-brand-900/60 border border-surface-700/40 hover:border-brand-700/60 text-surface-300 hover:text-brand-300 px-2 py-0.5 rounded-full font-mono transition-colors group"
                                title={"Produkt: " + item.name}
                              >
                                <Package className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100" />
                                {item.sku}
                                <span className="text-surface-500 group-hover:text-brand-400">x{item.qty}</span>
                              </button>
                            ))
                          )}
                          {(o.items ?? []).length > 2 && (
                            <button
                              onClick={() => setSelectedInvoice(o)}
                              className="text-[11px] text-surface-500 hover:text-brand-400 px-1.5 py-0.5 transition-colors"
                            >
                              +{(o.items ?? []).length - 2} mehr
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-surface-400">
                        <span className="inline-flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          {locName}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right font-bold text-emerald-400 tabular-nums">
                        {formatCurrency(o.total_amount)}
                      </td>
                      {/* Quick open button */}
                      <td className="px-2 py-2.5">
                        <button
                          onClick={() => setSelectedInvoice(o)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-surface-500 hover:text-brand-300 hover:bg-brand-900/40 transition-colors"
                          title="Details anzeigen"
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
        <div className="px-4 py-3 border-t border-surface-800/60 bg-surface-950/80 flex items-center justify-between text-xs text-surface-400">
          <p>
            Gesamt 2026: <strong className="text-surface-100 font-bold">{allSales.length.toLocaleString('de-DE')} Fakturen</strong>
          </p>
          <p>
            Zeige {Math.min(filteredOrders.length, 200)} von {filteredOrders.length} Rechnungen
          </p>
        </div>
      </div>
    </div>
  )
}

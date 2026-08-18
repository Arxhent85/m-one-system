'use client'

import { useState } from 'react'
import { X, Package, MapPin, Users, TrendingUp, Calendar, Edit3, Save, CheckCircle2, Truck, BarChart2 } from 'lucide-react'
import { formatCurrency, formatNumber } from '@/lib/utils/currency'
import { getCustomPricesMap, saveCustomPricesMap } from '@/lib/stockStore'

interface ProductDetailModalProps {
  product: {
    sku: string
    name: string
    unit?: string
    purchase_price?: number
    selling_price?: number
    stock?: number
  } | null
  sales: any[]
  onClose: () => void
}

export default function ProductDetailModal({ product, sales, onClose }: ProductDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState(product?.name || '')
  const [editedPrice, setEditedPrice] = useState<number | string>(
    product?.selling_price !== undefined ? product.selling_price : 0
  )
  const [saveSuccess, setSaveSuccess] = useState(false)

  if (!product) return null

  const currentPrice = typeof editedPrice === 'number' ? editedPrice : parseFloat(String(editedPrice).replace(',', '.')) || 0

  async function handleSavePrice() {
    if (!product) return
    const customMap = getCustomPricesMap()
    customMap[product.sku] = currentPrice
    saveCustomPricesMap(customMap)

    try {
      await fetch('/api/products/prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prices: { [product.sku]: currentPrice } }),
      })
    } catch (e) {
      console.warn('Server price save warning:', e)
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('m_one_products_changed'))
      window.dispatchEvent(new Event('m_one_stock_changed'))
    }

    setSaveSuccess(true)
    setIsEditing(false)
    setTimeout(() => setSaveSuccess(false), 3000)
  }

  // Collect all matching sales for this product
  const matchingSales: any[] = []
  const customerMap: Record<string, { custNo: string; name: string; city: string; qty: number; total: number; lastDate: string }> = {}
  const cityMap: Record<string, { city: string; qty: number; total: number }> = {}

  // Trend analysis by month (2026-01 to 2026-12)
  const monthlyVolume: Record<string, number> = {
    '01': 0, '02': 0, '03': 0, '04': 0, '05': 0, '06': 0, '07': 0, '08': 0
  }

  let totalQtySold = 0
  let totalRevenue = 0

  sales.forEach((s) => {
    const matchedItem = (s.items || []).find((i: any) => i.sku === product.sku || i.name === product.name)
    if (matchedItem) {
      matchingSales.push({
        ...s,
        matchedItem,
      })

      const qty = matchedItem.qty || 1
      const lineTotal = matchedItem.total || qty * (matchedItem.unit_price || currentPrice || 0)

      totalQtySold += qty
      totalRevenue += lineTotal

      // Monthly Trend
      const createdStr = s.created_at || ''
      const monthMatch = createdStr.match(/-(\d{2})-/)
      if (monthMatch && monthlyVolume[monthMatch[1]] !== undefined) {
        monthlyVolume[monthMatch[1]] += qty
      } else {
        monthlyVolume['08'] += qty
      }

      // Customer stats
      const custNo = s.customer_number || s.customer_name || 'Laufkunde'
      if (!customerMap[custNo]) {
        customerMap[custNo] = {
          custNo: s.customer_number || '—',
          name: s.customer_name || `Kunde #${custNo}`,
          city: 'Unbekannt',
          qty: 0,
          total: 0,
          lastDate: s.created_at ? s.created_at.substring(0, 10) : new Date().toISOString().slice(0, 10),
        }
      }
      customerMap[custNo].qty += qty
      customerMap[custNo].total += lineTotal
      customerMap[custNo].lastDate = s.created_at ? s.created_at.substring(0, 10) : new Date().toISOString().slice(0, 10)

      // City stats
      const city = s.city || customerMap[custNo].city || 'Unbekannt'
      if (!cityMap[city]) {
        cityMap[city] = { city, qty: 0, total: 0 }
      }
      cityMap[city].qty += qty
      cityMap[city].total += lineTotal
    }
  })

  const topCustomers = Object.values(customerMap).sort((a, b) => b.qty - a.qty)
  const topCities = Object.values(cityMap).sort((a, b) => b.qty - a.qty)

  const bestCustomer = topCustomers[0]
  const bestCity = topCities[0]

  const monthLabels = [
    { key: '01', name: 'Jan' },
    { key: '02', name: 'Feb' },
    { key: '03', name: 'Mär' },
    { key: '04', name: 'Apr' },
    { key: '05', name: 'Mai' },
    { key: '06', name: 'Jun' },
    { key: '07', name: 'Jul' },
    { key: '08', name: 'Aug' },
  ]
  const maxMonthVal = Math.max(...Object.values(monthlyVolume), 1)

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col bg-surface-900 border border-surface-700 rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-surface-800 flex items-start justify-between bg-surface-950/80 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-black text-brand-400 bg-brand-950 border border-brand-800/60 px-3 py-1 rounded-xl">
                Art.-Nr. {product.sku}
              </span>
              {saveSuccess && (
                <span className="text-xs font-bold text-emerald-400 bg-emerald-950 border border-emerald-800 px-2.5 py-1 rounded-xl flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Preis gespeichert!
                </span>
              )}
            </div>

            {isEditing ? (
              <div className="mt-2 space-y-2">
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="bg-surface-950 border border-surface-700 rounded-xl px-3 py-1.5 text-base font-bold text-surface-50 w-full focus:outline-none focus:border-brand-500"
                  placeholder="Produktbezeichnung..."
                />
                <div className="flex items-center gap-2">
                  <span className="text-xs text-surface-400 font-semibold">VK-Preis (€):</span>
                  <input
                    type="number"
                    step="0.05"
                    value={editedPrice}
                    onChange={(e) => setEditedPrice(e.target.value)}
                    className="bg-surface-950 border border-emerald-500/60 rounded-xl px-3 py-1 text-sm font-black text-emerald-400 font-mono w-32 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleSavePrice}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow-md active:scale-95 transition-all"
                  >
                    <Save className="w-3.5 h-3.5" /> Speichern
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 mt-1.5">
                <h2 className="text-xl font-black text-surface-50">{product.name}</h2>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="px-2.5 py-1 rounded-lg bg-surface-800 hover:bg-surface-700 text-surface-300 text-xs font-bold flex items-center gap-1 transition-all border border-surface-700"
                >
                  <Edit3 className="w-3.5 h-3.5 text-brand-400" /> Bearbeiten
                </button>
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-surface-400 hover:text-white hover:bg-surface-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-3">
            <div className="glass-card p-3 border border-surface-800 text-center">
              <p className="text-[11px] text-surface-400 font-medium">VK-Preis</p>
              <p className="text-lg font-black text-emerald-400 tabular-nums font-mono mt-0.5">
                {formatCurrency(currentPrice)}
              </p>
            </div>
            <div className="glass-card p-3 border border-surface-800 text-center">
              <p className="text-[11px] text-surface-400 font-medium">Verkaufte Menge</p>
              <p className="text-lg font-black text-brand-400 tabular-nums mt-0.5">
                {formatNumber(totalQtySold)} Stk.
              </p>
            </div>
            <div className="glass-card p-3 border border-surface-800 text-center">
              <p className="text-[11px] text-surface-400 font-medium">Gesamtumsatz</p>
              <p className="text-lg font-black text-emerald-400 tabular-nums mt-0.5">
                {formatCurrency(totalRevenue)}
              </p>
            </div>
            <div className="glass-card p-3 border border-surface-800 text-center">
              <p className="text-[11px] text-surface-400 font-medium">Lagerbestand</p>
              <p className="text-lg font-black text-surface-100 tabular-nums mt-0.5">
                {formatNumber(product.stock ?? 0)} Stk.
              </p>
            </div>
          </div>

          {/* VISUELLE UMSATZ-GRAFIK (VERKAUFS-TREND 2026) */}
          <div className="glass-card p-4 border border-surface-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-surface-300 uppercase tracking-wider flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-brand-400" />
                Verkaufs-Trend 2026 (Visuelle Auswertung nach Monaten)
              </h3>
              <span className="text-[11px] text-emerald-400 font-mono font-bold flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> Live-Analyse
              </span>
            </div>

            {/* Visual Bar Chart */}
            <div className="h-32 pt-4 pb-1 px-2 flex items-end justify-between gap-2 border-b border-surface-800 bg-surface-950/50 rounded-xl">
              {monthLabels.map((m) => {
                const qty = monthlyVolume[m.key] || 0
                const pct = Math.min(100, Math.max(8, Math.round((qty / maxMonthVal) * 100)))

                return (
                  <div key={m.key} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                    <span className="text-[10px] font-mono text-surface-400 font-bold group-hover:text-emerald-400 transition-colors">
                      {qty > 0 ? `${qty}` : '0'}
                    </span>
                    <div className="w-full max-w-[28px] bg-surface-800 rounded-t-md overflow-hidden flex items-end h-full">
                      <div
                        style={{ height: `${pct}%` }}
                        className={`w-full transition-all duration-500 rounded-t-md ${
                          qty > 0
                            ? 'bg-gradient-to-t from-brand-600 via-emerald-600 to-teal-400 group-hover:from-brand-500 group-hover:to-teal-300 shadow-glow'
                            : 'bg-surface-800'
                        }`}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-surface-500 font-bold uppercase">{m.name}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Insights Grid */}
          <div className="grid sm:grid-cols-2 gap-4">
            
            {/* Top Kunden-Abnehmer */}
            <div className="glass-card p-4 border border-brand-500/30 bg-brand-950/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-brand-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-4 h-4" /> Bester Abnehmer
                </span>
              </div>
              <div>
                <p className="text-base font-bold text-surface-50">{bestCustomer?.name || 'Noch keine Käufe'}</p>
                <p className="text-xs text-surface-400 font-mono">
                  {bestCustomer ? `Kd.-Nr. ${bestCustomer.custNo} · ${bestCustomer.qty} Stk. gekaufte Menge` : '—'}
                </p>
              </div>
              {bestCustomer && (
                <div className="pt-2 border-t border-surface-800/60 flex justify-between items-center text-xs">
                  <span className="text-surface-400">Gesamtbetrag</span>
                  <span className="font-bold text-emerald-400 tabular-nums">{formatCurrency(bestCustomer.total)}</span>
                </div>
              )}
            </div>

            {/* Top Stadt */}
            <div className="glass-card p-4 border border-emerald-500/30 bg-emerald-950/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" /> Stärkste Stadt für diesen Artikel
                </span>
              </div>
              <div>
                <p className="text-base font-bold text-surface-50">{bestCity?.city || 'Unbekannt'}</p>
                <p className="text-xs text-surface-400 font-mono">
                  {bestCity ? `${bestCity.qty} Stk. verkaufte Menge` : '—'}
                </p>
              </div>
              {bestCity && (
                <div className="pt-2 border-t border-surface-800/60 flex justify-between items-center text-xs">
                  <span className="text-surface-400">Regional-Umsatz</span>
                  <span className="font-bold text-emerald-400 tabular-nums">{formatCurrency(bestCity.total)}</span>
                </div>
              )}
            </div>

          </div>

          {/* Detailed Sales History: WHO bought it, WHEN & by WHICH DRIVER */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-surface-300 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              Verkaufs-Historie: Wer hat wann wie viel gekauft? ({matchingSales.length} Belege)
            </h3>
            {matchingSales.length === 0 ? (
              <div className="p-8 text-center glass-card border border-surface-800 text-xs text-surface-500">
                Noch keine Verkäufe für diesen Artikel erfasst.
              </div>
            ) : (
              <div className="space-y-2">
                {matchingSales.map((s) => {
                  const dateStr = s.created_at ? s.created_at.substring(0, 10) : '2026-05-28'
                  const timeStr = s.created_at ? s.created_at.substring(11, 16) : ''
                  const driverInfo = s.driver_name || s.vehicle_location_name || 'Fahrzeug'

                  return (
                    <div key={s.id} className="p-3.5 rounded-xl bg-surface-950/80 border border-surface-800 flex items-center justify-between text-xs space-y-1 sm:space-y-0 flex-wrap sm:flex-nowrap gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-brand-400 bg-brand-950 px-2 py-0.5 rounded border border-brand-800/60">
                            {s.order_number || s.id}
                          </span>
                          <span className="font-bold text-surface-50">{s.customer_name}</span>
                          <span className="text-surface-400 font-mono text-[11px]">(Kd.-Nr. {s.customer_number})</span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-surface-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-emerald-400" /> {dateStr} {timeStr && `um ${timeStr} Uhr`}
                          </span>
                          <span className="flex items-center gap-1 font-semibold text-amber-300">
                            <Truck className="w-3 h-3 text-amber-400" /> {driverInfo}
                          </span>
                        </div>
                      </div>

                      <div className="text-right font-mono shrink-0">
                        <p className="font-black text-brand-300 text-sm">
                          {s.matchedItem?.qty} Stk. × {formatCurrency(s.matchedItem?.unit_price || currentPrice)}
                        </p>
                        <p className="font-black text-emerald-400 text-sm mt-0.5">
                          = {formatCurrency((s.matchedItem?.qty || 1) * (s.matchedItem?.unit_price || currentPrice))}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-surface-800 bg-surface-950/80 flex items-center justify-between shrink-0 text-xs">
          <span className="text-surface-400 font-mono">Art.-Nr. {product.sku} · {formatCurrency(currentPrice)}</span>
          <button
            onClick={onClose}
            className="btn-secondary py-1.5 px-4 text-xs"
          >
            Schließen
          </button>
        </div>

      </div>
    </div>
  )
}

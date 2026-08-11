'use client'

import { X, Package, MapPin, Users, AlertTriangle, TrendingUp, Calendar, CheckCircle2, Clock } from 'lucide-react'
import { formatCurrency, formatNumber } from '@/lib/utils/currency'

interface ProductDetailModalProps {
  product: {
    sku: string
    name: string
    unit?: string
    purchase_price?: number
    selling_price?: number
  } | null
  sales: any[]
  onClose: () => void
}

export default function ProductDetailModal({ product, sales, onClose }: ProductDetailModalProps) {
  if (!product) return null

  // Collect all line items for this product across all sales
  const matchingSales: any[] = []
  const customerMap: Record<string, { custNo: string; name: string; city: string; qty: number; total: number; lastDate: string }> = {}
  const cityMap: Record<string, { city: string; qty: number; total: number }> = {}

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
      const lineTotal = matchedItem.total || qty * (matchedItem.unit_price || product.selling_price || 0)

      totalQtySold += qty
      totalRevenue += lineTotal

      // Customer stats for this product
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

      // City stats for this product
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-surface-900 border border-surface-700 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-surface-800 flex items-start justify-between bg-surface-950/60 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-black text-brand-400 bg-brand-950 border border-brand-800/60 px-3 py-1 rounded-xl">
                Art.-Nr. {product.sku}
              </span>
            </div>
            <h2 className="text-xl font-black text-surface-50 mt-1.5">{product.name}</h2>
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
          <div className="grid grid-cols-3 gap-3">
            <div className="glass-card p-3 border border-surface-800 text-center">
              <p className="text-xs text-surface-400">Verkaufte Stückzahl</p>
              <p className="text-lg font-black text-brand-400 tabular-nums mt-0.5">
                {formatNumber(totalQtySold)} Stk.
              </p>
            </div>
            <div className="glass-card p-3 border border-surface-800 text-center">
              <p className="text-xs text-surface-400">Erzielter Gesamtumsatz</p>
              <p className="text-lg font-black text-emerald-400 tabular-nums mt-0.5">
                {formatCurrency(totalRevenue)}
              </p>
            </div>
            <div className="glass-card p-3 border border-surface-800 text-center">
              <p className="text-xs text-surface-400">Erfasste Verkäufe</p>
              <p className="text-lg font-black text-surface-100 tabular-nums mt-0.5">
                {matchingSales.length} Fakturen
              </p>
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

          {/* Top Kunden Ranking for this Product */}
          {topCustomers.length > 0 && (
            <div className="glass-card p-4 border border-surface-800 space-y-3">
              <h3 className="text-xs font-bold text-surface-300 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-brand-400" />
                Kunden-Ranking für diesen Artikel ({topCustomers.length})
              </h3>
              <div className="space-y-2">
                {topCustomers.map((c, idx) => (
                  <div key={c.custNo || idx} className="flex items-center justify-between p-2.5 rounded-lg bg-surface-950/60 border border-surface-800 text-xs">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-brand-950 text-brand-400 border border-brand-800/40 flex items-center justify-center font-bold">
                        #{idx + 1}
                      </span>
                      <div>
                        <p className="font-bold text-surface-100">{c.name}</p>
                        <p className="text-[10px] text-surface-500 font-mono">Kd.-Nr. {c.custNo} · Letzter Kauf: {c.lastDate}</p>
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <span className="font-bold text-surface-100 mr-3">{c.qty} Stk.</span>
                      <span className="font-bold text-emerald-400">{formatCurrency(c.total)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Verkaufs-Historie Belege */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-surface-300 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              Verkaufsbelege & Fakturen ({matchingSales.length})
            </h3>
            {matchingSales.length === 0 ? (
              <div className="p-8 text-center glass-card border border-surface-800 text-xs text-surface-500">
                Noch keine Verkäufe für diesen Artikel erfasst.
              </div>
            ) : (
              <div className="space-y-2">
                {matchingSales.map((s) => (
                  <div key={s.id} className="p-3 rounded-xl bg-surface-950/60 border border-surface-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-mono font-bold text-brand-400 mr-2">{s.order_number || s.id}</span>
                      <span className="font-medium text-surface-100">{s.customer_name}</span>
                      <span className="text-surface-500 font-mono ml-2">({s.customer_number})</span>
                    </div>
                    <div className="text-right font-mono">
                      <span className="font-bold text-surface-200 mr-3">{s.matchedItem?.qty}x {formatCurrency(s.matchedItem?.unit_price || 0)}</span>
                      <span className="font-bold text-emerald-400">{formatCurrency((s.matchedItem?.qty || 1) * (s.matchedItem?.unit_price || 0))}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-surface-800 bg-surface-950/80 flex items-center justify-end shrink-0 text-xs">
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

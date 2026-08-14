'use client'

import { useState, useEffect } from 'react'
import { X, Truck, User, CreditCard, Package, ShoppingCart, CheckCircle2, Eye, ChevronRight, MapPin, Navigation, ExternalLink } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/currency'
import { getSalesHistory } from '@/lib/stockStore'
import CustomerDetailModal from '@/components/analytics/CustomerDetailModal'
import ProductDetailModal from '@/components/analytics/ProductDetailModal'
import MOCK_2026_SALES from '@/lib/mock2026Sales.json'

interface InvoiceItem {
  sku: string
  name: string
  qty: number
  unit_price: number
  total: number
}

interface InvoiceDetailModalProps {
  invoice: {
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
    items?: InvoiceItem[]
  } | null
  sales?: any[]
  onClose: () => void
}

const PAYMENT_LABELS: Record<string, string> = {
  rechnung: 'Rechnung (Kredit)',
  bar: 'Barzahlung',
  cash: 'Barzahlung',
  card: 'Kartenzahlung',
  karte: 'Kartenzahlung',
  invoice: 'Rechnung (Kredit)',
}

export default function InvoiceDetailModal({ invoice, sales: propSales, onClose }: InvoiceDetailModalProps) {
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null)
  const [salesList, setSalesList] = useState<any[]>(propSales || [])

  useEffect(() => {
    if (propSales && propSales.length > 0) {
      setSalesList(propSales)
      return
    }

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
        setSalesList(combined.length > 0 ? combined : MOCK_2026_SALES)
      })
      .catch(() => {
        setSalesList(local.length > 0 ? local : MOCK_2026_SALES)
      })
  }, [propSales])

  if (!invoice) return null

  const items: InvoiceItem[] = invoice.items ?? []
  const dateStr = invoice.created_at ? invoice.created_at.substring(0, 10) : 'unbekannt'
  const timeStr = invoice.created_at
    ? new Date(invoice.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
    : 'unbekannt'
  const paymentLabel = PAYMENT_LABELS[invoice.payment_method ?? ''] ?? (invoice.payment_method ?? 'unbekannt')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Modals for Nested Detail Views */}
      {selectedCustomer && (
        <CustomerDetailModal
          customer={selectedCustomer}
          sales={salesList}
          onClose={() => setSelectedCustomer(null)}
        />
      )}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          sales={salesList}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto glass-card border border-surface-700/60 shadow-2xl rounded-2xl">
        
        {/* Header */}
        <div className="sticky top-0 z-10 px-6 py-4 bg-surface-900/95 backdrop-blur border-b border-surface-700/50 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-900/60 border border-brand-700/40 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-brand-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-surface-50 font-mono tracking-wide">{invoice.order_number}</h2>
              <p className="text-xs text-surface-400">{dateStr} um {timeStr} Uhr</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-surface-800 hover:bg-surface-700 flex items-center justify-center text-surface-400 hover:text-surface-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info Grid */}
        <div className="px-6 pt-5 pb-4 grid grid-cols-2 gap-3">
          
          {/* CLICKABLE KUNDE CARD */}
          <div
            onClick={() =>
              setSelectedCustomer({
                customer_number: invoice.customer_number || '—',
                company_name: invoice.customer_name || 'Laufkunde',
                city: '—',
                agent: invoice.driver_name || invoice.vehicle_location_name || '—',
                total_revenue: invoice.total_amount || 0,
                orders_count: 1,
              })
            }
            className="bg-surface-800/50 hover:bg-brand-950/40 border border-surface-700/60 hover:border-brand-500/80 rounded-xl p-3.5 flex items-start justify-between gap-2 cursor-pointer group transition-all shadow-sm"
            title="Klicken für Kunden-Historie & Auswertung"
          >
            <div className="flex items-start gap-3 min-w-0">
              <User className="w-4 h-4 text-brand-400 mt-0.5 shrink-0 group-hover:scale-110 transition-transform" />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-[11px] text-surface-500 uppercase tracking-wider font-semibold">Kunde</p>
                  <span className="text-[10px] text-brand-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                    Historie <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
                {invoice.customer_number && (
                  <p className="text-[11px] font-mono font-bold text-brand-400 bg-brand-950 px-1.5 py-0.5 rounded border border-brand-800/40 inline-block my-0.5">
                    #{invoice.customer_number}
                  </p>
                )}
                <p className="text-surface-100 font-black text-sm group-hover:text-brand-300 transition-colors truncate">
                  {invoice.customer_name || 'Laufkunde'}
                </p>
              </div>
            </div>
            <Eye className="w-4 h-4 text-surface-500 group-hover:text-brand-400 transition-colors shrink-0 mt-1" />
          </div>

          {/* FAHRZEUG / TOUR */}
          <div className="bg-surface-800/40 border border-surface-700/40 rounded-xl p-3.5 flex items-start gap-3">
            <Truck className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-[11px] text-surface-500 uppercase tracking-wider font-semibold">Fahrzeug / Tour</p>
              {invoice.driver_name && <p className="text-[11px] font-mono text-amber-300 font-bold">{invoice.driver_name}</p>}
              <p className="text-surface-100 font-semibold text-sm mt-0.5">{invoice.vehicle_location_name || 'unbekannt'}</p>
            </div>
          </div>

          {/* ZAHLUNGSART */}
          <div className="bg-surface-800/40 border border-surface-700/40 rounded-xl p-3.5 flex items-start gap-3">
            <CreditCard className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-[11px] text-surface-500 uppercase tracking-wider font-semibold">Zahlungsart</p>
              <p className="text-surface-100 font-semibold text-sm mt-0.5">{paymentLabel}</p>
            </div>
          </div>

          {/* RECHNUNGSBETRAG */}
          <div className="bg-emerald-950/30 border border-emerald-700/40 rounded-xl p-3.5 flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-[11px] text-surface-500 uppercase tracking-wider font-semibold">Rechnungsbetrag</p>
              <p className="text-emerald-400 font-black text-lg tabular-nums mt-0.5">{formatCurrency(invoice.total_amount)}</p>
            </div>
          </div>

        </div>

        {/* GPS SCAN-STANDORT (FALLS VORHANDEN) */}
        {invoice.latitude && invoice.longitude && (
          <div className="mx-6 mb-5 p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 flex items-center justify-between gap-3 shadow-inner">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-900/60 flex items-center justify-center text-emerald-400 shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-200">Rechnung vor Ort gescannt</p>
                <p className="text-[11px] font-mono text-emerald-400">
                  GPS: {invoice.latitude.toFixed(5)}, {invoice.longitude.toFixed(5)} {invoice.gps_accuracy ? `(±${Math.round(invoice.gps_accuracy)}m)` : ''}
                </p>
              </div>
            </div>
            <a
              href={invoice.google_maps_url || `https://www.google.com/maps/search/?api=1&query=${invoice.latitude},${invoice.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary py-2 px-3 text-xs font-bold shrink-0 flex items-center gap-1.5 shadow-sm"
            >
              <Navigation className="w-3.5 h-3.5" />
              In Google Maps öffnen
              <ExternalLink className="w-3 h-3 text-white/70 ml-0.5" />
            </a>
          </div>
        )}

        {/* Positionen Table */}
        <div className="px-6 pb-6">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-surface-400" />
              <h3 className="text-sm font-semibold text-surface-300 uppercase tracking-wider">
                Positionen ({items.length} Artikel · {items.reduce((s, i) => s + (i.qty || 0), 0)} Stk. gesamt)
              </h3>
            </div>
            <span className="text-[11px] text-surface-500">Tippe auf ein Produkt für Verkaufs-Details</span>
          </div>

          {items.length === 0 ? (
            <div className="py-6 text-center text-surface-500 text-sm bg-surface-800/30 rounded-xl border border-surface-700/30">
              Keine Positionsdaten
            </div>
          ) : (
            <div className="rounded-xl overflow-hidden border border-surface-700/40">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-800/60 text-surface-400 text-xs uppercase tracking-wider">
                    <th className="px-3 py-2.5 text-center w-12">Pos.</th>
                    <th className="px-4 py-2.5 text-left w-24">Art.-Nr.</th>
                    <th className="px-4 py-2.5 text-left">Bezeichnung</th>
                    <th className="px-4 py-2.5 text-right w-16">Menge</th>
                    <th className="px-4 py-2.5 text-right w-24">VK-Preis</th>
                    <th className="px-4 py-2.5 text-right w-24">Betrag</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-800/40">
                  {items.map((item, i) => {
                    const lineTotal = item.total ?? (item.qty * item.unit_price)
                    return (
                      <tr
                        key={i}
                        onClick={() =>
                          setSelectedProduct({
                            sku: item.sku,
                            name: item.name,
                            selling_price: item.unit_price,
                          })
                        }
                        className="hover:bg-brand-900/40 cursor-pointer transition-colors group"
                        title="Klicken für Produkt-Infos & Auswertung"
                      >
                        <td className="px-3 py-2.5 text-center font-mono text-xs font-bold text-emerald-400">
                          Pos. {i + 1}
                        </td>
                        <td className="px-4 py-2.5 font-mono text-xs font-bold text-brand-400 bg-brand-950/40 rounded px-1.5 py-0.5 border border-brand-800/30 group-hover:border-brand-500/80 transition-colors">
                          {item.sku}
                        </td>
                        <td className="px-4 py-2.5 text-surface-100 font-semibold group-hover:text-brand-300 transition-colors flex items-center justify-between gap-2">
                          <span>{item.name}</span>
                          <Eye className="w-3.5 h-3.5 text-surface-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-surface-100 font-bold">
                          {item.qty}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-surface-300">
                          {item.unit_price > 0 ? formatCurrency(item.unit_price) : '---'}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums font-black text-emerald-400">
                          {formatCurrency(lineTotal)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-surface-800/80 border-t-2 border-surface-700/60">
                    <td colSpan={5} className="px-4 py-3 font-bold text-surface-200 text-sm uppercase tracking-wider">
                      Gesamtbetrag
                    </td>
                    <td className="px-4 py-3 text-right font-black text-emerald-400 text-base tabular-nums">
                      {formatCurrency(invoice.total_amount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

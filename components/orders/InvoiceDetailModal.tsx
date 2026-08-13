'use client'

import { X, Truck, User, CreditCard, Package, ShoppingCart, CheckCircle2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/currency'

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
    items?: InvoiceItem[]
  } | null
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

export default function InvoiceDetailModal({ invoice, onClose }: InvoiceDetailModalProps) {
  if (!invoice) return null

  const items: InvoiceItem[] = invoice.items ?? []
  const dateStr = invoice.created_at ? invoice.created_at.substring(0, 10) : 'unbekannt'
  const timeStr = invoice.created_at
    ? new Date(invoice.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
    : 'unbekannt'
  const paymentLabel = PAYMENT_LABELS[invoice.payment_method ?? ''] ?? (invoice.payment_method ?? 'unbekannt')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto glass-card border border-surface-700/60 shadow-2xl rounded-2xl">
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
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-surface-800 hover:bg-surface-700 flex items-center justify-center text-surface-400 hover:text-surface-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 pt-5 pb-4 grid grid-cols-2 gap-3">
          <div className="bg-surface-800/40 border border-surface-700/40 rounded-xl p-3 flex items-start gap-3">
            <User className="w-4 h-4 text-brand-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-[11px] text-surface-500 uppercase tracking-wider font-semibold">Kunde</p>
              {invoice.customer_number && <p className="text-[11px] font-mono text-surface-400">#{invoice.customer_number}</p>}
              <p className="text-surface-100 font-semibold text-sm mt-0.5">{invoice.customer_name || 'Laufkunde'}</p>
            </div>
          </div>
          <div className="bg-surface-800/40 border border-surface-700/40 rounded-xl p-3 flex items-start gap-3">
            <Truck className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-[11px] text-surface-500 uppercase tracking-wider font-semibold">Fahrzeug / Tour</p>
              {invoice.driver_name && <p className="text-[11px] font-mono text-surface-400">{invoice.driver_name}</p>}
              <p className="text-surface-100 font-semibold text-sm mt-0.5">{invoice.vehicle_location_name || 'unbekannt'}</p>
            </div>
          </div>
          <div className="bg-surface-800/40 border border-surface-700/40 rounded-xl p-3 flex items-start gap-3">
            <CreditCard className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-[11px] text-surface-500 uppercase tracking-wider font-semibold">Zahlungsart</p>
              <p className="text-surface-100 font-semibold text-sm mt-0.5">{paymentLabel}</p>
            </div>
          </div>
          <div className="bg-emerald-950/30 border border-emerald-700/40 rounded-xl p-3 flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-[11px] text-surface-500 uppercase tracking-wider font-semibold">Rechnungsbetrag</p>
              <p className="text-emerald-400 font-black text-lg tabular-nums mt-0.5">{formatCurrency(invoice.total_amount)}</p>
            </div>
          </div>
        </div>
        <div className="px-6 pb-6">
          <div className="flex items-center gap-2 mb-3">
            <Package className="w-4 h-4 text-surface-400" />
            <h3 className="text-sm font-semibold text-surface-300 uppercase tracking-wider">
              Positionen ({items.length} Artikel · {items.reduce((s, i) => s + (i.qty || 0), 0)} Stk. gesamt)
            </h3>
          </div>
          {items.length === 0 ? (
            <div className="py-6 text-center text-surface-500 text-sm bg-surface-800/30 rounded-xl border border-surface-700/30">Keine Positionsdaten</div>
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
                      <tr key={i} className={(i % 2 === 0 ? 'bg-surface-900/20 ' : 'bg-surface-900/40 ') + 'hover:bg-brand-900/20 transition-colors'}>
                        <td className="px-3 py-2.5 text-center font-mono text-xs font-bold text-emerald-400">Pos. {i + 1}</td>
                        <td className="px-4 py-2.5 font-mono text-xs font-bold text-brand-400">{item.sku}</td>
                        <td className="px-4 py-2.5 text-surface-100 font-medium">{item.name}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-surface-200 font-semibold">{item.qty}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-surface-300">{item.unit_price > 0 ? formatCurrency(item.unit_price) : '---'}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums font-bold text-emerald-400">{formatCurrency(lineTotal)}</td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-surface-800/80 border-t-2 border-surface-700/60">
                    <td colSpan={5} className="px-4 py-3 font-bold text-surface-200 text-sm uppercase tracking-wider">Gesamtbetrag</td>
                    <td className="px-4 py-3 text-right font-black text-emerald-400 text-base tabular-nums">{formatCurrency(invoice.total_amount)}</td>
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

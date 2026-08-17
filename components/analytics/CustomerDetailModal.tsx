'use client'

import { X, Calendar, MapPin, Truck, ShoppingCart, AlertTriangle, CheckCircle2, Clock, Package, Phone, Navigation, ExternalLink, Globe } from 'lucide-react'
import { formatCurrency, formatNumber } from '@/lib/utils/currency'
import { getCustomerGpsMap, type CustomerGpsInfo } from '@/lib/stockStore'
import { KOSOVO_CITIES_GEO, CITY_ALIASES } from '@/components/customers/KosovoCustomerMap'
import MOCK_CUSTOMERS from '@/lib/mockCustomers.json'

interface CustomerDetailModalProps {
  customer: {
    customer_number: string
    company_name: string
    city?: string
    agent?: string
    total_revenue: number
    orders_count: number
    last_order_date: string
    items_bought: number
    notes?: string
  } | null
  sales: any[]
  onClose: () => void
}

export default function CustomerDetailModal({ customer, sales, onClose }: CustomerDetailModalProps) {
  if (!customer) return null

  // Lookup in mock customer registry if city or agent is missing
  const matchedMock = (MOCK_CUSTOMERS as any[]).find(
    (mc) => mc.customer_number === customer.customer_number || mc.company_name?.toLowerCase() === customer.company_name?.toLowerCase()
  )

  const resolvedCity = customer.city && customer.city !== '—' && customer.city !== ''
    ? customer.city
    : (matchedMock?.city || 'PRISHTINE')

  const resolvedAgent = customer.agent && customer.agent !== '—' && customer.agent !== ''
    ? customer.agent
    : (matchedMock?.agent || (customer.customer_number?.startsWith('2') ? 'Mensuri (Fahrzeug 1)' : customer.customer_number?.startsWith('1') ? 'Qerimi (Fahrzeug 2)' : 'M-ONE Zentrale'))

  // 1. Get Live-Scan GPS Info from central registry or sales
  const gpsMap = getCustomerGpsMap()
  let liveGps: CustomerGpsInfo | null = gpsMap[customer.customer_number] || null

  if (!liveGps) {
    // Check in customer sales
    const saleWithGps = sales.find(
      (s) => (s.customer_number === customer.customer_number || s.customer_name === customer.company_name) && s.latitude && s.longitude
    )
    if (saleWithGps) {
      liveGps = {
        lat: saleWithGps.latitude,
        lng: saleWithGps.longitude,
        accuracy: saleWithGps.gps_accuracy,
        updatedAt: saleWithGps.created_at || '',
        google_maps_url: saleWithGps.google_maps_url || `https://www.google.com/maps/search/?api=1&query=${saleWithGps.latitude},${saleWithGps.longitude}`,
      }
    }
  }

  // 2. Base Kosovo Coordinates (Fallback)
  const numInt = parseInt(customer.customer_number || '0') || 10103
  const rawCityKey = (resolvedCity || 'PRISHTINE').toUpperCase().trim()
  const cityKey = (CITY_ALIASES && CITY_ALIASES[rawCityKey]) || rawCityKey
  const baseCityCoords = KOSOVO_CITIES_GEO[cityKey] || KOSOVO_CITIES_GEO['PRISHTINE']
  const angle = (numInt * 137.5 * Math.PI) / 180
  const radius = 0.0018 + ((numInt % 19) * 0.0006)
  const fallbackLat = baseCityCoords[0] + Math.sin(angle) * radius
  const fallbackLng = baseCityCoords[1] + Math.cos(angle) * radius * 1.25

  const finalLat = liveGps ? liveGps.lat : fallbackLat
  const finalLng = liveGps ? liveGps.lng : fallbackLng
  const isLiveGps = !!liveGps
  const googleMapsUrl = liveGps?.google_maps_url || `https://www.google.com/maps/search/?api=1&query=${finalLat.toFixed(6)},${finalLng.toFixed(6)}`

  // Filter sales for this specific customer
  const customerSales = sales.filter(
    (s) => s.customer_number === customer.customer_number || s.customer_name === customer.company_name
  )

  // Calculate days since last order
  let daysSinceLastOrder = 999
  if (customerSales.length > 0 && customerSales[0].created_at) {
    const lastDate = new Date(customerSales[0].created_at)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - lastDate.getTime())
    daysSinceLastOrder = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  // Determine Visit / Order Status (1x per week expected tour)
  let statusBadge = {
    color: 'bg-rose-950/80 text-rose-400 border-rose-700/60',
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
    text: 'Achtung: Überfällig (> 14 Tage kein Kauf)',
  }

  if (customerSales.length > 0 && daysSinceLastOrder <= 7) {
    statusBadge = {
      color: 'bg-emerald-950/80 text-emerald-400 border-emerald-700/60',
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      text: 'Aktiv (Bestellung diese Woche)',
    }
  } else if (customerSales.length > 0 && daysSinceLastOrder <= 14) {
    statusBadge = {
      color: 'bg-amber-950/80 text-amber-400 border-amber-700/60',
      icon: <Clock className="w-3.5 h-3.5" />,
      text: 'Fällig für Wochen-Besuch (7-14 Tage)',
    }
  } else if (customerSales.length === 0) {
    statusBadge = {
      color: 'bg-slate-900 text-slate-400 border-slate-700',
      icon: <Clock className="w-3.5 h-3.5" />,
      text: 'Schläfer (Noch keine Bestellung 2026)',
    }
  }

  // Top products bought by this customer
  const itemMap: Record<string, { sku: string; name: string; qty: number; total: number }> = {}
  customerSales.forEach((s) => {
    (s.items || []).forEach((i: any) => {
      const key = i.sku || i.name
      if (!itemMap[key]) {
        itemMap[key] = { sku: i.sku || '—', name: i.name || 'Artikel', qty: 0, total: 0 }
      }
      itemMap[key].qty += i.qty || 1
      itemMap[key].total += i.total || (i.qty || 1) * (i.unit_price || 0)
    })
  })
  const topItems = Object.values(itemMap).sort((a, b) => b.total - a.total)

  // Trend analysis by month for customer (2026-01 to 2026-08)
  const monthlyVolume: Record<string, number> = {
    '01': 0, '02': 0, '03': 0, '04': 0, '05': 0, '06': 0, '07': 0, '08': 0
  }
  customerSales.forEach((s) => {
    const createdStr = s.created_at || ''
    const monthMatch = createdStr.match(/-(\d{2})-/)
    const rev = s.total_amount || 0
    if (monthMatch && monthlyVolume[monthMatch[1]] !== undefined) {
      monthlyVolume[monthMatch[1]] += rev
    } else {
      monthlyVolume['08'] += rev
    }
  })
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-surface-900 border border-surface-700 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-surface-800 flex items-start justify-between bg-surface-950/60 shrink-0">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-brand-400 bg-brand-950/80 border border-brand-800/60 px-2.5 py-0.5 rounded-lg">
                Kd.-Nr. {customer.customer_number}
              </span>
              <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-lg border ${statusBadge.color}`}>
                {statusBadge.icon}
                {statusBadge.text}
              </span>
            </div>
            <h2 className="text-xl font-black text-surface-50 mt-1.5">{customer.company_name}</h2>
            <div className="flex items-center gap-4 text-xs text-surface-400 mt-1">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" /> {resolvedCity}
              </span>
              <span className="flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-amber-400" /> {resolvedAgent}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-surface-400 hover:text-white hover:bg-surface-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* GPS STANDORT & 1-KLICK GOOGLE MAPS NAVIGATION (IMMER SICHTBAR) */}
          <div className="glass-card p-4 border border-emerald-800/50 bg-emerald-950/20 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-2">
                <Navigation className="w-4 h-4 text-emerald-400" />
                GPS-Standortdaten (Kosovo)
              </h3>
              {isLiveGps ? (
                <span className="text-[10px] bg-emerald-900/90 text-emerald-300 font-black px-2.5 py-0.5 rounded-md border border-emerald-600/60 font-mono flex items-center gap-1 shadow-glow">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  📍 Live-Scan erfasst
                </span>
              ) : (
                <span className="text-[10px] bg-sky-950/90 text-sky-300 font-bold px-2.5 py-0.5 rounded-md border border-sky-800/60 font-mono">
                  📍 {resolvedCity} (Kosovo)
                </span>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-surface-950/80 p-3.5 rounded-xl border border-surface-800">
              <div className="space-y-1">
                <div className="flex items-center gap-3 text-xs font-mono font-bold text-surface-100 flex-wrap">
                  <span className="bg-surface-900 px-2 py-1 rounded border border-surface-700">
                    Breitengrad (Lat): <strong className="text-emerald-400">{finalLat.toFixed(6)}</strong>
                  </span>
                  <span className="bg-surface-900 px-2 py-1 rounded border border-surface-700">
                    Längengrad (Lng): <strong className="text-emerald-400">{finalLng.toFixed(6)}</strong>
                  </span>
                  {liveGps?.accuracy && (
                    <span className="text-[10px] text-emerald-500 font-mono">
                      (±{Math.round(liveGps.accuracy)}m Genauigkeit)
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-surface-400">
                  {isLiveGps
                    ? 'Standort wurde direkt beim Rechnungs-Scan der Fahrer erfasst.'
                    : `Standort im Bezirk ${resolvedCity} hinterlegt. Wird beim nächsten Fahrer-Scan zentimetergenau live aktualisiert.`}
                </p>
              </div>

              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary py-2.5 px-4 text-xs font-bold shrink-0 flex items-center gap-2 shadow-glow active:scale-95"
              >
                <Navigation className="w-3.5 h-3.5" />
                Google Maps Navigation ↗
              </a>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-3">
            <div className="glass-card p-3 border border-surface-800 text-center">
              <p className="text-xs text-surface-400">Gesamtumsatz 2026</p>
              <p className="text-lg font-black text-emerald-400 tabular-nums mt-0.5">
                {formatCurrency(customer.total_revenue || customerSales.reduce((s, x) => s + x.total_amount, 0))}
              </p>
            </div>
            <div className="glass-card p-3 border border-surface-800 text-center">
              <p className="text-xs text-surface-400">Erfasste Verkäufe</p>
              <p className="text-lg font-black text-surface-100 tabular-nums mt-0.5">
                {customerSales.length} Fakturen
              </p>
            </div>
            <div className="glass-card p-3 border border-surface-800 text-center">
              <p className="text-xs text-surface-400">Gekaufte Einheiten</p>
              <p className="text-lg font-black text-brand-400 tabular-nums mt-0.5">
                {formatNumber(topItems.reduce((s, i) => s + i.qty, 0))} Stk.
              </p>
            </div>
          </div>

          {/* VISUELLE UMSATZ-GRAFIK FÜR DIESEN KUNDEN */}
          <div className="glass-card p-4 border border-surface-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-surface-300 uppercase tracking-wider flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-emerald-400" />
                Umsatz-Entwicklung dieses Kunden (2026)
              </h3>
            </div>

            {/* Visual Bar Chart */}
            <div className="h-28 pt-4 pb-1 px-2 flex items-end justify-between gap-2 border-b border-surface-800 bg-surface-950/50 rounded-xl">
              {monthLabels.map((m) => {
                const val = monthlyVolume[m.key] || 0
                const pct = Math.min(100, Math.max(8, Math.round((val / maxMonthVal) * 100)))

                return (
                  <div key={m.key} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                    <span className="text-[9px] font-mono text-surface-400 font-bold group-hover:text-emerald-400 transition-colors">
                      {val > 0 ? `${Math.round(val)}€` : '0'}
                    </span>
                    <div className="w-full max-w-[28px] bg-surface-800 rounded-t-md overflow-hidden flex items-end h-full">
                      <div
                        style={{ height: `${pct}%` }}
                        className={`w-full transition-all duration-500 rounded-t-md ${
                          val > 0
                            ? 'bg-gradient-to-t from-emerald-700 via-teal-600 to-emerald-400 group-hover:from-emerald-600 group-hover:to-emerald-300 shadow-glow'
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

          {/* Top Meistgekaufte Produkte dieses Kunden */}
          {topItems.length > 0 && (
            <div className="glass-card p-4 border border-surface-800 space-y-3">
              <h3 className="text-xs font-bold text-surface-300 uppercase tracking-wider flex items-center gap-2">
                <Package className="w-4 h-4 text-brand-400" />
                Meistgekaufte Produkte dieses Kunden
              </h3>
              <div className="grid sm:grid-cols-2 gap-2">
                {topItems.slice(0, 6).map((item) => (
                  <div key={item.sku} className="p-2.5 rounded-lg bg-surface-950/60 border border-surface-800 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-surface-100 truncate">{item.name}</p>
                      <p className="text-[10px] text-surface-500 font-mono">Art.-Nr. {item.sku} · {item.qty} Stk.</p>
                    </div>
                    <span className="text-xs font-bold text-emerald-400 tabular-nums ml-2 shrink-0">
                      {formatCurrency(item.total)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Einkaufshistorie & Fakturen */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-surface-300 uppercase tracking-wider flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-emerald-400" />
              Einkaufs-Historie & Verkaufsbelege ({customerSales.length})
            </h3>

            {customerSales.length === 0 ? (
              <div className="p-8 text-center glass-card border border-surface-800">
                <Clock className="w-8 h-8 text-surface-600 mx-auto mb-2 opacity-40" />
                <p className="text-sm text-surface-300 font-medium">Noch keine Verkäufe 2026 erfasst.</p>
                <p className="text-xs text-surface-500 mt-1">
                  Sobald Mensuri oder Qerimi bei der wöchentlichen Tour für diesen Kunden buchen, erscheint der Beleg hier.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {customerSales.map((sale) => {
                  const dateStr = sale.created_at ? sale.created_at.substring(0, 10) : '2026-05-28'
                  const timeStr = sale.created_at ? sale.created_at.substring(11, 16) : ''

                  return (
                    <div key={sale.id} className="glass-card p-4 border border-surface-800 space-y-3">
                      <div className="flex items-center justify-between border-b border-surface-800/60 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-brand-400">
                            {sale.order_number || sale.id}
                          </span>
                          <span className="text-xs text-surface-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-surface-500" /> {dateStr} {timeStr}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-black text-emerald-400 tabular-nums">
                            {formatCurrency(sale.total_amount || 0)}
                          </span>
                          <span className="ml-2 text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded font-mono uppercase">
                            {sale.payment_method || 'Bar'}
                          </span>
                        </div>
                      </div>

                      {/* Gekaufte Artikel in diesem Beleg */}
                      <div className="space-y-1.5">
                        {(sale.items || []).map((item: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between text-xs py-1 px-2 rounded bg-surface-950/40">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-mono text-[10px] font-bold text-brand-400 bg-brand-950 px-1.5 py-0.5 rounded border border-brand-800/40 shrink-0">
                                {item.sku}
                              </span>
                              <span className="text-surface-200 font-medium truncate">{item.name}</span>
                            </div>
                            <div className="text-right ml-2 shrink-0 font-mono">
                              <span className="text-surface-300 font-bold mr-2">{item.qty}x</span>
                              <span className="text-surface-400">{formatCurrency(item.unit_price || 0)} = </span>
                              <span className="text-emerald-400 font-bold">{formatCurrency((item.qty || 1) * (item.unit_price || 0))}</span>
                            </div>
                          </div>
                        ))}
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
          <span className="text-surface-400 font-mono">Standort / Tour: {customer.agent}</span>
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

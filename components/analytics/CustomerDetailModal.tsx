'use client'

import { useMemo, useState, useEffect } from 'react'
import {
  X,
  Calendar,
  MapPin,
  Truck,
  ShoppingCart,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Package,
  Navigation,
  FileText,
  CreditCard,
  Receipt,
  TrendingUp,
  Hash,
  Camera,
  Phone,
  Mail,
  User,
  ZoomIn,
  Store,
  Layers,
  Archive,
  ExternalLink,
  MessageCircle,
} from 'lucide-react'
import { formatCurrency, formatNumber } from '@/lib/utils/currency'
import { getCustomerGpsMap, type CustomerGpsInfo, getSalesHistory } from '@/lib/stockStore'
import {
  getCustomerProfile,
  CustomerPhoto,
  CustomerExtendedProfile,
} from '@/lib/customerStore'
import { KOSOVO_CITIES_GEO, CITY_ALIASES } from '@/components/customers/KosovoCustomerMap'
import CustomerPhotoModal from '@/components/customers/CustomerPhotoModal'
import MOCK_CUSTOMERS from '@/lib/mockCustomers.json'
import MOCK_2026_SALES from '@/lib/mock2026Sales.json'

interface CustomerDetailModalProps {
  customer: {
    customer_number: string
    company_name: string
    city?: string
    agent?: string
    total_revenue?: number
    orders_count?: number
    last_order_date?: string
    items_bought?: number
    notes?: string
  } | null
  sales?: any[]
  onClose: () => void
}

function formatDateDE(dateStr?: string): string {
  if (!dateStr) return '—'
  const clean = dateStr.slice(0, 10)
  const parts = clean.split('-')
  if (parts.length === 3) {
    const day = parts[2]
    const month = parts[1]
    const year = parts[0]
    return `${day}.${month}.${year}`
  }
  return dateStr
}

const PHOTO_SLOT_DEFS = [
  {
    key: 'storefront' as const,
    title: 'Ladenfront / Außenansicht',
    desc: 'Lokal von außen mit Eingang & Schild',
    icon: Store,
    badgeColor: 'bg-blue-950 text-blue-300 border-blue-800',
  },
  {
    key: 'shelf' as const,
    title: 'Warenregal / M-ONE Präsentation',
    desc: 'M-ONE Produkte im Verkaufsregal',
    icon: Layers,
    badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-800',
  },
  {
    key: 'storage' as const,
    title: 'Zusatz / Lager / Innenansicht',
    desc: 'Innenbereich oder Lagerbestand',
    icon: Archive,
    badgeColor: 'bg-purple-950 text-purple-300 border-purple-800',
  },
]

export default function CustomerDetailModal({ customer, sales, onClose }: CustomerDetailModalProps) {
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false)
  const [lightboxPhoto, setLightboxPhoto] = useState<CustomerPhoto | null>(null)
  const [profileRefreshKey, setProfileRefreshKey] = useState(0)

  if (!customer) return null

  // 1. Lookup in mock customer registry if city or agent is missing
  const matchedMock = (MOCK_CUSTOMERS as any[]).find(
    (mc) =>
      mc.customer_number === customer.customer_number ||
      mc.company_name?.toLowerCase() === customer.company_name?.toLowerCase()
  )

  const resolvedCity =
    customer.city && customer.city !== '—' && customer.city !== ''
      ? customer.city
      : matchedMock?.city || 'PRISHTINE'

  const resolvedAgent =
    customer.agent && customer.agent !== '—' && customer.agent !== ''
      ? customer.agent
      : matchedMock?.agent ||
        (customer.customer_number?.startsWith('2')
          ? 'Mensuri (Fahrzeug 1)'
          : customer.customer_number?.startsWith('1')
          ? 'Qerimi (Fahrzeug 2)'
          : 'M-ONE Zentrale (Hauptlager)')

  // Extended profile with photos & contact
  const extendedProfile = useMemo(() => {
    return getCustomerProfile(customer.customer_number)
  }, [customer.customer_number, profileRefreshKey])

  // Listen to profile updates
  useEffect(() => {
    function handleProfileUpdate(e: any) {
      if (e?.detail?.customerNumber === customer?.customer_number) {
        setProfileRefreshKey((k) => k + 1)
      }
    }
    window.addEventListener('m_one_customer_profiles_updated', handleProfileUpdate)
    return () => window.removeEventListener('m_one_customer_profiles_updated', handleProfileUpdate)
  }, [customer.customer_number])

  // 2. Gather All Sales (Fallback to MOCK_2026_SALES from NEW DATA 2026)
  const allSales = useMemo(() => {
    if (sales && sales.length > 0) return sales
    const storeSales = getSalesHistory()
    if (storeSales && storeSales.length > 0) return storeSales
    return MOCK_2026_SALES as any[]
  }, [sales])

  // 3. Filter Sales specifically for this Customer & Sort Chronologically (NEWEST FIRST)
  const customerSales = useMemo(() => {
    const num = String(customer.customer_number || '').trim().toLowerCase()
    const name = String(customer.company_name || '').trim().toLowerCase()

    const list = allSales.filter((s) => {
      const sNum = String(s.customer_number || s.customerNumber || '').trim().toLowerCase()
      const sName = String(s.customer_name || s.customerName || '').trim().toLowerCase()
      return (
        (num && (sNum === num || sNum.replace(/^0+/, '') === num.replace(/^0+/, ''))) ||
        (name && (sName === name || sName.includes(name) || name.includes(sName)))
      )
    })

    // Sort STRICTLY LATEST / NEWEST FIRST (Absteigend: Neueste oben, Älteste unten)
    list.sort((a, b) => {
      const dtA = String(a.date || a.created_at || '2026-01-01').substring(0, 10)
      const dtB = String(b.date || b.created_at || '2026-01-01').substring(0, 10)
      if (dtB !== dtA) {
        return dtB.localeCompare(dtA)
      }
      const nrA = String(a.order_number || a.id || '')
      const nrB = String(b.order_number || b.id || '')
      return nrB.localeCompare(nrA, undefined, { numeric: true })
    })

    return list
  }, [allSales, customer.customer_number, customer.company_name])

  // 4. GPS Standort & Live-Scan
  const gpsMap = getCustomerGpsMap()
  let liveGps: CustomerGpsInfo | null = extendedProfile?.gps || gpsMap[customer.customer_number] || null

  if (!liveGps) {
    const saleWithGps = customerSales.find((s) => s.latitude && s.longitude)
    if (saleWithGps) {
      liveGps = {
        lat: saleWithGps.latitude,
        lng: saleWithGps.longitude,
        accuracy: saleWithGps.gps_accuracy,
        updatedAt: saleWithGps.created_at || saleWithGps.date || '',
        google_maps_url:
          saleWithGps.google_maps_url ||
          `https://www.google.com/maps/search/?api=1&query=${saleWithGps.latitude},${saleWithGps.longitude}`,
      }
    }
  }

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
  const googleMapsUrl =
    liveGps?.google_maps_url ||
    `https://www.google.com/maps/search/?api=1&query=${finalLat.toFixed(6)},${finalLng.toFixed(6)}`

  // 5. Calculate Days since last order & Status
  let daysSinceLastOrder = 999
  const latestSaleDate = customerSales[0]?.date || customerSales[0]?.created_at
  if (latestSaleDate) {
    const lastDate = new Date(latestSaleDate)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - lastDate.getTime())
    daysSinceLastOrder = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

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

  // 6. Top Products Bought by this Customer
  const itemMap: Record<string, { sku: string; name: string; qty: number; total: number }> = {}
  let totalRevenueCalculated = 0
  let totalPiecesCalculated = 0

  customerSales.forEach((s) => {
    totalRevenueCalculated += Number(s.total_amount || 0)
    ;(s.items || []).forEach((i: any) => {
      const sku = String(i.sku || '').trim() || '—'
      const name = i.name || 'Artikel ' + sku
      const qty = Number(i.qty || 1)
      const unitPrice = Number(i.unit_price || 0)
      const lineTotal = Number(i.total || qty * unitPrice)

      totalPiecesCalculated += qty

      if (!itemMap[sku]) {
        itemMap[sku] = { sku, name, qty: 0, total: 0 }
      }
      itemMap[sku].qty += qty
      itemMap[sku].total += lineTotal
    })
  })

  const topItems = Object.values(itemMap).sort((a, b) => b.total - a.total)

  // 7. Monthly Revenue Volume (Jan..Aug 2026)
  const monthlyVolume: Record<string, number> = {
    '01': 0,
    '02': 0,
    '03': 0,
    '04': 0,
    '05': 0,
    '06': 0,
    '07': 0,
    '08': 0,
  }
  customerSales.forEach((s) => {
    const createdStr = s.date || s.created_at || ''
    const monthMatch = createdStr.match(/-(\d{2})-/)
    const rev = Number(s.total_amount || 0)
    if (monthMatch && monthlyVolume[monthMatch[1]] !== undefined) {
      monthlyVolume[monthMatch[1]] += rev
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

  const photosList = extendedProfile?.photos || []
  const phoneVal = extendedProfile?.phone || ''
  const emailVal = extendedProfile?.email || ''
  const contactPersonVal = extendedProfile?.contact_person || ''

  // Clean phone for WhatsApp / Tel links
  const cleanPhoneDigits = phoneVal.replace(/[^0-9+]/g, '')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-surface-900 border border-surface-700/80 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-surface-800 flex items-start justify-between bg-surface-950/70 shrink-0">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-brand-400 bg-brand-950/80 border border-brand-800/60 px-2.5 py-0.5 rounded-lg">
                Kd.-Nr. {customer.customer_number}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-lg border ${statusBadge.color}`}
              >
                {statusBadge.icon}
                {statusBadge.text}
              </span>
            </div>
            <h2 className="text-2xl font-black text-surface-50 mt-1.5">{customer.company_name}</h2>
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
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">

          {/* 1. KONTAKT- & FOTO-SCHNELLÜBERSICHT */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Telefon & E-Mail Karte */}
            <div className="p-3.5 rounded-xl bg-surface-950/80 border border-surface-800 space-y-2.5 flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-bold text-surface-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" /> Kontaktdaten & Ansprechpartner
                </p>
                
                <div className="mt-2 space-y-1.5">
                  {phoneVal ? (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-surface-300 font-mono font-bold">{phoneVal}</span>
                      <div className="flex items-center gap-1.5">
                        <a
                          href={`tel:${cleanPhoneDigits}`}
                          className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900 text-[10px] font-bold flex items-center gap-1"
                          title="Anrufen"
                        >
                          <Phone className="w-3 h-3" /> Anrufen
                        </a>
                        <a
                          href={`https://wa.me/${cleanPhoneDigits.replace('+', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-0.5 rounded bg-green-950 text-green-300 border border-green-800 hover:bg-green-900 text-[10px] font-bold flex items-center gap-1"
                          title="WhatsApp Nachricht"
                        >
                          <MessageCircle className="w-3 h-3" /> WhatsApp
                        </a>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-surface-500 italic">Keine Telefonnummer hinterlegt</p>
                  )}

                  {emailVal ? (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-surface-300 font-mono truncate max-w-[200px]">{emailVal}</span>
                      <a
                        href={`mailto:${emailVal}`}
                        className="px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800 hover:bg-sky-900 text-[10px] font-bold flex items-center gap-1 shrink-0"
                      >
                        <Mail className="w-3 h-3" /> E-Mail
                      </a>
                    </div>
                  ) : (
                    <p className="text-xs text-surface-500 italic">Keine E-Mail hinterlegt</p>
                  )}

                  {contactPersonVal && (
                    <p className="text-xs text-surface-400 flex items-center gap-1 pt-0.5">
                      <User className="w-3 h-3 text-brand-400" /> Inhaber/Ansprechpartner: <strong className="text-surface-200">{contactPersonVal}</strong>
                    </p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsPhotoModalOpen(true)}
                className="w-full py-1.5 px-3 rounded-lg bg-surface-900 hover:bg-surface-800 text-brand-300 border border-brand-800/50 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors mt-2"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Fotos & Kontaktdaten bearbeiten</span>
              </button>
            </div>

            {/* GPS Koordinaten & Google Maps Navigation */}
            <div className="p-3.5 rounded-xl bg-surface-950/80 border border-surface-800 space-y-2.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5" /> GPS-Standort (Kosovo)
                  </p>
                  {isLiveGps ? (
                    <span className="text-[9.5px] bg-emerald-900/80 text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-600/60 font-mono flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      Live-Scan
                    </span>
                  ) : (
                    <span className="text-[9.5px] bg-surface-800 text-surface-400 px-2 py-0.5 rounded font-mono">
                      {resolvedCity}
                    </span>
                  )}
                </div>

                <div className="mt-2 space-y-1 font-mono text-xs">
                  <p className="text-surface-200">
                    Breitengrad: <strong className="text-emerald-400">{finalLat.toFixed(6)}</strong>
                  </p>
                  <p className="text-surface-200">
                    Längengrad: <strong className="text-emerald-400">{finalLng.toFixed(6)}</strong>
                  </p>
                  {liveGps?.accuracy && (
                    <p className="text-[10px] text-surface-500">Genauigkeit: ±{Math.round(liveGps.accuracy)} Meter</p>
                  )}
                </div>
              </div>

              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary py-1.5 px-3 text-xs font-bold flex items-center justify-center gap-1.5 shadow-glow"
              >
                <Navigation className="w-3.5 h-3.5" />
                Google Maps Navigation ↗
              </a>
            </div>
          </div>

          {/* 2. FOTOGALERIE (Bis zu 3 Fotos: Ladenfront, Warenregal, Lager) */}
          <div className="glass-card p-4 border border-surface-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-surface-200 uppercase tracking-wider flex items-center gap-2">
                <Camera className="w-4 h-4 text-brand-400" />
                Laden- & Regalfotos ({photosList.length}/3 vorhanden)
              </h3>
              <button
                type="button"
                onClick={() => setIsPhotoModalOpen(true)}
                className="text-[11px] font-bold text-brand-400 hover:text-brand-300 flex items-center gap-1"
              >
                {photosList.length === 0 ? '+ Neues Foto aufnehmen' : 'Fotos verwalten'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {PHOTO_SLOT_DEFS.map((slot) => {
                const photo = photosList.find((p) => p.slot === slot.key)
                const SlotIcon = slot.icon

                return (
                  <div
                    key={slot.key}
                    className={`rounded-xl border p-2.5 flex flex-col justify-between transition-all ${
                      photo
                        ? 'bg-surface-950 border-surface-700/80 hover:border-surface-600'
                        : 'bg-surface-950/40 border-dashed border-surface-800/80'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${slot.badgeColor} flex items-center gap-1`}>
                          <SlotIcon className="w-3 h-3" />
                          {slot.title.split('/')[0].trim()}
                        </span>
                        {photo && (
                          <span className="text-[9px] text-surface-400 font-mono">
                            {formatDateDE(photo.timestamp)}
                          </span>
                        )}
                      </div>

                      {photo ? (
                        <div
                          onClick={() => setLightboxPhoto(photo)}
                          className="relative rounded-lg overflow-hidden border border-surface-700 bg-surface-900 cursor-pointer group aspect-[4/3]"
                        >
                          <img
                            src={photo.dataUrl}
                            alt={slot.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity gap-1 text-xs font-bold">
                            <ZoomIn className="w-4 h-4" /> Vergrößern
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => setIsPhotoModalOpen(true)}
                          className="rounded-lg border border-surface-800/80 bg-surface-900/40 flex flex-col items-center justify-center p-3 aspect-[4/3] cursor-pointer hover:bg-surface-800/40 transition-colors text-center"
                        >
                          <SlotIcon className="w-6 h-6 text-surface-600 mb-1 opacity-50" />
                          <span className="text-[10px] text-surface-500 font-medium">Foto hinzufügen</span>
                        </div>
                      )}
                    </div>

                    {photo && (
                      <p className="text-[9.5px] text-surface-400 truncate mt-1.5">
                        Fahrer: <strong className="text-surface-200">{photo.driverName}</strong>
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* 3. Stats Bar */}
          <div className="grid grid-cols-3 gap-3">
            <div className="glass-card p-3.5 border border-surface-800 text-center">
              <p className="text-xs text-surface-400">Gesamtumsatz 2026</p>
              <p className="text-xl font-black text-emerald-400 tabular-nums mt-0.5">
                {formatCurrency(totalRevenueCalculated)}
              </p>
            </div>
            <div className="glass-card p-3.5 border border-surface-800 text-center">
              <p className="text-xs text-surface-400">Erfasste Verkäufe</p>
              <p className="text-xl font-black text-surface-100 tabular-nums mt-0.5">
                {customerSales.length} Fakturen
              </p>
            </div>
            <div className="glass-card p-3.5 border border-surface-800 text-center">
              <p className="text-xs text-surface-400">Gekaufte Einheiten</p>
              <p className="text-xl font-black text-brand-400 tabular-nums mt-0.5">
                {formatNumber(totalPiecesCalculated)} Stk.
              </p>
            </div>
          </div>

          {/* 4. VISUELLE UMSATZ-GRAFIK FÜR DIESEN KUNDEN */}
          <div className="glass-card p-4 border border-surface-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-surface-300 uppercase tracking-wider flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-emerald-400" />
                Umsatz-Entwicklung dieses Kunden (2026)
              </h3>
            </div>

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

          {/* 5. Top Meistgekaufte Produkte dieses Kunden */}
          {topItems.length > 0 && (
            <div className="glass-card p-4 border border-surface-800 space-y-3">
              <h3 className="text-xs font-bold text-surface-300 uppercase tracking-wider flex items-center gap-2">
                <Package className="w-4 h-4 text-brand-400" />
                Meistgekaufte Produkte dieses Kunden ({topItems.length} Artikel)
              </h3>
              <div className="grid sm:grid-cols-2 gap-2">
                {topItems.slice(0, 6).map((item) => (
                  <div
                    key={item.sku}
                    className="p-2.5 rounded-lg bg-surface-950/60 border border-surface-800 flex items-center justify-between"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-bold text-surface-100 truncate">{item.name}</p>
                      <p className="text-[10px] text-surface-500 font-mono">
                        Art.-Nr. {item.sku} · {formatNumber(item.qty)} Stk.
                      </p>
                    </div>
                    <span className="text-xs font-bold text-emerald-400 tabular-nums shrink-0">
                      {formatCurrency(item.total)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. EINKAUFSHISTORIE & DETAIL-BELEGE (Chronologisch: Neueste Einkäufe zuerst) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-surface-200 uppercase tracking-wider flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-400" />
                Einkaufs-Historie & Verkaufsbelege ({customerSales.length} Rechnungen)
              </h3>
              <span className="text-[11px] text-surface-400 font-medium">
                Neueste Einkäufe zuerst sortiert
              </span>
            </div>

            {customerSales.length === 0 ? (
              <div className="p-8 text-center glass-card border border-surface-800 rounded-2xl">
                <Clock className="w-8 h-8 text-surface-600 mx-auto mb-2 opacity-40" />
                <p className="text-sm text-surface-300 font-medium">Noch keine Verkäufe 2026 erfasst.</p>
                <p className="text-xs text-surface-500 mt-1">
                  Sobald ein Fahrer für diesen Kunden eine Rechnung erfasst, erscheint der Beleg hier.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {customerSales.map((sale, idx) => {
                  const rawDate = sale.date || sale.created_at || '2026-01-01'
                  const formattedDate = formatDateDE(rawDate)
                  const totalItemsInOrder = (sale.items || []).reduce(
                    (sum: number, it: any) => sum + Number(it.qty || 1),
                    0
                  )
                  const driver =
                    sale.driver_name ||
                    (customer.customer_number?.startsWith('1')
                      ? 'Qerimi (Fahrzeug 2)'
                      : customer.customer_number?.startsWith('2')
                      ? 'Mensuri (Fahrzeug 1)'
                      : 'M-ONE Zentrale')

                  return (
                    <div
                      key={sale.id || sale.order_number || idx}
                      className="glass-card p-4 sm:p-5 border border-surface-700/80 bg-surface-950/70 rounded-2xl shadow-xl hover:border-surface-600 transition-all space-y-3.5"
                    >
                      {/* Beleg-Kopf */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-surface-800/80 pb-3">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="font-mono text-xs font-bold text-brand-400 bg-brand-950/90 border border-brand-800/60 px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-sm">
                            <FileText className="w-3.5 h-3.5 text-brand-400" />
                            {sale.order_number || `Faktura #${idx + 1}`}
                          </span>
                          
                          <span className="text-xs font-bold text-surface-200 flex items-center gap-1.5 bg-surface-900 px-2.5 py-1 rounded-lg border border-surface-800">
                            <Calendar className="w-3.5 h-3.5 text-brand-400" />
                            {formattedDate}
                          </span>

                          <span
                            className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-lg border ${
                              driver.includes('Qerimi')
                                ? 'bg-cyan-950/60 text-cyan-300 border-cyan-800/50'
                                : 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50'
                            }`}
                          >
                            🚚 {driver}
                          </span>
                        </div>

                        <div className="flex items-center gap-2.5 sm:self-auto self-end">
                          <span className="text-base font-black text-emerald-400 font-mono tabular-nums">
                            {formatCurrency(sale.total_amount || 0)}
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 px-2.5 py-0.5 rounded-md font-mono">
                            {sale.payment_method || 'BAR'}
                          </span>
                        </div>
                      </div>

                      {/* Liste aller gekauften Produkte in dieser Rechnung */}
                      <div className="space-y-1.5">
                        {(sale.items || []).map((item: any, itemIdx: number) => {
                          const itemQty = Number(item.qty || 1)
                          const unitPrice = Number(item.unit_price || 0)
                          const lineTotal = Number(item.total || itemQty * unitPrice)

                          return (
                            <div
                              key={itemIdx}
                              className="flex items-center justify-between text-xs py-2 px-3 rounded-xl bg-surface-900/80 border border-surface-800/60 hover:bg-surface-800/60 transition-colors"
                            >
                              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                <span className="font-mono text-[10px] font-bold text-brand-300 bg-brand-950 px-2 py-0.5 rounded border border-brand-800/40 shrink-0">
                                  {item.sku}
                                </span>
                                <span className="text-surface-100 font-medium truncate" title={item.name}>
                                  {item.name}
                                </span>
                              </div>

                              <div className="text-right ml-2 shrink-0 font-mono flex items-center gap-3">
                                <span className="text-surface-200 font-bold bg-surface-800/90 px-2 py-0.5 rounded text-[11px]">
                                  {itemQty} Stk.
                                </span>
                                <span className="text-surface-400 text-[11px] hidden sm:inline">
                                  × {formatCurrency(unitPrice)}
                                </span>
                                <span className="text-emerald-400 font-bold text-[12px] min-w-[70px] text-right">
                                  = {formatCurrency(lineTotal)}
                                </span>
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      {/* Beleg-Zusammenfassungsleiste */}
                      <div className="flex items-center justify-between text-[11px] text-surface-400 pt-2 border-t border-surface-800/50 px-1 font-medium">
                        <span>
                          {(sale.items || []).length} Positionen · {totalItemsInOrder} Stück gesamt
                        </span>
                        <span className="text-surface-300 font-mono">
                          Rechnungsbetrag:{' '}
                          <strong className="text-emerald-400 font-bold">
                            {formatCurrency(sale.total_amount || 0)}
                          </strong>
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-surface-800 bg-surface-950/90 flex items-center justify-between shrink-0 text-xs">
          <span className="text-surface-400 font-mono">
            Standort / Tour: <strong className="text-surface-200">{resolvedAgent}</strong> ({resolvedCity})
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPhotoModalOpen(true)}
              className="btn-primary py-1.5 px-3 text-xs font-bold flex items-center gap-1.5"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Fotos / Daten bearbeiten</span>
            </button>
            <button
              onClick={onClose}
              className="btn-secondary py-1.5 px-4 text-xs font-bold"
            >
              Schließen
            </button>
          </div>
        </div>

      </div>

      {/* Fullscreen Photo Lightbox */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-60 bg-black/95 flex flex-col items-center justify-center p-4 animate-in fade-in"
          onClick={() => setLightboxPhoto(null)}
        >
          <div className="relative max-w-3xl max-h-[85vh] w-full flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <img
              src={lightboxPhoto.dataUrl}
              alt={lightboxPhoto.slotLabel}
              className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-2xl border border-surface-700"
            />
            <div className="mt-3 text-center text-xs text-surface-200">
              <p className="font-bold text-sm text-surface-100">{lightboxPhoto.slotLabel}</p>
              <p className="text-[11px] text-surface-400 mt-0.5">
                Aufgenommen von <strong className="text-brand-400">{lightboxPhoto.driverName}</strong> am{' '}
                {new Date(lightboxPhoto.timestamp).toLocaleString('de-DE')}
              </p>
              {lightboxPhoto.latitude && lightboxPhoto.longitude && (
                <p className="text-[10px] text-emerald-400 font-mono mt-0.5">
                  📍 GPS: {lightboxPhoto.latitude.toFixed(6)}, {lightboxPhoto.longitude.toFixed(6)}
                </p>
              )}
            </div>
            <button
              onClick={() => setLightboxPhoto(null)}
              className="absolute -top-10 right-0 p-2 text-surface-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* Photo & Check-in Modal */}
      {isPhotoModalOpen && (
        <CustomerPhotoModal
          initialCustomerNumber={customer.customer_number}
          initialCompanyName={customer.company_name}
          initialCity={resolvedCity}
          onClose={() => setIsPhotoModalOpen(false)}
          onSaved={() => {
            setProfileRefreshKey((k) => k + 1)
            setIsPhotoModalOpen(false)
          }}
        />
      )}

    </div>
  )
}

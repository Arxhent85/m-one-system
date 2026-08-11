'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import {
  ShoppingCart, Search, Plus, Minus, CheckCircle2,
  UserCheck, CreditCard, Banknote, FileText, ArrowLeft, Truck,
  Calendar, X, Trash2, Zap, AlertCircle, Hash, Grid, ListFilter, Camera, Sparkles
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils/currency'
import Link from 'next/link'
import {
  INITIAL_DEPO_PRODUCTS as OFFIZIELL_PRODUKTE,
  getStockMap,
  LOCATION_IDS,
  executeSale,
} from '@/lib/stockStore'
import TouchNumpadModal from '@/components/ui/TouchNumpadModal'
import InvoiceScannerModal from '@/components/ui/InvoiceScannerModal'

interface Product {
  id: string
  sku: string
  name: string
  unit: string
  selling_price: number
  purchase_price: number
  stock?: number
}

interface Customer {
  id: string
  customer_number?: string
  company_name: string
  city?: string
  discount_pct?: number
  notes?: string
}

interface Location {
  id: string
  name: string
  type: string
}

interface DriverPOSClientProps {
  products: Product[]
  customers: Customer[]
  locations: Location[]
  initialDriver?: string
}

interface SaleLine {
  id: string
  product: Product | null
  qty: number
  searchText: string
  showDropdown: boolean
}

function emptyLine(): SaleLine {
  return {
    id: Math.random().toString(36).slice(2),
    product: null,
    qty: 0,
    searchText: '',
    showDropdown: false,
  }
}

function getTodayRouteDayDigit(): string {
  const jsDay = new Date().getDay()
  if (jsDay === 0) return '1'
  return jsDay.toString()
}

const WEEKDAYS = [
  { digit: '1', name: 'Montag', short: 'Mo' },
  { digit: '2', name: 'Dienstag', short: 'Di' },
  { digit: '3', name: 'Mittwoch', short: 'Mi' },
  { digit: '4', name: 'Donnerstag', short: 'Do' },
  { digit: '5', name: 'Freitag', short: 'Fr' },
  { digit: '6', name: 'Samstag', short: 'Sa' },
]

export default function DriverPOSClient({
  products: dbProducts,
  customers,
  locations,
  initialDriver = 'mensuri',
}: DriverPOSClientProps) {
  const [activeDriver, setActiveDriver] = useState<'mensuri' | 'qerimi'>(
    initialDriver === 'qerimi' ? 'qerimi' : 'mensuri'
  )

  const isMensuri = activeDriver === 'mensuri'
  const driverPrefix = isMensuri ? '2' : '1'
  const driverName = isMensuri ? 'Fahrer Mensuri' : 'Fahrer Qerimi'
  const vehicleName = isMensuri ? 'Fahrzeug 1 (Depo Mensuri)' : 'Fahrzeug 2 (Depo Qerimi)'
  const vehicleLocId = isMensuri ? LOCATION_IDS.MENSURI : LOCATION_IDS.QERIMI

  // Live vehicle stock map
  const [stockMap, setStockMap] = useState<Record<string, Record<string, number>>>({})
  useEffect(() => {
    function load() { setStockMap(getStockMap()) }
    load()
    window.addEventListener('m_one_stock_changed', load)
    return () => window.removeEventListener('m_one_stock_changed', load)
  }, [])

  // Catalog with vehicle stock for the active vehicle
  const catalogProducts: Product[] = useMemo(() => {
    const vehStock = stockMap[vehicleLocId] ?? {}
    const base = (dbProducts && dbProducts.length > 0) ? dbProducts : OFFIZIELL_PRODUKTE
    return base.map(p => ({
      ...p,
      stock: vehStock[p.sku] ?? 0
    }))
  }, [dbProducts, stockMap, vehicleLocId])

  // Route day filter
  const todayDigit = useMemo(() => getTodayRouteDayDigit(), [])
  const todayName = WEEKDAYS.find(w => w.digit === todayDigit)?.name ?? 'Montag'
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>(todayDigit)

  // Customer selection state
  const [custSearchTerm, setCustSearchTerm] = useState('')
  const [showCustDropdown, setShowCustDropdown] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const custWrapperRef = useRef<HTMLDivElement>(null)

  // Sales Lines
  const [lines, setLines] = useState<SaleLine[]>([])
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'invoice' | 'card'>('cash')
  const [completedOrder, setCompletedOrder] = useState<any | null>(null)

  // Touch NumPad Modal State
  const [activeNumpadLine, setActiveNumpadLine] = useState<{
    lineId: string
    title: string
    subtitle: string
    initialValue: number
    max: number
  } | null>(null)

  // Scanner Modal & Scan Success Banner
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [scanNotice, setScanNotice] = useState<string | null>(null)

  // Active View Mode: 'touch_catalog' (Quick Cards) vs 'manual_entry' (Table)
  const [viewMode, setViewMode] = useState<'touch_catalog' | 'table'>('touch_catalog')

  function switchDriver(driver: 'mensuri' | 'qerimi') {
    setActiveDriver(driver)
    setSelectedCustomer(null)
    setCustSearchTerm('')
    setShowCustDropdown(false)
    setLines([])
  }

  // Filter customers strictly by driver prefix + route day
  const driverIsolatedCustomers = useMemo(() => {
    return customers.filter((c) => {
      const num = (c.customer_number ?? '').trim()
      if (!num.startsWith(driverPrefix)) return false
      if (selectedDayFilter !== 'all' && num.length >= 3) {
        if (num[2] !== selectedDayFilter) return false
      }
      return true
    })
  }, [customers, driverPrefix, selectedDayFilter])

  // Customer Search matches
  const custMatches = useMemo(() => {
    const q = custSearchTerm.trim().toLowerCase()
    if (!q) return driverIsolatedCustomers.slice(0, 10)
    const numStart = driverIsolatedCustomers.filter(c => (c.customer_number ?? '').startsWith(q))
    const numAny   = driverIsolatedCustomers.filter(c => (c.customer_number ?? '').includes(q) && !(c.customer_number ?? '').startsWith(q))
    const nameAny  = driverIsolatedCustomers.filter(c => c.company_name.toLowerCase().includes(q) || (c.city ?? '').toLowerCase().includes(q))
    return [...numStart, ...numAny, ...nameAny].slice(0, 10)
  }, [driverIsolatedCustomers, custSearchTerm])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (custWrapperRef.current && !custWrapperRef.current.contains(e.target as Node)) {
        setShowCustDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function selectCustomer(cust: Customer) {
    setSelectedCustomer(cust)
    setCustSearchTerm(`[${cust.customer_number}] ${cust.company_name}`)
    setShowCustDropdown(false)
  }

  function clearCustomer() {
    setSelectedCustomer(null)
    setCustSearchTerm('')
    setShowCustDropdown(true)
  }

  // Handle OCR Scan Complete
  function handleScanComplete(scanned: {
    customerNumber?: string
    items: Array<{ sku: string; name: string; qty: number; unit_price: number }>
  }) {
    // 1. Kunde zuweisen
    if (scanned.customerNumber) {
      const matchedCust = customers.find(c => (c.customer_number ?? '').trim() === scanned.customerNumber?.trim())
      if (matchedCust) {
        selectCustomer(matchedCust)
      } else {
        setCustSearchTerm(`[${scanned.customerNumber}] Erkannt aus Beleg`)
      }
    }

    // 2. Artikel in Positionen übernehmen
    const newLines: SaleLine[] = []
    for (const item of scanned.items) {
      const prod = catalogProducts.find(p => p.sku === item.sku) || {
        id: item.sku,
        sku: item.sku,
        name: item.name,
        unit: 'Stk.',
        selling_price: item.unit_price || 1.49,
        purchase_price: 1.00,
      }
      const vehStock = stockMap[vehicleLocId]?.[prod.sku] ?? (prod.stock ?? 0)
      const validQty = Math.min(vehStock > 0 ? vehStock : item.qty, item.qty)

      newLines.push({
        id: Math.random().toString(36).slice(2),
        product: prod,
        qty: validQty,
        searchText: `${prod.sku} — ${prod.name}`,
        showDropdown: false,
      })
    }

    setLines(newLines)
    setScanNotice(`✨ Papierrechnung gescannt: ${scanned.items.length} Positionen automatisch befüllt!`)
    setTimeout(() => setScanNotice(null), 8000)
  }

  // Add product directly by Touch
  function addOrIncrementProduct(prod: Product, addAmount: number = 1) {
    const existing = lines.find(l => l.product?.id === prod.id || l.product?.sku === prod.sku)
    const vehStock = stockMap[vehicleLocId]?.[prod.sku] ?? (prod.stock ?? 0)

    if (existing) {
      const newQty = Math.min(vehStock, existing.qty + addAmount)
      setLines(prev => prev.map(l => l.id === existing.id ? { ...l, qty: newQty } : l))
    } else {
      const newQty = Math.min(vehStock, addAmount)
      setLines(prev => [
        ...prev,
        {
          id: Math.random().toString(36).slice(2),
          product: prod,
          qty: newQty,
          searchText: `${prod.sku} — ${prod.name}`,
          showDropdown: false,
        }
      ])
    }
  }

  function setProductQty(prodSku: string, qty: number) {
    if (qty <= 0) {
      setLines(prev => prev.filter(l => l.product?.sku !== prodSku))
    } else {
      setLines(prev => prev.map(l => l.product?.sku === prodSku ? { ...l, qty } : l))
    }
  }

  function removeLine(id: string) {
    setLines(prev => prev.filter(l => l.id !== id))
  }

  const validLines = useMemo(() => lines.filter(l => l.product && l.qty > 0), [lines])

  const hasVehicleStockExceeded = useMemo(() => {
    return lines.some(l => {
      if (!l.product) return false
      const avail = stockMap[vehicleLocId]?.[l.product.sku] ?? (l.product.stock ?? 0)
      return l.qty > avail
    })
  }, [lines, stockMap, vehicleLocId])

  const discountPct = selectedCustomer?.discount_pct ?? 0
  const subtotal = useMemo(() => {
    return validLines.reduce((sum, l) => sum + l.qty * (l.product?.selling_price ?? 0), 0)
  }, [validLines])
  const discountVal = subtotal * (discountPct / 100)
  const totalVal = subtotal - discountVal

  async function handleCompleteSale() {
    if (validLines.length === 0) return
    if (hasVehicleStockExceeded) return

    const saleItems = validLines.map(l => ({
      sku:        l.product!.sku,
      name:       l.product!.name,
      qty:        l.qty,
      unit_price: l.product!.selling_price,
    }))

    const record = executeSale(
      vehicleLocId,
      vehicleName,
      driverName,
      selectedCustomer?.customer_number ?? '—',
      selectedCustomer ? selectedCustomer.company_name : 'Laufkunde / Barverkauf',
      saleItems,
      discountPct,
      paymentMethod
    )

    setCompletedOrder({
      order_number:    record.order_number,
      customer_name:   record.customer_name,
      customer_number: record.customer_number,
      driver_name:     record.driver_name,
      vehicle_name:    vehicleName,
      items_count:     record.items_count,
      total_amount:    record.total_amount,
      payment_method:  record.payment_method,
      timestamp:       new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
    })

    setLines([])
    setSelectedCustomer(null)
    setCustSearchTerm('')
  }

  return (
    <div className="p-3 sm:p-4 space-y-4 animate-in max-w-lg mx-auto pb-28">

      {/* DRIVER SWITCHER & HEADER */}
      <div className="glass-card p-3.5 sm:p-4 border-brand-500/30 bg-gradient-to-r from-brand-950/80 via-surface-900 to-surface-900 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              isMensuri
                ? 'bg-emerald-800/60 text-emerald-400 border-emerald-500/40'
                : 'bg-cyan-800/60 text-cyan-400 border-cyan-500/40'
            }`}>
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-surface-50 text-base">{driverName}</span>
                <span className="badge-success text-[10px] px-2 py-0.5">Aktiv</span>
              </div>
              <p className="text-xs text-surface-400 font-medium">
                {vehicleName} · Kd.-Nr. <strong className="text-brand-400 font-mono">{driverPrefix}xxxx</strong>
              </p>
            </div>
          </div>

          <Link href="/driver/home" className="btn-ghost btn-sm text-xs px-2.5">
            <ArrowLeft className="w-3.5 h-3.5" /> Start
          </Link>
        </div>

        {/* DRIVER TAB TOGGLE */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-surface-800/60">
          <button
            type="button"
            onClick={() => switchDriver('mensuri')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border active:scale-95 ${
              isMensuri
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/60 shadow-lg shadow-emerald-900/30'
                : 'bg-surface-950 text-surface-400 border-surface-800 hover:text-surface-200'
            }`}
          >
            🚚 Mensuri (2xxxx)
          </button>
          <button
            type="button"
            onClick={() => switchDriver('qerimi')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border active:scale-95 ${
              !isMensuri
                ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/60 shadow-lg shadow-cyan-900/30'
                : 'bg-surface-950 text-surface-400 border-surface-800 hover:text-surface-200'
            }`}
          >
            🚚 Qerimi (1xxxx)
          </button>
        </div>
      </div>

      {/* PROMINENTER KAMERA FOTO-SCANNER BUTTON (SUPER LEICHT FÜR FAHRER) */}
      <div className="glass-card p-3 bg-gradient-to-r from-brand-950 via-surface-900 to-emerald-950/70 border-brand-500/60 space-y-2">
        <button
          type="button"
          onClick={() => setIsScannerOpen(true)}
          className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-brand-600 to-emerald-600 hover:from-brand-500 hover:to-emerald-500 active:scale-95 text-white font-bold text-sm shadow-xl flex items-center justify-center gap-2.5 transition-all"
        >
          <Camera className="w-5 h-5 text-white" />
          <span>📸 Papierrechnung scannen (Foto-KI)</span>
          <Sparkles className="w-4 h-4 text-emerald-300" />
        </button>
        <p className="text-[11px] text-surface-300 text-center font-medium">
          Foto der Papierrechnung machen ➔ Kundennummer & Mengen automatisch auslesen
        </p>
      </div>

      {/* SCAN SUCCESS BANNER */}
      {scanNotice && (
        <div className="p-3 rounded-2xl bg-emerald-950 border border-emerald-500 text-emerald-300 text-xs font-bold flex items-center justify-between animate-in">
          <span>{scanNotice}</span>
          <button type="button" onClick={() => setScanNotice(null)} className="p-1 text-emerald-400">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ERFOLGS-BON */}
      {completedOrder && (
        <div className="glass-card p-5 border-success-500/50 bg-success-950/40 space-y-3 animate-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-success-900 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6 text-success-500" />
            </div>
            <div>
              <p className="font-bold text-surface-50 text-sm">Verkauf erfolgreich gebucht!</p>
              <p className="text-xs text-surface-300 font-mono mt-0.5">{completedOrder.order_number}</p>
            </div>
          </div>
          <div className="bg-surface-900/80 p-3 rounded-xl text-xs space-y-1.5 border border-surface-700/50 font-mono">
            <div className="flex justify-between">
              <span className="text-surface-400">Fahrer:</span>
              <span className="text-surface-100 font-bold">{completedOrder.driver_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-400">Kunde:</span>
              <span className="text-surface-100 font-bold">{completedOrder.customer_name}</span>
            </div>
            {completedOrder.customer_number !== '—' && (
              <div className="flex justify-between">
                <span className="text-surface-400">Kd.-Nr.:</span>
                <span className="text-brand-400 font-bold">{completedOrder.customer_number}</span>
              </div>
            )}
            <div className="flex justify-between pt-1 border-t border-surface-700 font-bold">
              <span className="text-surface-300">Gesamtsumme:</span>
              <span className="text-success-400">{formatCurrency(completedOrder.total_amount)}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCompletedOrder(null)}
            className="btn-primary w-full btn-lg justify-center py-3 text-sm font-bold"
          >
            Nächsten Verkauf starten
          </button>
        </div>
      )}

      {/* STEP 1: KUNDENAUSWAHL (TOUCH-FIRST & KINDERLEICHT) */}
      <div className="glass-card p-3.5 sm:p-4 space-y-3 relative z-30">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-surface-100 flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-brand-400" />
            1. Kunde wählen ({driverIsolatedCustomers.length} Kunden)
          </label>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/90 px-2 py-0.5 rounded-lg border border-emerald-800/40">
            Kd.-Nr: {driverPrefix}xxxx
          </span>
        </div>

        {/* ROUTEN-TAGESFILTER (Tage antippen) */}
        <div className="space-y-1.5 bg-surface-950/70 p-2.5 rounded-xl border border-surface-800">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-surface-400 flex items-center gap-1 font-medium">
              <Calendar className="w-3.5 h-3.5 text-brand-400" />
              Tour für Wochentag:
            </span>
            {selectedDayFilter === todayDigit && (
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800">
                Heute: {todayName}
              </span>
            )}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {WEEKDAYS.map((w) => (
              <button
                key={w.digit}
                type="button"
                onClick={() => setSelectedDayFilter(w.digit)}
                className={`py-1.5 rounded-lg text-xs font-bold transition-all text-center active:scale-95 ${
                  selectedDayFilter === w.digit
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-900/40'
                    : 'bg-surface-900 text-surface-400 hover:text-surface-200 border border-surface-800'
                }`}
              >
                {w.short}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setSelectedDayFilter('all')}
              className={`py-1.5 rounded-lg text-[10px] font-bold transition-all text-center active:scale-95 ${
                selectedDayFilter === 'all'
                  ? 'bg-surface-700 text-surface-50'
                  : 'bg-surface-900 text-surface-500 border border-surface-800'
              }`}
            >
              Alle
            </button>
          </div>
        </div>

        {/* GEWÄHLTER KUNDE BADGE */}
        {selectedCustomer ? (
          <div className="p-3 bg-brand-950/80 border-2 border-brand-500 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-brand-300 font-mono">
                Kd.-Nr. {selectedCustomer.customer_number}
              </p>
              <p className="text-sm font-black text-surface-50">{selectedCustomer.company_name}</p>
              {selectedCustomer.city && (
                <p className="text-[10px] text-surface-400">{selectedCustomer.city}</p>
              )}
            </div>
            <button
              type="button"
              onClick={clearCustomer}
              className="p-2 rounded-lg bg-surface-900 text-surface-400 hover:text-surface-100 hover:bg-surface-800 transition-colors"
              title="Kunde wechseln"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
          /* KINDERLEICHTE KUNDEN-SCHNELLKACHELN (EINFACH ANTSCHAUEN & TIPPEN) */
          <div className="space-y-2">
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {/* LAUFKUNDE BUTTON */}
              <button
                type="button"
                onClick={() => {
                  setSelectedCustomer(null)
                  setCustSearchTerm('🛒 Laufkunde / Barverkauf (0% Rabatt)')
                }}
                className="shrink-0 p-3 rounded-xl bg-surface-950 border-2 border-dashed border-emerald-500/60 hover:border-emerald-400 text-left active:scale-95 transition-all w-44"
              >
                <p className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  🛒 Barverkauf
                </p>
                <p className="text-sm font-black text-surface-100 mt-0.5 truncate">Laufkunde</p>
                <p className="text-[10px] text-surface-400">0% Rabatt</p>
              </button>

              {/* HEUTIGE KUNDEN DER TOUR */}
              {driverIsolatedCustomers.slice(0, 12).map((cust) => (
                <button
                  key={cust.id || cust.customer_number}
                  type="button"
                  onClick={() => selectCustomer(cust)}
                  className="shrink-0 p-3 rounded-xl bg-surface-900 border border-surface-700 hover:border-brand-500 text-left active:scale-95 transition-all w-48 space-y-0.5"
                >
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-brand-950 text-brand-400 border border-brand-800 inline-block">
                    {cust.customer_number}
                  </span>
                  <p className="text-xs font-bold text-surface-100 truncate">{cust.company_name}</p>
                  <p className="text-[10px] text-surface-400 truncate">{cust.city || '—'}</p>
                </button>
              ))}
            </div>

            {/* ODER SUCHFELD FÜR MANUELLE EINGABE */}
            <div ref={custWrapperRef} className="relative pt-1">
              <div className="relative flex items-center">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500 pointer-events-none" />
                <input
                  type="text"
                  value={custSearchTerm}
                  onChange={(e) => {
                    setCustSearchTerm(e.target.value)
                    setShowCustDropdown(true)
                  }}
                  onFocus={() => setShowCustDropdown(true)}
                  placeholder="Kunde suchen (Name oder Kd.-Nr.)…"
                  className="input pl-9 pr-8 py-2.5 text-xs bg-surface-950 font-medium w-full border-surface-700 rounded-xl"
                />
                {custSearchTerm && (
                  <button
                    type="button"
                    onClick={clearCustomer}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* DROPDOWN MATCHES */}
              {showCustDropdown && !selectedCustomer && (
                <div className="absolute left-0 top-full mt-1.5 z-50 w-full bg-surface-900 border border-surface-700 rounded-xl shadow-2xl overflow-hidden animate-in">
                  <ul className="max-h-56 overflow-y-auto divide-y divide-surface-800/40">
                    {custMatches.map((c, i) => (
                      <li key={c.id || c.customer_number || i}>
                        <button
                          type="button"
                          onClick={() => selectCustomer(c)}
                          className="w-full text-left px-3.5 py-3 flex items-center gap-3 hover:bg-brand-900/40 text-surface-200 transition-colors"
                        >
                          <span className="font-mono text-xs font-bold px-2 py-1 rounded bg-brand-950 text-brand-400 border border-brand-800 shrink-0">
                            {c.customer_number}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold truncate text-surface-100">{c.company_name}</p>
                            <p className="text-[10px] text-surface-400">{c.city || '—'}</p>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* STEP 2: PRODUKT-SCHNELLAUSWAHL (TOUCH-FIRST & MIT TOUCH-NUMPAD) */}
      <div className="glass-card p-3.5 sm:p-4 space-y-3 relative z-20">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-surface-100 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-emerald-400" />
            2. Artikel erfassen ({catalogProducts.length} auf Fahrzeug)
          </label>
          <div className="flex bg-surface-950 p-1 rounded-xl border border-surface-800">
            <button
              type="button"
              onClick={() => setViewMode('touch_catalog')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                viewMode === 'touch_catalog'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-surface-400 hover:text-surface-200'
              }`}
            >
              <Grid className="w-3.5 h-3.5" /> Touch-Kacheln
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                viewMode === 'table'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-surface-400 hover:text-surface-200'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" /> Tabelle
            </button>
          </div>
        </div>

        {/* TOUCH-CATALOG MODE (KINDERLEICHTE ARTIKEL-CARDS MIT GROSSEN BUTTONS) */}
        {viewMode === 'touch_catalog' ? (
          <div className="space-y-2.5">
            <div className="grid grid-cols-1 gap-2.5">
              {catalogProducts.map((prod) => {
                const vehStock = stockMap[vehicleLocId]?.[prod.sku] ?? (prod.stock ?? 0)
                const inCartLine = lines.find(l => l.product?.sku === prod.sku)
                const inCartQty = inCartLine?.qty ?? 0
                const isOutOfStock = vehStock <= 0

                return (
                  <div
                    key={prod.id || prod.sku}
                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      inCartQty > 0
                        ? 'bg-brand-950/40 border-brand-500/80 shadow-lg shadow-brand-950/40'
                        : isOutOfStock
                        ? 'bg-surface-950/40 border-surface-800/40 opacity-50'
                        : 'bg-surface-900/80 border-surface-700/80 hover:border-surface-600'
                    }`}
                  >
                    {/* Artikel Infos */}
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono font-black px-1.5 py-0.5 rounded bg-brand-950 text-brand-400 border border-brand-800">
                          {prod.sku}
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                          vehStock > 0 ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60' : 'bg-danger-950 text-danger-400 border-danger-800'
                        }`}>
                          Lager: {vehStock} {prod.unit}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-surface-50 truncate">{prod.name}</p>
                      <p className="text-xs font-bold text-emerald-400">{formatCurrency(prod.selling_price)} / {prod.unit}</p>
                    </div>

                    {/* Touch Action Controls */}
                    <div className="shrink-0 flex items-center gap-1">
                      {inCartQty > 0 ? (
                        <div className="flex items-center gap-1.5 bg-surface-950 p-1.5 rounded-xl border border-brand-500/60">
                          {/* Minus 1 Button */}
                          <button
                            type="button"
                            onClick={() => addOrIncrementProduct(prod, -1)}
                            className="w-9 h-9 rounded-lg bg-surface-800 hover:bg-surface-700 active:scale-95 text-surface-100 font-bold flex items-center justify-center transition-all"
                          >
                            <Minus className="w-4 h-4" />
                          </button>

                          {/* Quantiy Display (Tapping opens NumPad) */}
                          <button
                            type="button"
                            onClick={() => setActiveNumpadLine({
                              lineId: inCartLine!.id,
                              title: `Menge für [${prod.sku}] ${prod.name}`,
                              subtitle: `Verfügbar auf Fahrzeug: ${vehStock} ${prod.unit}`,
                              initialValue: inCartQty,
                              max: vehStock,
                            })}
                            className="px-3 h-9 rounded-lg bg-brand-900 border border-brand-500 text-emerald-300 font-mono font-black text-base flex items-center justify-center shadow-inner active:scale-95"
                          >
                            {inCartQty}
                          </button>

                          {/* Plus 1 Button */}
                          <button
                            type="button"
                            disabled={inCartQty >= vehStock}
                            onClick={() => addOrIncrementProduct(prod, 1)}
                            className="w-9 h-9 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 active:scale-95 text-white font-bold flex items-center justify-center transition-all"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        /* Big + Add Button */
                        <button
                          type="button"
                          disabled={isOutOfStock}
                          onClick={() => addOrIncrementProduct(prod, 1)}
                          className="py-2.5 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all"
                        >
                          <Plus className="w-4 h-4 stroke-[3]" />
                          Hinzufügen
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          /* TABELLEN-MODUS MEHRFACH-EINGABE */
          <div className="space-y-2">
            <div className="space-y-1.5">
              {lines.map((line, idx) => {
                const vehStock = line.product ? (stockMap[vehicleLocId]?.[line.product.sku] ?? 0) : 0
                return (
                  <div
                    key={line.id}
                    className="p-2.5 rounded-xl bg-surface-900 border border-surface-700 flex items-center justify-between gap-2"
                  >
                    <span className="text-xs font-mono font-bold text-brand-400 w-5">{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-surface-100 truncate">
                        {line.product ? `[${line.product.sku}] ${line.product.name}` : 'Kein Artikel'}
                      </p>
                      {line.product && (
                        <p className="text-[10px] text-surface-400">
                          Preis: {formatCurrency(line.product.selling_price)} · Max: {vehStock}
                        </p>
                      )}
                    </div>
                    {line.product && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setActiveNumpadLine({
                            lineId: line.id,
                            title: `Menge für [${line.product!.sku}] ${line.product!.name}`,
                            subtitle: `Verfügbar: ${vehStock} Stk.`,
                            initialValue: line.qty,
                            max: vehStock,
                          })}
                          className="px-3 py-1.5 bg-surface-950 border border-brand-500 rounded-lg text-emerald-300 font-mono font-bold text-sm"
                        >
                          {line.qty} Stk. ✏️
                        </button>
                        <button
                          type="button"
                          onClick={() => removeLine(line.id)}
                          className="p-1.5 text-surface-500 hover:text-danger-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* WARENKORB & GESAMTSUMME (Vollständige Übersicht) */}
      {validLines.length > 0 && (
        <div className="glass-card p-4 space-y-3.5 relative z-10 animate-in border-emerald-500/50 bg-gradient-to-b from-surface-900 to-surface-950">
          <div className="flex items-center justify-between border-b border-surface-800 pb-2">
            <h3 className="text-xs font-bold text-surface-100 flex items-center gap-1.5">
              <ShoppingCart className="w-4 h-4 text-emerald-400" />
              Warenkorb ({validLines.length} Positionen)
            </h3>
            <button
              type="button"
              onClick={() => setLines([])}
              className="text-[10px] text-surface-400 hover:text-danger-400 underline"
            >
              Korb leeren
            </button>
          </div>

          {/* LISTE DER GEWÄHLTEN ARTIKEL MIT STEPPERN */}
          <div className="space-y-2 max-h-48 overflow-y-auto divide-y divide-surface-800/40 pr-1">
            {validLines.map((line) => {
              const vehStock = stockMap[vehicleLocId]?.[line.product!.sku] ?? (line.product!.stock ?? 0)
              const lineTotal = line.qty * line.product!.selling_price

              return (
                <div key={line.id} className="pt-2 first:pt-0 flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-surface-100 truncate">{line.product!.name}</p>
                    <p className="text-[10px] text-surface-400 font-mono">
                      {line.qty} × {formatCurrency(line.product!.selling_price)} = <strong className="text-surface-200">{formatCurrency(lineTotal)}</strong>
                    </p>
                  </div>

                  {/* Quick Stepper +/- Buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setProductQty(line.product!.sku, line.qty - 1)}
                      className="w-7 h-7 rounded-lg bg-surface-800 hover:bg-surface-700 text-surface-200 font-bold text-xs flex items-center justify-center active:scale-95"
                    >
                      -
                    </button>
                    
                    {/* Tapping quantity opens Touch NumPad */}
                    <button
                      type="button"
                      onClick={() => setActiveNumpadLine({
                        lineId: line.id,
                        title: `Menge für ${line.product!.name}`,
                        subtitle: `Maximal verfügbar: ${vehStock} ${line.product!.unit}`,
                        initialValue: line.qty,
                        max: vehStock,
                      })}
                      className="px-2.5 py-1 rounded-lg bg-surface-950 border border-emerald-500/60 font-mono font-bold text-xs text-emerald-300 active:scale-95"
                    >
                      {line.qty}
                    </button>

                    <button
                      type="button"
                      disabled={line.qty >= vehStock}
                      onClick={() => setProductQty(line.product!.sku, line.qty + 1)}
                      className="w-7 h-7 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center active:scale-95 disabled:opacity-40"
                    >
                      +
                    </button>

                    <button
                      type="button"
                      onClick={() => removeLine(line.id)}
                      className="p-1 text-surface-500 hover:text-danger-400 ml-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Summen-Berechnung */}
          <div className="space-y-1 text-xs pt-2 border-t border-surface-800">
            <div className="flex justify-between text-surface-400">
              <span>Zwischensumme</span>
              <span className="tabular-nums font-mono">{formatCurrency(subtotal)}</span>
            </div>
            {discountVal > 0 && (
              <div className="flex justify-between text-success-400">
                <span>Kundenrabatt ({discountPct}%)</span>
                <span className="tabular-nums font-mono">-{formatCurrency(discountVal)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-surface-50 pt-2 border-t border-surface-700">
              <span>Gesamtsumme</span>
              <span className="text-emerald-400 tabular-nums font-bold text-xl">{formatCurrency(totalVal)}</span>
            </div>
          </div>

          {/* Zahlungsart & Buchen-Button */}
          <div className="space-y-2.5 pt-2 border-t border-surface-800">
            <label className="text-[11px] font-semibold text-surface-400 uppercase tracking-wider block">
              Zahlungsart wählen
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`py-2.5 px-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors active:scale-95 ${
                  paymentMethod === 'cash'
                    ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-md'
                    : 'bg-surface-900 border-surface-700 text-surface-400'
                }`}
              >
                <Banknote className="w-4 h-4" /> Bar
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`py-2.5 px-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors active:scale-95 ${
                  paymentMethod === 'card'
                    ? 'bg-brand-950/80 border-brand-500 text-brand-300 shadow-md'
                    : 'bg-surface-900 border-surface-700 text-surface-400'
                }`}
              >
                <CreditCard className="w-4 h-4" /> Karte
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('invoice')}
                className={`py-2.5 px-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors active:scale-95 ${
                  paymentMethod === 'invoice'
                    ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 shadow-md'
                    : 'bg-surface-900 border-surface-700 text-surface-400'
                }`}
              >
                <FileText className="w-4 h-4" /> Rechnung
              </button>
            </div>

            {hasVehicleStockExceeded && (
              <div className="p-2.5 rounded-xl bg-danger-950/60 border border-danger-500/50 text-danger-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-danger-400 shrink-0" />
                <span>Eine oder mehrere Mengen überschreiten den Fahrzeugbestand!</span>
              </div>
            )}

            <button
              type="button"
              disabled={hasVehicleStockExceeded}
              onClick={handleCompleteSale}
              className="btn-primary w-full btn-lg justify-center mt-2 shadow-glow text-base font-black py-4 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all"
            >
              <CheckCircle2 className="w-6 h-6" />
              Verkauf jetzt buchen ({formatCurrency(totalVal)})
            </button>
          </div>
        </div>
      )}

      {/* TOUCH NUMPAD MODAL FOR NUMERIC INPUT WITHOUT NATIVE OS KEYBOARD */}
      {activeNumpadLine && (
        <TouchNumpadModal
          isOpen={true}
          title={activeNumpadLine.title}
          subtitle={activeNumpadLine.subtitle}
          initialValue={activeNumpadLine.initialValue}
          max={activeNumpadLine.max}
          unit="Stk."
          onClose={() => setActiveNumpadLine(null)}
          onConfirm={(newQty) => {
            const lineToUpdate = lines.find(l => l.id === activeNumpadLine.lineId)
            if (lineToUpdate && lineToUpdate.product) {
              setProductQty(lineToUpdate.product.sku, newQty)
            }
            setActiveNumpadLine(null)
          }}
        />
      )}

      {/* KAMERA RECHNUNGS-SCANNER MODAL */}
      <InvoiceScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanComplete={handleScanComplete}
        driverPrefix={driverPrefix}
      />

    </div>
  )
}

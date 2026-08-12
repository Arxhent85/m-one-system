'use client'

import { useState, useRef } from 'react'
import {
  Camera,
  Check,
  X,
  AlertTriangle,
  ChevronRight,
  Loader2,
  Package,
  User,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Layers,
  RotateCcw,
  Eye,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils/currency'
import { INITIAL_DEPO_PRODUCTS, executeSale, LOCATION_IDS } from '@/lib/stockStore'
import { findNearestMatch } from '@/lib/utils/fuzzyMatch'
import { createClient } from '@/lib/supabase/client'

interface Customer {
  id: string
  customer_number?: string
  company_name: string
  city?: string
}

interface ScannedItem {
  sku: string
  name: string
  qty: number
  unit_price: number
  unit: string
  isExact: boolean
  rawSku?: string
}

interface SaleEntry {
  id: string
  customerNumber: string
  customerName: string
  date: string
  time: string
  items: ScannedItem[]
  total: number
  warnings: string[]
  paymentMethod: 'bar' | 'rechnung' | 'karte'
  imageThumb?: string | null
}

interface ScanJob {
  id: string
  selectedPaymentMethod?: 'bar' | 'rechnung'
  timeStr: string
  status: 'processing' | 'ready' | 'error'
  statusMsg: string
  imageThumb: string
  draft?: any
  error?: string
}

interface DriverAppProps {
  driverName: string
  driverPrefix: string
  customers: Customer[]
}

// ──────────────────────────────────────────────────────────────
// CLIENT-SIDE KONTRAST-ENHANCER & BILDKOMPRIMIERUNG
// ──────────────────────────────────────────────────────────────
function compressImage(file: File, maxWidth = 1600, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) return reject('Canvas error')

        // High quality smooth image scaling
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, 0, 0, width, height)

        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.onerror = (err) => reject(err)
      img.src = event.target?.result as string
    }
    reader.onerror = (err) => reject(err)
    reader.readAsDataURL(file)
  })
}

export default function DriverApp({ driverName, driverPrefix, customers }: DriverAppProps) {
  const [sales, setSales] = useState<SaleEntry[]>([])
  const [selectedSale, setSelectedSale] = useState<SaleEntry | null>(null)

  // Asynchrone Scan-Warteschlange (Batch-Scanning)
  const [scanJobs, setScanJobs] = useState<ScanJob[]>([])
  const [activeJobId, setActiveJobId] = useState<string | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const jobId = Math.random().toString(36).substring(2, 9)
    const timeStr = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })

    try {
      // 1. Sofortige Bildkomprimierung direkt auf dem Smartphone (~100KB)
      const compressedBase64 = await compressImage(file, 1200, 0.75)

      // 2. Job sofort zur Warteschlange hinzufügen — blockiert den Nutzer NICHT!
      const newJob: ScanJob = {
        id: jobId,
        timeStr,
        status: 'processing',
        statusMsg: 'Gemini KI liest Handschrift aus…',
        imageThumb: compressedBase64,
      }

      setScanJobs((prev) => [newJob, ...prev])

      // 3. Asynchroner Aufruf an Backend-API im Hintergrund
      const registeredCustomerNumbers = customers.map((c) => c.customer_number).filter(Boolean)

      fetch('/api/ocr/scan-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: compressedBase64,
          driverPrefix,
          registeredCustomerNumbers,
        }),
      })
        .then((res) => res.json())
        .then((apiData) => {
          if (apiData.success && apiData.data) {
            setScanJobs((prev) =>
              prev.map((job) =>
                job.id === jobId
                  ? {
                      ...job,
                      status: 'ready',
                      statusMsg: 'Fertig ausgelesen!',
                      draft: {
                        ...apiData.data,
                        imageThumb: compressedBase64,
                      },
                    }
                  : job
              )
            )
          } else {
            setScanJobs((prev) =>
              prev.map((job) =>
                job.id === jobId
                  ? {
                      ...job,
                      status: 'error',
                      error: apiData.error || 'Fehler beim Lesen des Rechnungsfotos',
                    }
                  : job
              )
            )
          }
        })
        .catch((err) => {
          setScanJobs((prev) =>
            prev.map((job) =>
              job.id === jobId
                ? {
                    ...job,
                    status: 'error',
                    error: 'Fehler bei der Bildanalyse: ' + (err?.message || 'Unbekannt'),
                  }
                : job
            )
          )
        })
    } catch (err: any) {
      console.error('Image compression error:', err)
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function confirmSale(jobId: string, draft: any, paymentMethod: 'bar' | 'rechnung' | 'karte') {
    const customer = customers.find((c) => c.customer_number === draft.customer_number)
    const now = new Date()
    const entry: SaleEntry = {
      id: Math.random().toString(36).slice(2),
      customerNumber: draft.customer_number || '—',
      customerName: customer?.company_name || (draft.customer_number ? `Kunde #${draft.customer_number}` : 'Unbekannt'),
      date: now.toLocaleDateString('de-DE'),
      time: now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
      items: draft.items || [],
      total: (draft.items || []).reduce((s: number, i: ScannedItem) => s + i.qty * i.unit_price, 0),
      warnings: draft.warnings || [],
      paymentMethod,
      imageThumb: draft.imageThumb || null,
    }

    setSales((prev) => [entry, ...prev])
    setScanJobs((prev) => prev.filter((j) => j.id !== jobId))
    setActiveJobId(null)

    // 1. Deduct Stock from Vehicle Depo (Depo Mensuri vs Depo Qerimi) & save sale to local store
    const vehicleLocId = driverPrefix === '2' ? LOCATION_IDS.MENSURI : LOCATION_IDS.QERIMI
    const vehicleLocName = driverPrefix === '2' ? 'Fahrzeug 1 (Depo Mensuri)' : 'Fahrzeug 2 (Depo Qerimi)'
    const paymentMap = { bar: 'cash', rechnung: 'invoice', karte: 'card' } as const

    try {
      executeSale(
        vehicleLocId,
        vehicleLocName,
        driverName,
        entry.customerNumber,
        entry.customerName,
        (draft.items || []).map((i: ScannedItem) => ({
          sku: i.sku,
          name: i.name,
          qty: i.qty,
          unit_price: i.unit_price,
        })),
        0,
        paymentMap[paymentMethod]
      )
    } catch (e) {
      console.error('Local stock deduction failed:', e)
    }

    // 2. Post to central server API for instant cross-device sync (PC <-> Smartphone)
    try {
      fetch('/api/sales/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverName,
          driverPrefix,
          customerNumber: entry.customerNumber,
          customerName: entry.customerName,
          items: (draft.items || []).map((i: ScannedItem) => ({
            sku: i.sku,
            name: i.name,
            qty: i.qty,
            unit_price: i.unit_price,
          })),
          paymentMethod,
          total: entry.total,
        }),
      }).catch((e) => console.warn('API sale record warning:', e))
    } catch (err) {
      console.error('Server sale save failed:', err)
    }
  }

  function updateDraftQty(jobId: string, idx: number, newQty: number) {
    setScanJobs((prev) =>
      prev.map((job) => {
        if (job.id !== jobId || !job.draft) return job
        const items = [...job.draft.items]
        if (newQty <= 0) {
          items.splice(idx, 1)
        } else {
          items[idx] = { ...items[idx], qty: newQty }
        }
        return {
          ...job,
          draft: { ...job.draft, items },
        }
      })
    )
  }

  function setDraftCustomerNumber(jobId: string, custNo: string) {
    setScanJobs((prev) =>
      prev.map((job) => {
        if (job.id !== jobId || !job.draft) return job
        return {
          ...job,
          draft: { ...job.draft, customer_number: custNo, customer_error: null },
        }
      })
    )
  }

  function addItemToDraft(jobId: string, prod: (typeof INITIAL_DEPO_PRODUCTS)[0]) {
    setScanJobs((prev) =>
      prev.map((job) => {
        if (job.id !== jobId || !job.draft) return job
        const items = [...(job.draft.items || [])]
        const existingIdx = items.findIndex((i) => i.sku === prod.sku)
        if (existingIdx >= 0) {
          items[existingIdx].qty += 1
        } else {
          items.push({
            sku: prod.sku,
            name: prod.name,
            unit: prod.unit,
            qty: 1,
            unit_price: prod.selling_price,
            isExact: true,
          })
        }
        return {
          ...job,
          draft: { ...job.draft, items },
        }
      })
    )
  }

  function triggerRescanJob(jobId: string) {
    setScanJobs((prev) => prev.filter((j) => j.id !== jobId))
    setActiveJobId(null)
    fileInputRef.current?.click()
  }

  const activeJob = scanJobs.find((j) => j.id === activeJobId)
  const processingCount = scanJobs.filter((j) => j.status === 'processing').length

  if (selectedSale) {
    return <SaleDetailView sale={selectedSale} onBack={() => setSelectedSale(null)} />
  }

  return (
    <div className="min-h-screen bg-surface-950 flex flex-col max-w-lg mx-auto pb-32">
      {/* TOP BAR */}
      <div className="sticky top-0 z-20 bg-surface-950/95 backdrop-blur border-b border-surface-800 px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-brand-600 flex items-center justify-center text-white font-black text-sm shadow-glow">
            {driverName[0]?.toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-bold text-surface-50">{driverName}</p>
            <p className="text-[10px] text-surface-400">Fahrzeug · Kd.-Nr. {driverPrefix}xxxx</p>
          </div>
        </div>
        <div className="text-xs text-surface-400 font-mono">{new Date().toLocaleDateString('de-DE')}</div>
      </div>

      {/* HINTERGRUND-ANALYSE STATUS (FALLS AKTIV) */}
      {processingCount > 0 && (
        <div className="px-4 pt-3">
          <div className="p-3 rounded-2xl bg-brand-950/90 border border-brand-800 flex items-center justify-between text-xs text-brand-300 animate-pulse shadow-md">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-brand-400 animate-spin shrink-0" />
              <span className="font-bold">
                {processingCount} {processingCount === 1 ? 'Rechnung' : 'Rechnungen'} wird im Hintergrund analysiert…
              </span>
            </div>
            <span className="text-[10px] text-brand-400 font-mono shrink-0">Parallel-Scan</span>
          </div>
        </div>
      )}

      {/* Hidden file input with camera capture */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handlePhoto}
        className="hidden"
      />

      {/* GESCANNTE RECHNUNGEN (WARTESCHLANGE) */}
      {scanJobs.length > 0 && (
        <div className="px-4 mb-6 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-surface-300 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-brand-400" />
              Scan-Ergebnisse & Warteschlange ({scanJobs.length})
            </p>
          </div>

          <div className="space-y-2.5">
            {scanJobs.map((job) => {
              const cust = job.draft?.customer_number
                ? customers.find((c) => c.customer_number === job.draft.customer_number)
                : null
              const totalAmount = (job.draft?.items || []).reduce(
                (s: number, i: ScannedItem) => s + i.qty * i.unit_price,
                0
              )

              return (
                <div
                  key={job.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    job.status === 'processing'
                      ? 'bg-surface-900/80 border-brand-800/60'
                      : job.status === 'ready'
                      ? 'bg-gradient-to-r from-surface-900 via-surface-900 to-emerald-950/40 border-emerald-500/50 shadow-lg'
                      : 'bg-danger-950/40 border-danger-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    {/* Thumbnail */}
                    <div className="w-12 h-12 rounded-xl bg-black overflow-hidden shrink-0 border border-surface-700 relative">
                      <img src={job.imageThumb} alt="Scan" className="w-full h-full object-cover" />
                      {job.status === 'processing' && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <Loader2 className="w-5 h-5 text-brand-400 animate-spin" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-surface-400 font-mono">{job.timeStr} Uhr</span>
                        {job.status === 'processing' && (
                          <span className="text-[10px] bg-brand-950 text-brand-400 px-2 py-0.5 rounded-full font-bold border border-brand-800">
                            ⏳ Liest aus…
                          </span>
                        )}
                        {job.status === 'ready' && (
                          <span className="text-[10px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded-full font-bold border border-emerald-800 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Bereit!
                          </span>
                        )}
                      </div>

                      {job.status === 'processing' && (
                        <p className="text-xs text-surface-300 font-medium mt-1 animate-pulse">
                          Gemini KI liest Handschrift aus…
                        </p>
                      )}

                      {job.status === 'ready' && (
                        <div className="mt-1">
                          <p className="text-xs font-bold text-surface-100 truncate">
                            Kd. {job.draft?.customer_number || 'Unbekannt'} · {cust?.company_name || 'Kunde'}
                          </p>
                          <p className="text-[11px] text-surface-400 font-mono mt-0.5">
                            {job.draft?.items?.length ?? 0} Positionen ·{' '}
                            <span className="text-emerald-400 font-bold">{formatCurrency(totalAmount)}</span>
                          </p>
                        </div>
                      )}

                      {job.status === 'error' && (
                        <p className="text-xs text-danger-400 font-bold mt-1">
                          ⚠️ {job.error || 'Lesefehler beim Scan'}
                        </p>
                      )}
                    </div>

                    {/* Action Buttons: Prüfen (links), Rechnung (klein) & Buchen (rechts, grün, 1-Click) */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {job.status === 'ready' && (
                        <>
                          <button
                            type="button"
                            onClick={() => triggerRescanJob(job.id)}
                            title="Foto neu aufnehmen"
                            className="p-1.5 rounded-xl bg-surface-800 hover:bg-surface-700 active:scale-90 text-surface-300 transition-all"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-brand-400" />
                          </button>

                          {/* 1. Prüfen Button (Links) */}
                          <button
                            type="button"
                            onClick={() => setActiveJobId(job.id)}
                            className="px-2.5 py-2 rounded-xl bg-surface-800 hover:bg-surface-700 border border-surface-700 active:scale-95 text-surface-200 font-semibold text-xs flex items-center gap-1 transition-all"
                            title="Prüfen & Details ansehen"
                          >
                            <Eye className="w-3.5 h-3.5 text-brand-400" />
                            <span>Prüfen</span>
                          </button>

                          {/* 2. Kleiner 3. Button: Auf Rechnung Option (selten genutzt) */}
                          <button
                            type="button"
                            onClick={() => {
                              setScanJobs((prev) =>
                                prev.map((j) =>
                                  j.id === job.id
                                    ? {
                                        ...j,
                                        selectedPaymentMethod:
                                          j.selectedPaymentMethod === 'rechnung' ? 'bar' : 'rechnung',
                                      }
                                    : j
                                )
                              )
                            }}
                            className={`px-2 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-all ${
                              job.selectedPaymentMethod === 'rechnung'
                                ? 'bg-brand-950 border-brand-500 text-brand-300 shadow-glow'
                                : 'bg-surface-800/80 hover:bg-surface-700 border-surface-700 text-surface-400'
                            }`}
                            title={
                              job.selectedPaymentMethod === 'rechnung'
                                ? 'Zahlungsart: Auf Rechnung (Aktiv)'
                                : 'Klick für Zahlungsart: Auf Rechnung'
                            }
                          >
                            <span>🧾</span>
                            {job.selectedPaymentMethod === 'rechnung' && (
                              <span className="text-[10px] font-bold">Rech.</span>
                            )}
                          </button>

                          {/* 3. Buchen Button (Sofort 1-Klick Buchung ohne Fenster!) */}
                          <button
                            type="button"
                            onClick={() => {
                              confirmSale(
                                job.id,
                                job.draft,
                                job.selectedPaymentMethod || 'bar'
                              )
                            }}
                            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs flex items-center gap-1 shadow-md transition-all"
                            title="Sofort 1-Klick Buchen"
                          >
                            <span>Buchen</span>
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {job.status === 'error' && (
                        <>
                          <button
                            type="button"
                            onClick={() => triggerRescanJob(job.id)}
                            className="px-3 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs flex items-center gap-1 shadow-md"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Neu scannen</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setScanJobs((prev) => prev.filter((j) => j.id !== job.id))}
                            className="p-2 rounded-xl bg-surface-800 text-surface-400 text-xs"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* LISTE DER HEUTIGEN GEBUCHTEN VERKÄUFE */}
      <div className="px-4 pb-12 flex-1">
        {sales.length === 0 ? (
          scanJobs.length === 0 && (
            <div className="text-center py-14 space-y-2">
              <Package className="w-12 h-12 text-surface-700 mx-auto" />
              <p className="text-sm text-surface-500 font-medium">Noch keine Verkäufe heute</p>
              <p className="text-xs text-surface-600">Rechnung scannen um zu starten</p>
            </div>
          )
        ) : (
          <div className="space-y-2.5">
            <p className="text-xs font-bold text-surface-400 uppercase tracking-wider mb-2">
              Gebuchte Verkäufe heute ({sales.length})
            </p>
            {sales.map((sale) => (
              <button
                key={sale.id}
                type="button"
                onClick={() => setSelectedSale(sale)}
                className="w-full p-4 rounded-2xl bg-surface-900 border border-surface-800 hover:border-brand-500/60 active:scale-98 text-left transition-all group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-brand-950 text-brand-400 border border-brand-800">
                        {sale.customerNumber}
                      </span>
                      {sale.warnings.length > 0 && <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                    </div>
                    <p className="text-sm font-bold text-surface-100 truncate">{sale.customerName}</p>
                    <p className="text-xs text-surface-400 mt-0.5">
                      {sale.items.length} Artikel · {sale.time} Uhr ·{' '}
                      <span
                        className={`font-semibold ${
                          sale.paymentMethod === 'bar'
                            ? 'text-emerald-400'
                            : sale.paymentMethod === 'rechnung'
                            ? 'text-cyan-400'
                            : 'text-brand-400'
                        }`}
                      >
                        {sale.paymentMethod === 'bar'
                          ? '💵 Bar'
                          : sale.paymentMethod === 'rechnung'
                          ? '📄 Rechnung'
                          : '💳 Karte'}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <p className="text-base font-black text-emerald-400 tabular-nums font-mono">
                      {formatCurrency(sale.total)}
                    </p>
                    <ChevronRight className="w-4 h-4 text-surface-600 group-hover:text-brand-400 transition-colors" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* SCAN REVIEW MODAL FÜR DAS AKTIVE JOB-ERGEBNIS */}
      {activeJob && activeJob.draft && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-end justify-center">
          <div className="w-full max-w-lg bg-surface-900 rounded-t-3xl overflow-hidden h-[92vh] flex flex-col animate-in slide-in-from-bottom duration-200">
            {/* Modal Header */}
            <div className="px-4 pt-4 pb-3 border-b border-surface-800 flex items-center justify-between shrink-0 bg-surface-900">
              <div>
                <p className="text-base font-bold text-surface-50 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  Gescannte Rechnungsdaten
                </p>
                <p className="text-[10px] text-surface-400 font-mono">Scan vom {activeJob.timeStr} Uhr</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveJobId(null)}
                className="w-9 h-9 rounded-full bg-surface-800 flex items-center justify-center text-surface-400 active:scale-90"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto">
              <ScanReview
                draft={activeJob.draft}
                customers={customers}
                driverPrefix={driverPrefix}
                onQtyChange={(idx, qty) => updateDraftQty(activeJob.id, idx, qty)}
                onCustomerChange={(custNo) => setDraftCustomerNumber(activeJob.id, custNo)}
                onAddItem={(prod) => addItemToDraft(activeJob.id, prod)}
                onConfirm={(payment) => confirmSale(activeJob.id, activeJob.draft, payment)}
                onCancel={() => setActiveJobId(null)}
                onRescan={() => triggerRescanJob(activeJob.id)}
              />
            </div>
          </div>
        </div>
      )}



      {/* FLOATING ACTION BUTTON (FAB) UNTEN RECHTS - SCHNELLE DAUMEN-BEDIENUNG */}
      <div className="fixed bottom-20 right-4 z-40">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-3.5 rounded-full bg-gradient-to-r from-brand-600 via-emerald-600 to-teal-600 text-white font-bold text-sm shadow-2xl border border-emerald-400/50 flex items-center gap-2.5 active:scale-90 hover:scale-105 transition-all shadow-glow"
        >
          <Camera className="w-5 h-5 shrink-0" />
          <span>{scanJobs.length > 0 ? 'Weitere scannen' : 'Rechnung scannen'}</span>
        </button>
      </div>
    </div>
  )
}

// ──────────────────────────────────────
// SCAN REVIEW (Prüfung & Manuelle Korrektur)
// ──────────────────────────────────────
function ScanReview({
  draft,
  customers,
  driverPrefix,
  onQtyChange,
  onCustomerChange,
  onAddItem,
  onConfirm,
  onCancel,
  onRescan,
}: {
  draft: any
  customers: Customer[]
  driverPrefix: string
  onQtyChange: (idx: number, qty: number) => void
  onCustomerChange: (custNo: string) => void
  onAddItem: (prod: (typeof INITIAL_DEPO_PRODUCTS)[0]) => void
  onConfirm: (payment: 'bar' | 'rechnung' | 'karte') => void
  onCancel: () => void
  onRescan?: () => void
}) {
  const [payment, setPayment] = useState<'bar' | 'rechnung' | 'karte'>('bar')
  const [showAddProduct, setShowAddProduct] = useState(false)

  // Driver specific customer list
  const driverCustomers = customers.filter((c) => String(c.customer_number || '').startsWith(driverPrefix))
  const displayCustomers = driverCustomers.length > 0 ? driverCustomers : customers

  const matchedCust = customers.find((c) => c.customer_number === draft.customer_number)

  return (
    <div className="p-4 space-y-4 pb-32">
      {/* Thumbnail Vorschau mit "Foto neu aufnehmen" Button */}
      {draft.imageThumb && (
        <div className="rounded-2xl overflow-hidden border border-surface-800 bg-black relative group">
          <img src={draft.imageThumb} alt="Vorschau" className="object-contain max-h-44 w-full" />
          <div className="p-2 bg-surface-900 border-t border-surface-800 flex items-center justify-between">
            <span className="text-[10px] text-surface-400 font-mono">🔒 In-Memory RAM Verarbeitung</span>
            {onRescan && (
              <button
                type="button"
                onClick={onRescan}
                className="px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Foto neu aufnehmen</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Ungültige / Unbekannte Kundennummer Warning */}
      {draft.customer_error && (
        <div className="p-3 rounded-xl bg-amber-950/90 border border-amber-700 text-amber-300 text-xs space-y-1">
          <p className="font-bold flex items-center gap-1.5 text-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            Kundennummer-Hinweis:
          </p>
          <p className="text-amber-200">{draft.customer_error}</p>
        </div>
      )}

      {/* Warnungen */}
      {draft.warnings?.length > 0 && (
        <div className="p-3 rounded-xl bg-surface-950 border border-surface-800 text-surface-300 text-xs space-y-1">
          <p className="font-bold flex items-center gap-1.5 text-brand-300">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            Hinweise zum Scan:
          </p>
          {draft.warnings.map((w: string, i: number) => (
            <p key={i} className="text-surface-400">
              · {w}
            </p>
          ))}
        </div>
      )}

      {/* Kundennummer Wählen / Anpassen */}
      <div className="p-3.5 rounded-xl bg-surface-950 border border-surface-800 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-surface-400 uppercase tracking-wider">
            Kundennummer (aus Emri i blerësit)
          </span>
          <User className="w-4 h-4 text-brand-400" />
        </div>
        <select
          value={draft.customer_number || ''}
          onChange={(e) => onCustomerChange(e.target.value)}
          className="w-full bg-surface-900 border border-surface-700 rounded-xl px-3 py-2.5 text-sm font-bold text-surface-100 focus:outline-none focus:border-brand-500"
        >
          <option value="">-- Kunden wählen --</option>
          {displayCustomers.map((c) => (
            <option key={c.id} value={c.customer_number}>
              Kd.-Nr. {c.customer_number} — {c.company_name} ({c.city})
            </option>
          ))}
        </select>
        {matchedCust && (
          <p className="text-xs text-emerald-400 font-bold px-1">
            ✓ {matchedCust.company_name} ({matchedCust.city})
          </p>
        )}
      </div>

      {/* Artikel Liste mit Mengen-Korrektur */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-surface-400 uppercase tracking-wider">
            Positionen ({draft.items?.length ?? 0})
          </p>
          <button
            type="button"
            onClick={() => setShowAddProduct(!showAddProduct)}
            className="text-xs font-bold text-brand-400 hover:text-brand-300 flex items-center gap-1 bg-brand-950 px-2.5 py-1.5 rounded-lg border border-brand-900"
          >
            <Plus className="w-3.5 h-3.5" /> Artikel hinzufügen
          </button>
        </div>

        {/* Quick Add Product Dropdown */}
        {showAddProduct && (
          <div className="p-3 rounded-xl bg-surface-950 border border-brand-800 space-y-2">
            <p className="text-xs font-bold text-surface-300">Artikel antippen zum Hinzufügen:</p>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {INITIAL_DEPO_PRODUCTS.map((prod) => (
                <button
                  key={prod.id}
                  type="button"
                  onClick={() => {
                    onAddItem(prod)
                    setShowAddProduct(false)
                  }}
                  className="w-full text-left p-2.5 rounded-lg bg-surface-900 hover:bg-surface-800 flex justify-between items-center text-xs font-medium text-surface-200 active:scale-98 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black font-mono text-brand-300 bg-brand-950 px-2 py-0.5 rounded border border-brand-800">
                      {prod.sku}
                    </span>
                    <span className="text-xs font-medium text-surface-300 truncate">{prod.name}</span>
                  </div>
                  <span className="text-emerald-400 font-bold font-mono ml-2 shrink-0">{formatCurrency(prod.selling_price)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {(draft.items || []).length === 0 ? (
          <div className="p-4 text-center rounded-xl bg-surface-950 border border-surface-800 text-xs text-surface-400">
            Keine Positionen auf dem Foto erkannt. Tippe oben auf <strong>&quot;+ Artikel hinzufügen&quot;</strong> oder <strong>&quot;Foto neu aufnehmen&quot;</strong>.
          </div>
        ) : (
          (draft.items || []).map((item: ScannedItem, idx: number) => (
            <div
              key={idx}
              className={`p-3 rounded-xl border ${
                !item.isExact ? 'bg-amber-950/30 border-amber-700/60' : 'bg-surface-950 border-surface-800'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="mb-1">
                    <span className="text-base font-black font-mono tracking-wider text-brand-300 bg-brand-950 px-2.5 py-1 rounded-lg border border-brand-800 shadow-sm inline-block">
                      {item.sku}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-surface-300 truncate">{item.name}</p>
                  <p className="text-[10px] text-surface-400 mt-0.5">
                    {formatCurrency(item.unit_price)} / {item.unit}
                  </p>
                </div>

                {/* Menge +/- Korrektur */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => onQtyChange(idx, item.qty - 1)}
                    className="w-8 h-8 rounded-lg bg-surface-800 text-surface-200 font-bold flex items-center justify-center active:scale-90"
                  >
                    {item.qty === 1 ? <Trash2 className="w-3.5 h-3.5 text-danger-400" /> : <Minus className="w-3.5 h-3.5" />}
                  </button>
                  <span className="w-9 text-center font-black text-emerald-400 text-base font-mono">{item.qty}</span>
                  <button
                    type="button"
                    onClick={() => onQtyChange(idx, item.qty + 1)}
                    className="w-8 h-8 rounded-lg bg-emerald-700 text-white font-bold flex items-center justify-center active:scale-90"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Gesamtsumme */}
      <div className="p-3.5 rounded-xl bg-surface-950 border border-surface-800 flex justify-between items-center">
        <p className="text-sm font-bold text-surface-300">Gesamtsumme</p>
        <p className="text-xl font-black text-emerald-400 tabular-nums font-mono">
          {formatCurrency(
            (draft.items || []).reduce((s: number, i: ScannedItem) => s + i.qty * i.unit_price, 0)
          )}
        </p>
      </div>

      {/* Zahlungsart */}
      <div className="grid grid-cols-3 gap-2">
        {(['bar', 'rechnung', 'karte'] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPayment(p)}
            className={`py-3 rounded-xl border text-xs font-bold capitalize transition-all active:scale-95 ${
              payment === p
                ? 'bg-emerald-600 border-emerald-500 text-white shadow-md'
                : 'bg-surface-950 border-surface-800 text-surface-400'
            }`}
          >
            {p === 'bar' ? '💵 Bar' : p === 'rechnung' ? '📄 Rechnung' : '💳 Karte'}
          </button>
        ))}
      </div>

      {/* Bestätigen / Abbrechen (GUT SICHTBAR AM BODEN) */}
      <div className="flex gap-2.5 pt-3 pb-8">
        <button
          type="button"
          onClick={onCancel}
          className="py-4 px-5 rounded-2xl bg-surface-800 hover:bg-surface-700 text-surface-200 text-sm font-bold transition-all active:scale-95"
        >
          Abbrechen
        </button>
        <button
          type="button"
          onClick={() => onConfirm(payment)}
          className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white text-base font-black flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl shadow-emerald-950/60"
        >
          <Check className="w-6 h-6 stroke-[3]" />
          Verkauf buchen
        </button>
      </div>
    </div>
  )
}

// ──────────────────────────────────────
// DETAIL-ANSICHT EINES VERKAUFS
// ──────────────────────────────────────
function SaleDetailView({ sale, onBack }: { sale: SaleEntry; onBack: () => void }) {
  return (
    <div className="min-h-screen bg-surface-950 max-w-lg mx-auto flex flex-col pb-32">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-surface-950/95 backdrop-blur border-b border-surface-800 px-4 py-3 flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-surface-800 flex items-center justify-center text-surface-300 active:scale-90"
        >
          <X className="w-4 h-4" />
        </button>
        <div>
          <p className="text-sm font-bold text-surface-50">{sale.customerName}</p>
          <p className="text-[10px] text-surface-400">
            Kd.-Nr. {sale.customerNumber} · {sale.date} · {sale.time} Uhr
          </p>
        </div>
      </div>

      <div className="p-4 space-y-4 flex-1">
        {/* Foto-Vorschau (Thumbnail) */}
        {sale.imageThumb && (
          <div className="rounded-2xl overflow-hidden border border-surface-700 bg-black">
            <img src={sale.imageThumb} alt="Gescannte Rechnung" className="w-full object-contain max-h-72" />
            <p className="text-center text-[10px] text-surface-500 py-1.5 border-t border-surface-800 bg-surface-900">
              🔒 Nur in der Sitzung im RAM — 0 Bytes abgespeichert
            </p>
          </div>
        )}

        {/* Artikel Details */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-surface-400 uppercase tracking-wider">
            Positionen ({sale.items.length})
          </p>
          {sale.items.map((item, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-surface-900 border border-surface-800 flex items-center justify-between"
            >
              <div className="min-w-0 flex-1">
                <span className="text-base font-black font-mono tracking-wider text-brand-300 bg-brand-950 px-2.5 py-1 rounded-lg border border-brand-800 shadow-sm inline-block mb-1">
                  {item.sku}
                </span>
                <p className="text-xs font-medium text-surface-300 truncate">{item.name}</p>
                <p className="text-[10px] text-surface-400 mt-0.5">
                  {item.qty} × {formatCurrency(item.unit_price)}
                </p>
              </div>
              <p className="text-sm font-black text-emerald-400 tabular-nums ml-3 font-mono">
                {formatCurrency(item.qty * item.unit_price)}
              </p>
            </div>
          ))}
        </div>

        {/* Summe & Zahlungsart */}
        <div className="p-4 rounded-2xl bg-surface-900 border border-surface-700 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-surface-300">Gesamtsumme</span>
            <span className="text-2xl font-black text-emerald-400 tabular-nums font-mono">
              {formatCurrency(sale.total)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-surface-500">Zahlungsart</span>
            <span className="text-xs font-bold text-surface-200">
              {sale.paymentMethod === 'bar'
                ? '💵 Barzahlung'
                : sale.paymentMethod === 'rechnung'
                ? '📄 Auf Rechnung'
                : '💳 Kartenzahlung'}
            </span>
          </div>
        </div>
      </div>

      {/* Schnellbuchungs-Modal (Direct Booking ohne Menü) */}
      {quickBookJob && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-surface-900 border border-surface-700 rounded-3xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-950 text-emerald-400 border border-emerald-800/80 flex items-center justify-center font-bold text-base shadow-glow">
                  ⚡
                </div>
                <div>
                  <h3 className="font-bold text-surface-100 text-sm">Direkt buchen (Schnellbuchung)</h3>
                  <p className="text-[11px] text-surface-400">Wähle die Zahlungsart zum sofortigen Buchen</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuickBookJob(null)}
                className="p-2 rounded-full bg-surface-800 text-surface-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Rechnungs-Info Summary */}
            <div className="p-3.5 rounded-2xl bg-surface-950 border border-surface-800 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-surface-400">Kunde:</span>
                <span className="font-bold text-surface-100 truncate max-w-[200px] text-right">
                  Kd. {quickBookJob.draft?.customer_number || 'Unbekannt'} · {
                    customers.find((c) => c.customer_number === quickBookJob.draft?.customer_number)?.company_name || 'Kunde'
                  }
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-surface-400">Positionen:</span>
                <span className="font-mono text-surface-300">{quickBookJob.draft?.items?.length ?? 0} Artikel</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-surface-800/80 font-bold">
                <span className="text-surface-200">Gesamtbetrag:</span>
                <span className="text-emerald-400 tabular-nums text-base">
                  {formatCurrency(
                    (quickBookJob.draft?.items || []).reduce(
                      (s: number, i: ScannedItem) => s + i.qty * i.unit_price,
                      0
                    )
                  )}
                </span>
              </div>
            </div>

            {/* 3 Große Touch-Buttons für Bar / Rechnung / Karte */}
            <div className="grid grid-cols-3 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  confirmSale(quickBookJob.id, quickBookJob.draft, 'bar')
                  setQuickBookJob(null)
                }}
                className="p-4 rounded-2xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 active:scale-95 flex flex-col items-center justify-center text-center transition-all group"
              >
                <span className="text-2xl mb-1.5 group-hover:scale-110 transition-transform">💶</span>
                <span className="text-xs font-bold text-emerald-300">Bar</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  confirmSale(quickBookJob.id, quickBookJob.draft, 'rechnung')
                  setQuickBookJob(null)
                }}
                className="p-4 rounded-2xl bg-brand-950/80 hover:bg-brand-900 border border-brand-700/60 active:scale-95 flex flex-col items-center justify-center text-center transition-all group"
              >
                <span className="text-2xl mb-1.5 group-hover:scale-110 transition-transform">🧾</span>
                <span className="text-xs font-bold text-brand-300">Rechnung</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  confirmSale(quickBookJob.id, quickBookJob.draft, 'karte')
                  setQuickBookJob(null)
                }}
                className="p-4 rounded-2xl bg-amber-950/80 hover:bg-amber-900 border border-amber-700/60 active:scale-95 flex flex-col items-center justify-center text-center transition-all group"
              >
                <span className="text-2xl mb-1.5 group-hover:scale-110 transition-transform">💳</span>
                <span className="text-xs font-bold text-amber-300">Karte</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setQuickBookJob(null)}
              className="w-full py-2.5 rounded-xl bg-surface-800 text-surface-400 text-xs font-medium hover:bg-surface-700 transition-colors"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {/* FLOATING ACTION BUTTON (FAB) UNTEN RECHTS - SCHNELLE DAUMEN-BEDIENUNG */}
      <div className="fixed bottom-20 right-4 z-40">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-3.5 rounded-full bg-gradient-to-r from-brand-600 via-emerald-600 to-teal-600 text-white font-bold text-sm shadow-2xl border border-emerald-400/50 flex items-center gap-2.5 active:scale-90 hover:scale-105 transition-all shadow-glow"
        >
          <Camera className="w-5 h-5 shrink-0" />
          <span>{scanJobs.length > 0 ? 'Weitere scannen' : 'Rechnung scannen'}</span>
        </button>
      </div>
    </div>
  )
}

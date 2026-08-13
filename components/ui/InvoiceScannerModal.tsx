'use client'

import { useState, useRef } from 'react'
import { Camera, Upload, X, Check, Loader2, Sparkles, AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react'

interface InvoiceScannerModalProps {
  isOpen: boolean
  onClose: () => void
  onScanComplete: (scannedData: {
    customerNumber?: string
    items: Array<{ sku: string; name: string; qty: number; unit_price: number }>
  }) => void
  driverPrefix: string
}

export default function InvoiceScannerModal({
  isOpen,
  onClose,
  onScanComplete,
  driverPrefix,
}: InvoiceScannerModalProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState<boolean>(false)
  const [scannedResult, setScannedResult] = useState<any | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result as string
      setImageSrc(base64)
      processImage(base64)
    }
    reader.readAsDataURL(file)
  }

  async function processImage(base64: string) {
    setIsScanning(true)
    setErrorMessage(null)
    setScannedResult(null)

    try {
      const res = await fetch('/api/ocr/scan-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, driverPrefix }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Fehler bei der Analyse des Fotos')
      }

      setScannedResult(data.data)
    } catch (err: any) {
      setErrorMessage(err.message || 'Foto konnte nicht analysiert werden.')
    } finally {
      setIsScanning(false)
    }
  }

  function handleConfirmData() {
    if (!scannedResult) return
    onScanComplete({
      customerNumber: scannedResult.customer_number,
      items: scannedResult.items,
    })
    onClose()
  }

  function handleReset() {
    setImageSrc(null)
    setScannedResult(null)
    setErrorMessage(null)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md animate-in fade-in duration-150 p-0 sm:p-4">
      {/* Backdrop tap to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Sheet */}
      <div className="relative w-full max-w-lg bg-surface-900 border border-surface-700 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in slide-in-from-bottom duration-200">
        
        {/* Header */}
        <div className="p-4 bg-surface-950 border-b border-surface-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-950 border border-brand-500/50 flex items-center justify-center text-brand-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-surface-50 flex items-center gap-1.5">
                Rechnung scannen (Foto-KI)
              </h3>
              <p className="text-xs text-surface-400">Handschriftlichen Rechnungszettel abfotografieren</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-surface-800 hover:bg-surface-700 flex items-center justify-center text-surface-400 hover:text-surface-100 shrink-0 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 space-y-4 overflow-y-auto max-h-[75vh]">
          
          {/* Invisible Camera File Input for Native Camera Trigger */}
          <input
            ref={fileInputRef}
            id="modal-camera-file-input"
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />

          {!imageSrc ? (
            /* KAMERA FOTO AUSLÖSEN / DROPAREA */
            <div className="space-y-4 text-center py-4">
              <label
                htmlFor="modal-camera-file-input"
                className="block p-8 rounded-3xl border-2 border-dashed border-brand-500/60 hover:border-brand-400 bg-surface-950/80 hover:bg-brand-950/20 transition-all cursor-pointer space-y-3 active:scale-95 group select-none"
              >
                <div className="w-16 h-16 rounded-full bg-brand-600 group-hover:bg-brand-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-brand-900/50 transition-all">
                  <Camera className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-base font-bold text-surface-100">📸 Papierrechnung jetzt fotografieren</p>
                  <p className="text-xs text-surface-400 mt-1">
                    Öffnet direkt die Smartphone-Kamera
                  </p>
                </div>
              </label>

              <div className="flex items-center justify-center gap-2 text-xs text-surface-500 font-medium">
                <Sparkles className="w-4 h-4 text-brand-400" />
                🔒 Foto wird nur im RAM verarbeitet & NICHT gespeichert
              </div>
            </div>
          ) : (
            /* VORSCHAU & ANALYSIS STATUS */
            <div className="space-y-4">
              {/* Foto-Vorschau mit Scanning Animation */}
              <div className="relative rounded-2xl overflow-hidden border border-surface-700 bg-black max-h-56 flex items-center justify-center">
                {/* eslint-disable-next-html-loader */}
                <img src={imageSrc} alt="Rechnung Beleg" className="object-contain max-h-56 w-full" />
                
                {isScanning && (
                  <div className="absolute inset-0 bg-brand-950/70 backdrop-blur-xs flex flex-col items-center justify-center p-4 space-y-2">
                    <Loader2 className="w-10 h-10 text-brand-400 animate-spin" />
                    <p className="text-sm font-bold text-surface-100 animate-pulse">
                      🔍 Handschrift & Ziffern werden analysiert...
                    </p>
                    <p className="text-xs text-brand-300 font-mono">Abgleich mit Kundennummern & Artikelkatalog</p>
                  </div>
                )}
              </div>

              {/* ERFOLG ODER WARNUNG: ERKANNTES ERGEBNIS */}
              {scannedResult && !isScanning && (
                <div className="p-4 rounded-2xl bg-surface-950 border border-surface-700 space-y-3 animate-in">
                  
                  {/* Status Badges */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold flex items-center gap-1.5 text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      4 Rechnungsfelder analysiert
                    </span>
                    <span className="text-[10px] font-mono text-surface-300 bg-surface-800 px-2 py-0.5 rounded border border-surface-700">
                      RAM-Scan (0 Bytes gespeichert)
                    </span>
                  </div>

                  {/* WARNUNG BEI UNLESBAREN ZAHLEN */}
                  {scannedResult.has_unreadable && (
                    <div className="p-3 rounded-xl bg-amber-950/80 border border-amber-500/80 text-amber-300 text-xs space-y-1">
                      <div className="flex items-center gap-2 font-bold text-amber-200">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>Hinweis zur Erkennung</span>
                      </div>
                      <p>{scannedResult.unreadable_message}</p>
                    </div>
                  )}

                  {/* HINWEISE ZUR NÄCHSTEN ÜBEREINSTIMMUNG (FUZZY MATCHING) */}
                  {scannedResult.warnings && scannedResult.warnings.length > 0 && (
                    <div className="p-3 rounded-xl bg-brand-950/60 border border-brand-800 text-brand-300 text-[11px] space-y-1">
                      <p className="font-bold text-brand-200 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                        Automatische Zuordnung (Nächste Übereinstimmung):
                      </p>
                      <ul className="list-disc list-inside space-y-0.5 text-surface-300">
                        {scannedResult.warnings.map((w: string, i: number) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* ERGEBNIS-ÜBERSICHT (DIE 4 EXTRAHIERTEN FELDER) */}
                  <div className="bg-surface-900 p-3.5 rounded-xl border border-surface-800 space-y-2 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-surface-400">1. Datum:</span>
                      <span className="text-emerald-400 font-bold">{scannedResult.date} (Heute)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-surface-400">2. Kundennummer:</span>
                      <span className="text-brand-300 font-bold">Kd.-Nr. {scannedResult.customer_number}</span>
                    </div>

                    <div className="pt-2 border-t border-surface-800 space-y-1.5">
                      <span className="text-surface-400 font-semibold uppercase tracking-wider text-[10px] block">
                        3. & 4. Artikelnummern & Mengen ({scannedResult.items.length} Positionen):
                      </span>
                      {scannedResult.items.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-surface-100 font-bold bg-surface-950 p-2 rounded border border-surface-800/60">
                          <div>
                            <span className="text-brand-400">[{item.sku}]</span> {item.name}
                          </div>
                          <span className="text-emerald-400 font-black ml-2">{item.qty} {item.unit}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleReset}
                      className="py-3 px-3 rounded-xl bg-surface-800 hover:bg-surface-700 text-surface-300 text-xs font-bold transition-colors"
                    >
                      Neues Foto
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmData}
                      className="flex-1 py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-lg flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                    >
                      <Check className="w-5 h-5 stroke-[3]" />
                      Daten übernehmen
                    </button>
                  </div>
                </div>
              )}

              {/* FEHLERMELDUNG */}
              {errorMessage && !isScanning && (
                <div className="p-3.5 rounded-xl bg-danger-950/60 border border-danger-500/60 text-danger-300 text-xs space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-danger-400 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="btn-secondary btn-xs w-full justify-center"
                  >
                    Erneut versuchen
                  </button>
                </div>
              )}

            </div>
          )}

        </div>

      </div>
    </div>
  )
}

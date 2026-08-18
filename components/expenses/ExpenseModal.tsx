'use client'

import { useState } from 'react'
import {
  X,
  Camera,
  Calendar,
  DollarSign,
  Fuel,
  Zap,
  Building,
  Users,
  Landmark,
  Wrench,
  Package,
  FileText,
  Trash2,
  Loader2,
  CheckCircle2,
  ZoomIn,
} from 'lucide-react'
import {
  EXPENSE_CATEGORIES_META,
  compressExpenseReceipt,
  type ExpenseCategory,
  type ExpenseEntry,
} from '@/lib/expenseStore'

interface ExpenseModalProps {
  initialData?: Partial<ExpenseEntry>
  onClose: () => void
  onSaved: (expense: ExpenseEntry) => void
}

export default function ExpenseModal({ initialData, onClose, onSaved }: ExpenseModalProps) {
  const [title, setTitle] = useState(initialData?.title || '')
  const [category, setCategory] = useState<ExpenseCategory>(initialData?.category || 'fuel')
  const [amount, setAmount] = useState<string>(initialData?.amount ? String(initialData.amount) : '')
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().slice(0, 10))
  const [vehicleId, setVehicleId] = useState<string>(initialData?.vehicleId || 'vehicle-1')
  const [fuelLiters, setFuelLiters] = useState<string>(initialData?.fuelLiters ? String(initialData.fuelLiters) : '')
  const [mileage, setMileage] = useState<string>(initialData?.mileage ? String(initialData.mileage) : '')
  const [notes, setNotes] = useState(initialData?.notes || '')
  const [taxReference, setTaxReference] = useState(initialData?.taxReference || '')
  const [receiptImage, setReceiptImage] = useState<string | null>(initialData?.receiptImage || null)
  const [isProcessingImage, setIsProcessingImage] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showLightbox, setShowLightbox] = useState(false)

  // Handle Receipt Upload & Compression
  async function handleReceiptUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setIsProcessingImage(true)
    try {
      const compressed = await compressExpenseReceipt(file, 1200, 0.72)
      setReceiptImage(compressed)
    } catch (err) {
      console.error('Error compressing receipt:', err)
      alert('Fehler beim Verarbeiten des Belegfotos.')
    } finally {
      setIsProcessingImage(false)
      if (e.target) e.target.value = ''
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const numAmount = parseFloat(amount.replace(',', '.'))
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Bitte einen gültigen Betrag eingeben.')
      return
    }

    if (!title.trim()) {
      alert('Bitte eine Bezeichnung eingeben.')
      return
    }

    setIsSaving(true)

    const monthKey = date.slice(0, 7)
    let vehicleName = 'Hauptlager (M-ONE)'
    let driverName = ''

    if (vehicleId === 'vehicle-1') {
      vehicleName = 'Fahrzeug 1 (Depo Mensuri)'
      driverName = 'Mensuri'
    } else if (vehicleId === 'vehicle-2') {
      vehicleName = 'Fahrzeug 2 (Depo Qerimi)'
      driverName = 'Qerimi'
    } else if (vehicleId === 'depot') {
      vehicleName = 'Hauptlager (M-ONE)'
      driverName = 'Zentrale'
    }

    const entry: ExpenseEntry = {
      id: initialData?.id || `exp-${Date.now()}`,
      title: title.trim(),
      category,
      amount: Math.round(numAmount * 100) / 100,
      date,
      month: monthKey,
      vehicleId: vehicleId as any,
      vehicleName,
      driverName,
      fuelLiters: fuelLiters ? parseFloat(fuelLiters.replace(',', '.')) : undefined,
      mileage: mileage ? parseInt(mileage) : undefined,
      receiptImage,
      isAutomatic: initialData?.isAutomatic || false,
      status: 'paid',
      notes: notes.trim() || undefined,
      taxReference: taxReference.trim() || undefined,
      created_at: initialData?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    onSaved(entry)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-surface-900 border border-surface-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-surface-800 flex items-center justify-between bg-surface-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-950 border border-brand-800/60 flex items-center justify-center text-brand-400">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-surface-100">
                {initialData?.id ? 'Ausgabe bearbeiten' : 'Neue Betriebsausgabe erfassen'}
              </h2>
              <p className="text-[11px] text-surface-400">
                Treibstoff, Strom, Miete, Steuern & Belege erfassen
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-surface-400 hover:text-white hover:bg-surface-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Category Selection Grid */}
          <div>
            <label className="text-xs font-bold text-surface-300 uppercase tracking-wider block mb-2">
              Ausgaben-Kategorie *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(Object.keys(EXPENSE_CATEGORIES_META) as ExpenseCategory[]).map((catKey) => {
                const meta = EXPENSE_CATEGORIES_META[catKey]
                const isSelected = category === catKey

                return (
                  <button
                    key={catKey}
                    type="button"
                    onClick={() => {
                      setCategory(catKey)
                      if (!title || Object.values(EXPENSE_CATEGORIES_META).some((m) => m.label === title)) {
                        setTitle(meta.label)
                      }
                    }}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                      isSelected
                        ? `${meta.badgeClass} ring-2 ring-brand-500 shadow-md font-bold`
                        : 'bg-surface-950/60 border-surface-800 text-surface-400 hover:text-surface-200 hover:bg-surface-800'
                    }`}
                  >
                    <span className="text-base">{meta.icon}</span>
                    <span className="text-xs truncate">{meta.label.split('(')[0].trim()}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Title & Amount Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-surface-300 block mb-1">
                Bezeichnung / Grund *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="z. B. Diesel Tankung Pejë, Strom KEDS..."
                className="w-full px-3.5 py-2.5 bg-surface-900 border border-surface-700 rounded-xl text-xs font-semibold text-white placeholder:text-surface-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-surface-300 block mb-1">
                Betrag (€) *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0,00"
                  className="w-full pl-7 pr-3.5 py-2.5 bg-surface-900 border border-surface-700 rounded-xl text-sm font-mono font-black text-rose-400 placeholder:text-surface-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                  required
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500 text-sm font-bold">€</span>
              </div>
            </div>
          </div>

          {/* Date & Vehicle Assignment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-surface-300 flex items-center gap-1 mb-1">
                <Calendar className="w-3.5 h-3.5 text-brand-400" /> Belegdatum *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-900 border border-surface-700 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-surface-300 block mb-1">
                Zuordnung (Fahrzeug / Lager)
              </label>
              <select
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-900 border border-surface-700 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
              >
                <option value="vehicle-1">🚚 Fahrzeug 1 (Depo Mensuri)</option>
                <option value="vehicle-2">🚚 Fahrzeug 2 (Depo Qerimi)</option>
                <option value="depot">🏢 Hauptlager / Zentrale (M-ONE)</option>
                <option value="general">🌐 Allgemeine Betriebsausgabe</option>
              </select>
            </div>
          </div>

          {/* Fuel Specific Fields (Only if category === 'fuel') */}
          {category === 'fuel' && (
            <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/50 grid grid-cols-2 gap-3 animate-in fade-in">
              <div>
                <label className="text-[11px] font-bold text-amber-300 flex items-center gap-1 mb-1">
                  <Fuel className="w-3.5 h-3.5" /> Getankte Liter
                </label>
                <input
                  type="text"
                  value={fuelLiters}
                  onChange={(e) => setFuelLiters(e.target.value)}
                  placeholder="z. B. 65"
                  className="w-full px-3 py-2 bg-surface-900 border border-surface-700 rounded-xl text-xs font-mono font-bold text-white placeholder:text-surface-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-amber-300 block mb-1">
                  Kilometerstand (km)
                </label>
                <input
                  type="number"
                  value={mileage}
                  onChange={(e) => setMileage(e.target.value)}
                  placeholder="z. B. 184500"
                  className="w-full px-3 py-2 bg-surface-900 border border-surface-700 rounded-xl text-xs font-mono font-bold text-white placeholder:text-surface-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>
          )}

          {/* Tax Specific Field (Only if category === 'tax') */}
          {category === 'tax' && (
            <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-800/50 animate-in fade-in">
              <label className="text-[11px] font-bold text-rose-300 flex items-center gap-1 mb-1">
                <Landmark className="w-3.5 h-3.5" /> Steuer-Referenz / Steuernummer (ATK)
              </label>
              <input
                type="text"
                value={taxReference}
                onChange={(e) => setTaxReference(e.target.value)}
                placeholder="z. B. ATK-TVSH-2026-07 oder Quittungsnummer"
                className="w-full px-3 py-2 bg-surface-900 border border-surface-700 rounded-xl text-xs font-mono font-bold text-white placeholder:text-surface-500 focus:outline-none focus:border-rose-500 transition-colors"
              />
            </div>
          )}

          {/* Receipt Image Upload (Kamera / Datei) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-surface-300 uppercase tracking-wider flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-brand-400" />
              Belegfoto / Rechnung (Quittung)
            </label>

            {receiptImage ? (
              <div className="p-3 rounded-xl bg-surface-950 border border-surface-700 flex items-center justify-between gap-3">
                <div
                  onClick={() => setShowLightbox(true)}
                  className="relative w-16 h-16 rounded-lg overflow-hidden border border-surface-600 bg-surface-900 cursor-pointer group shrink-0"
                >
                  <img src={receiptImage} alt="Beleg" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition-opacity">
                    <ZoomIn className="w-4 h-4" />
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Belegfoto angehängt
                  </p>
                  <p className="text-[10px] text-surface-400">Komprimiertes WebP-Format (~40 KB)</p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <label
                    htmlFor="receipt-file-upload"
                    className="px-2.5 py-1.5 rounded-lg bg-surface-800 hover:bg-surface-700 text-surface-200 text-xs font-semibold cursor-pointer border border-surface-700"
                  >
                    Ändern
                  </label>
                  <button
                    type="button"
                    onClick={() => setReceiptImage(null)}
                    className="p-1.5 rounded-lg bg-rose-950 text-rose-400 hover:bg-rose-900 border border-rose-800/60"
                    title="Beleg löschen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <label
                  htmlFor="receipt-file-upload"
                  className={`w-full py-4 rounded-xl border border-dashed border-surface-700 hover:border-brand-500 bg-surface-950/40 hover:bg-surface-950 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    isProcessingImage ? 'opacity-50 pointer-events-none' : ''
                  }`}
                >
                  {isProcessingImage ? (
                    <>
                      <Loader2 className="w-5 h-5 text-brand-400 animate-spin" />
                      <span className="text-xs text-brand-300 font-semibold">Komprimiere Beleg...</span>
                    </>
                  ) : (
                    <>
                      <div className="w-8 h-8 rounded-full bg-brand-950/80 border border-brand-800/60 flex items-center justify-center text-brand-400">
                        <Camera className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-surface-200">Belegfoto aufnehmen / hochladen</span>
                      <span className="text-[10px] text-surface-500">Quittung, Tankbeleg oder KEDS-Rechnung</span>
                    </>
                  )}
                </label>
              </div>
            )}

            <input
              id="receipt-file-upload"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleReceiptUpload}
              className="hidden"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-bold text-surface-300 block mb-1">
              Zusätzliche Notiz
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="z. B. Tankstelle IP Petrol Fushë Kosovë, Rechnungsnummer 1234..."
              rows={2}
              className="w-full px-3.5 py-2 bg-surface-900 border border-surface-700 rounded-xl text-xs font-semibold text-white placeholder:text-surface-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-surface-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-surface-800 hover:bg-surface-700 text-surface-300 text-xs font-bold transition-colors"
            >
              Abbrechen
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 active:scale-95 text-white text-xs font-bold shadow-lg transition-all shadow-glow flex items-center gap-1.5"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>{initialData?.id ? 'Änderungen speichern' : 'Ausgabe buchen'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Fullscreen Lightbox */}
      {showLightbox && receiptImage && (
        <div
          onClick={() => setShowLightbox(false)}
          className="fixed inset-0 z-60 bg-black/95 flex items-center justify-center p-4 cursor-pointer animate-in fade-in"
        >
          <div className="relative max-w-3xl max-h-[90vh]">
            <img src={receiptImage} alt="Beleg groß" className="max-w-full max-h-[85vh] object-contain rounded-xl" />
            <button
              onClick={() => setShowLightbox(false)}
              className="absolute -top-3 -right-3 p-2 bg-surface-800 text-white rounded-full border border-surface-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

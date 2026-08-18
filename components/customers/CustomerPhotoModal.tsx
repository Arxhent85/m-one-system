'use client'

import { useState, useEffect, useRef } from 'react'
import {
  X,
  Camera,
  Upload,
  Trash2,
  MapPin,
  Phone,
  Mail,
  User,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Navigation,
  Sparkles,
  ExternalLink,
  ZoomIn,
  Store,
  Layers,
  Archive,
  Save,
} from 'lucide-react'
import {
  CustomerPhoto,
  CustomerExtendedProfile,
  getCustomerProfile,
  updateCustomerPhotosAndContact,
  compressCustomerPhoto,
} from '@/lib/customerStore'
import MOCK_CUSTOMERS from '@/lib/mockCustomers.json'

interface CustomerPhotoModalProps {
  initialCustomerNumber?: string
  initialCompanyName?: string
  initialCity?: string
  driverName?: string
  onClose: () => void
  onSaved?: (profile: CustomerExtendedProfile) => void
}

const PHOTO_SLOTS = [
  {
    key: 'storefront' as const,
    title: 'Ladenfront / Außenansicht',
    desc: 'Geschäft von außen mit Firmenschild & Eingang',
    icon: Store,
    badgeColor: 'bg-blue-950 text-blue-300 border-blue-800',
  },
  {
    key: 'shelf' as const,
    title: 'Warenregal / M-ONE Präsentation',
    desc: 'M-ONE Silikone, Sprays & Acryl im Verkaufsregal',
    icon: Layers,
    badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-800',
  },
  {
    key: 'storage' as const,
    title: 'Zusatz / Lager / Innenansicht',
    desc: 'Ladeninnenraum oder Lagerbestände vor Ort',
    icon: Archive,
    badgeColor: 'bg-purple-950 text-purple-300 border-purple-800',
  },
]

export default function CustomerPhotoModal({
  initialCustomerNumber = '',
  initialCompanyName = '',
  initialCity = '',
  driverName = 'Fahrer',
  onClose,
  onSaved,
}: CustomerPhotoModalProps) {
  const [customerNumber, setCustomerNumber] = useState(initialCustomerNumber)
  const [companyName, setCompanyName] = useState(initialCompanyName)
  const [city, setCity] = useState(initialCity)
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [contactPerson, setContactPerson] = useState('')
  const [notes, setNotes] = useState('')

  const [photos, setPhotos] = useState<CustomerPhoto[]>([])
  const [isProcessingPhoto, setIsProcessingPhoto] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Customer search / autoselect
  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  // GPS State
  const [currentGps, setCurrentGps] = useState<{
    latitude: number
    longitude: number
    accuracy: number
  } | null>(null)
  const [gpsStatus, setGpsStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [gpsErrorMsg, setGpsErrorMsg] = useState('')

  // Lightbox
  const [lightboxPhoto, setLightboxPhoto] = useState<CustomerPhoto | null>(null)

  // File Inputs
  const fileInputRefs = {
    storefront: useRef<HTMLInputElement>(null),
    shelf: useRef<HTMLInputElement>(null),
    storage: useRef<HTMLInputElement>(null),
  }

  // 1. Initial Profile Load
  useEffect(() => {
    if (initialCustomerNumber) {
      loadProfile(initialCustomerNumber)
    }
  }, [initialCustomerNumber])

  function loadProfile(cNum: string) {
    const profile = getCustomerProfile(cNum)
    if (profile) {
      setCompanyName(profile.company_name || '')
      setCity(profile.city || '')
      setPhone(profile.phone || '')
      setEmail(profile.email || '')
      setContactPerson(profile.contact_person || '')
      setNotes(profile.notes || '')
      setPhotos(profile.photos || [])
      if (profile.gps) {
        setCurrentGps({
          latitude: profile.gps.lat,
          longitude: profile.gps.lng,
          accuracy: profile.gps.accuracy || 10,
        })
        setGpsStatus('success')
      }
    } else {
      // Find in mock customers
      const matched = (MOCK_CUSTOMERS as any[]).find(
        (c) => c.customer_number === cNum || c.company_name?.toLowerCase() === cNum.toLowerCase()
      )
      if (matched) {
        setCompanyName(matched.company_name)
        setCity(matched.city || '')
      }
      setPhotos([])
    }
  }

  // 2. Fetch Live GPS on mount
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      setGpsStatus('loading')
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCurrentGps({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: Math.round(pos.coords.accuracy),
          })
          setGpsStatus('success')
        },
        (err) => {
          console.warn('Geolocation error:', err.message)
          setGpsStatus('error')
          setGpsErrorMsg('GPS nicht aktiv oder blockiert')
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      )
    } else {
      setGpsStatus('error')
      setGpsErrorMsg('GPS wird vom Browser nicht unterstützt')
    }
  }, [])

  // 3. Customer Selection from list
  const filteredCustomers = (MOCK_CUSTOMERS as any[]).filter((c) => {
    if (!searchQuery) return false
    const q = searchQuery.toLowerCase()
    return c.company_name?.toLowerCase().includes(q) || c.customer_number?.includes(q) || c.city?.toLowerCase().includes(q)
  }).slice(0, 8)

  function handleSelectCustomer(c: any) {
    setCustomerNumber(c.customer_number)
    setCompanyName(c.company_name)
    setCity(c.city || '')
    setSearchQuery('')
    setShowDropdown(false)
    loadProfile(c.customer_number)
  }

  // 4. Handle Photo Upload / Capture for a specific slot
  async function handleFileUpload(slot: 'storefront' | 'shelf' | 'storage', e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setIsProcessingPhoto(slot)
    try {
      // 1. Ultraschnelle und speichereffiziente WebP/JPEG Komprimierung (~45-60 KB)
      const compressed = await compressCustomerPhoto(file, 1100, 0.72)
      
      const slotDef = PHOTO_SLOTS.find((s) => s.key === slot)

      // 2. Echtzeit-GPS direkt am Aufnahmeort abfragen
      let capturedLat = currentGps?.latitude
      let capturedLng = currentGps?.longitude
      let capturedAcc = currentGps?.accuracy

      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const liveGps = {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: Math.round(pos.coords.accuracy),
            }
            setCurrentGps(liveGps)
            setGpsStatus('success')
            // Foto mit Live-GPS aktualisieren
            setPhotos((prev) =>
              prev.map((p) =>
                p.slot === slot
                  ? { ...p, latitude: liveGps.latitude, longitude: liveGps.longitude, accuracy: liveGps.accuracy }
                  : p
              )
            )
          },
          undefined,
          { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
        )
      }

      const newPhoto: CustomerPhoto = {
        id: `photo-${Date.now()}-${slot}`,
        slot,
        slotLabel: slotDef?.title || 'Kundenfoto',
        dataUrl: compressed,
        timestamp: new Date().toISOString(),
        driverName: driverName || 'Fahrer',
        latitude: capturedLat,
        longitude: capturedLng,
        accuracy: capturedAcc,
      }

      setPhotos((prev) => {
        const filtered = prev.filter((p) => p.slot !== slot)
        return [...filtered, newPhoto]
      })
    } catch (err) {
      console.error('Error compressing image:', err)
      alert('Fehler beim Verarbeiten des Fotos.')
    } finally {
      setIsProcessingPhoto(null)
      // Reset input value
      if (e.target) e.target.value = ''
    }
  }

  function handleDeletePhoto(slot: 'storefront' | 'shelf' | 'storage') {
    setPhotos((prev) => prev.filter((p) => p.slot !== slot))
  }

  // 5. Save all data
  function handleSave() {
    if (!customerNumber) {
      alert('Bitte wähle zuerst einen Kunden oder gib eine Kundennummer ein.')
      return
    }

    setIsSaving(true)
    try {
      const savedProfile = updateCustomerPhotosAndContact(
        customerNumber,
        companyName,
        city,
        phone,
        email,
        contactPerson,
        notes,
        photos,
        currentGps ? { latitude: currentGps.latitude, longitude: currentGps.longitude, accuracy: currentGps.accuracy } : undefined
      )

      setSaveSuccess(true)
      setTimeout(() => {
        if (onSaved) onSaved(savedProfile)
        onClose()
      }, 700)
    } catch (err) {
      console.error('Error saving profile:', err)
      alert('Fehler beim Speichern.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-surface-900 border border-surface-700/80 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-surface-800 flex items-center justify-between bg-surface-950/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-950 text-brand-400 border border-brand-800/60 flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-surface-100 flex items-center gap-2">
                Kunden-Fotos & Check-in
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-bold">
                  Max. 3 Fotos + GPS
                </span>
              </h2>
              <p className="text-xs text-surface-400">
                {companyName ? `${companyName} (Kd.-Nr. ${customerNumber})` : 'Kunden auswählen und Fotos erfassen'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-surface-400 hover:text-white hover:bg-surface-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          {/* Kundenauswahl / Schnellsuche (wenn nicht vorgegeben) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-surface-300 flex items-center justify-between">
              <span>Kunde / Baumarkt</span>
              {customerNumber && (
                <span className="text-[11px] font-mono text-brand-400 font-bold">
                  Kd.-Nr. {customerNumber} · {city}
                </span>
              )}
            </label>

            <div className="relative">
              <input
                type="text"
                value={searchQuery || (companyName ? `${companyName} (${customerNumber})` : '')}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setShowDropdown(true)
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Kunden suchen nach Name, Kd.-Nr. oder Stadt..."
                className="w-full px-3.5 py-2.5 bg-surface-900 border border-surface-700 rounded-xl text-xs font-semibold text-white placeholder:text-surface-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors shadow-inner"
              />
              {showDropdown && filteredCustomers.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-surface-950 border border-surface-700 rounded-xl shadow-2xl z-20 max-h-48 overflow-y-auto divide-y divide-surface-800">
                  {filteredCustomers.map((c) => (
                    <button
                      key={c.customer_number}
                      type="button"
                      onClick={() => handleSelectCustomer(c)}
                      className="w-full px-3 py-2 text-left hover:bg-surface-800/80 transition-colors flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-surface-100">{c.company_name}</span>
                        <span className="text-[10px] text-surface-400 ml-2">({c.city})</span>
                      </div>
                      <span className="font-mono text-[10px] font-bold text-brand-400 bg-brand-950 px-1.5 py-0.5 rounded border border-brand-800/40">
                        {c.customer_number}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* GPS Live-Status Box */}
          <div className="p-3 rounded-xl bg-surface-950/70 border border-surface-800 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  gpsStatus === 'success'
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : gpsStatus === 'loading'
                    ? 'bg-amber-950 text-amber-400 border border-amber-800'
                    : 'bg-rose-950 text-rose-400 border border-rose-800'
                }`}
              >
                <Navigation className="w-3.5 h-3.5" />
              </div>
              <div className="truncate">
                {gpsStatus === 'success' && currentGps ? (
                  <>
                    <p className="font-bold text-surface-100 font-mono text-[11px] truncate">
                      📍 GPS erfasst: {currentGps.latitude.toFixed(5)}, {currentGps.longitude.toFixed(5)}
                    </p>
                    <p className="text-[10px] text-emerald-400 font-medium">
                      Genauigkeit: ±{currentGps.accuracy}m · Wird mit Fotos verknüpft
                    </p>
                  </>
                ) : gpsStatus === 'loading' ? (
                  <>
                    <p className="font-bold text-surface-200 text-[11px]">GPS-Standort wird ermittelt...</p>
                    <p className="text-[10px] text-amber-400">Genauigkeit wird kalibriert</p>
                  </>
                ) : (
                  <>
                    <p className="font-bold text-rose-300 text-[11px]">GPS nicht verfügbar</p>
                    <p className="text-[10px] text-surface-500">{gpsErrorMsg}</p>
                  </>
                )}
              </div>
            </div>

            {currentGps && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${currentGps.latitude},${currentGps.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 underline flex items-center gap-1 shrink-0"
              >
                Maps ↗
              </a>
            )}
          </div>

          {/* 3 FOTO-SLOTS (Ladenfront, Warenregal, Lager/Zusatz) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-surface-200 uppercase tracking-wider flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-brand-400" />
                3 Fotos vom Kunden aufnehmen ({photos.length}/3 vorhanden)
              </label>
              <span className="text-[10px] text-surface-400">Automatische WebP-Komprimierung</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {PHOTO_SLOTS.map((slot) => {
                const photo = photos.find((p) => p.slot === slot.key)
                const isProcessing = isProcessingPhoto === slot.key
                const SlotIcon = slot.icon

                return (
                  <div
                    key={slot.key}
                    className={`rounded-xl border p-3 flex flex-col justify-between transition-all ${
                      photo
                        ? 'bg-surface-950 border-surface-700 hover:border-surface-600'
                        : 'bg-surface-950/40 border-dashed border-surface-800 hover:border-surface-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-surface-200 flex items-center gap-1">
                          <SlotIcon className="w-3.5 h-3.5 text-brand-400" />
                          {slot.title}
                        </span>
                        {photo && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                            Gespeichert
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-surface-400 mb-2.5 leading-snug">
                        {slot.desc}
                      </p>
                    </div>

                    {/* Photo Preview / Upload Area */}
                    {photo ? (
                      <div className="space-y-2">
                        <div
                          onClick={() => setLightboxPhoto(photo)}
                          className="relative h-28 w-full rounded-lg overflow-hidden border border-surface-700 bg-surface-900 cursor-pointer group shadow-sm"
                        >
                          <img
                            src={photo.dataUrl}
                            alt={slot.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <span className="text-xs text-white font-bold bg-black/60 px-2 py-1 rounded-md">
                              🔍 Groß ansehen
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-1 pt-1 text-[10px] text-surface-400">
                          <span className="truncate">
                            {new Date(photo.timestamp).toLocaleDateString('de-DE')}
                          </span>
                          <div className="flex items-center gap-1 shrink-0">
                            <label
                              htmlFor={`file-input-${slot.key}`}
                              className="px-2 py-1 rounded bg-surface-800 hover:bg-surface-700 text-surface-200 cursor-pointer text-[10px] font-semibold transition-colors"
                            >
                              Ersetzen
                            </label>
                            <button
                              type="button"
                              onClick={() => handleDeletePhoto(slot.key)}
                              className="p-1 rounded bg-rose-950/80 hover:bg-rose-900 text-rose-400 border border-rose-800/50 transition-colors"
                              title="Foto löschen"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label
                          htmlFor={`file-input-${slot.key}`}
                          className={`w-full py-4 rounded-xl border border-surface-700/80 bg-surface-900/60 hover:bg-surface-800 hover:border-brand-600 active:scale-95 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all ${
                            isProcessing ? 'opacity-50 pointer-events-none' : ''
                          }`}
                        >
                          {isProcessing ? (
                            <>
                              <Loader2 className="w-5 h-5 text-brand-400 animate-spin" />
                              <span className="text-[10px] font-bold text-brand-300">Komprimiere Bild...</span>
                            </>
                          ) : (
                            <>
                              <div className="w-8 h-8 rounded-full bg-brand-950/80 border border-brand-800/60 flex items-center justify-center text-brand-400">
                                <Camera className="w-4 h-4" />
                              </div>
                              <span className="text-[11px] font-bold text-surface-200">Foto aufnehmen</span>
                              <span className="text-[9px] text-surface-500">Kamera oder Galerie</span>
                            </>
                          )}
                        </label>
                      </div>
                    )}

                    {/* Hidden Native File Input */}
                    <input
                      id={`file-input-${slot.key}`}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => handleFileUpload(slot.key, e)}
                      className="hidden"
                    />
                  </div>
                )
              })}
            </div>
          </div>

          {/* KONTAKTDATEN (Telefon, E-Mail, Ansprechpartner) */}
          <div className="p-3.5 rounded-xl bg-surface-950/70 border border-surface-800 space-y-3">
            <h3 className="text-xs font-bold text-surface-200 uppercase tracking-wider flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              Kontaktdaten des Kunden
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-surface-400 uppercase flex items-center gap-1 mb-1">
                  <Phone className="w-3 h-3 text-emerald-400" /> Telefonnummer
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+383 44 123 456"
                  className="w-full px-3 py-2 bg-surface-900 border border-surface-700 rounded-xl text-xs font-mono font-semibold text-white placeholder:text-surface-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-surface-400 uppercase flex items-center gap-1 mb-1">
                  <Mail className="w-3 h-3 text-sky-400" /> E-Mail-Adresse
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="kontakt@kunde.com"
                  className="w-full px-3 py-2 bg-surface-900 border border-surface-700 rounded-xl text-xs font-mono font-semibold text-white placeholder:text-surface-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-surface-400 uppercase flex items-center gap-1 mb-1">
                  <User className="w-3 h-3 text-brand-400" /> Ansprechpartner / Inhaber
                </label>
                <input
                  type="text"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="z. B. Agron Berisha"
                  className="w-full px-3 py-2 bg-surface-900 border border-surface-700 rounded-xl text-xs font-semibold text-white placeholder:text-surface-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-surface-400 uppercase flex items-center gap-1 mb-1">
                  Notiz / Öffnungszeiten
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="z. B. Mo-Sa 08:00 - 18:00"
                  className="w-full px-3 py-2 bg-surface-900 border border-surface-700 rounded-xl text-xs font-semibold text-white placeholder:text-surface-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-surface-800 bg-surface-950/90 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary py-2 px-4 text-xs font-bold"
          >
            Abbrechen
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !customerNumber}
            className={`btn-primary py-2 px-6 text-xs font-bold flex items-center gap-2 shadow-glow active:scale-95 ${
              saveSuccess ? 'bg-emerald-600 hover:bg-emerald-500' : ''
            }`}
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : saveSuccess ? (
              <CheckCircle2 className="w-4 h-4 text-white" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{saveSuccess ? 'Gespeichert!' : 'Fotos & Daten speichern'}</span>
          </button>
        </div>

      </div>

      {/* Lightbox / Fullscreen Image Preview */}
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

    </div>
  )
}

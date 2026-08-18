'use client'

import { useState } from 'react'
import { Camera, ArrowLeft, Store, Users, MapPin, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import CustomerPhotoModal from '@/components/customers/CustomerPhotoModal'
import { getCustomerProfilesMap, type CustomerExtendedProfile } from '@/lib/customerStore'
import MOCK_CUSTOMERS from '@/lib/mockCustomers.json'

export default function DriverCheckinPage() {
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [lastSaved, setLastSaved] = useState<CustomerExtendedProfile | null>(null)

  const profilesMap = getCustomerProfilesMap()

  const customersList = (MOCK_CUSTOMERS as any[]).filter((c) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      c.company_name?.toLowerCase().includes(q) ||
      c.customer_number?.includes(q) ||
      c.city?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="p-4 space-y-4 animate-in max-w-lg mx-auto">
      {/* Header */}
      <div className="pt-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/driver/home"
            className="p-2 rounded-xl bg-surface-900 border border-surface-800 text-surface-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-surface-50 flex items-center gap-2">
              <Camera className="w-5 h-5 text-brand-400" />
              Kunden-Check-in & Fotos
            </h1>
            <p className="text-xs text-surface-400">
              Ladenfotos (max. 3), GPS & Kontaktdaten erfassen
            </p>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {lastSaved && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-700/60 flex items-center gap-3 text-xs text-emerald-300 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <p className="font-bold text-surface-100">
              Erfolgreich gespeichert: {lastSaved.company_name}
            </p>
            <p className="text-[11px] text-emerald-400">
              {lastSaved.photos.length} Foto(s) und GPS-Koordinaten aktualisiert.
            </p>
          </div>
        </div>
      )}

      {/* Quick Search */}
      <div className="glass-card p-3 border border-surface-800 space-y-2">
        <label className="text-xs font-bold text-surface-300 block">
          Kunden für Fotoaufnahme auswählen:
        </label>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Kunden suchen nach Name, Kd.-Nr. oder Stadt..."
          className="w-full px-3.5 py-2.5 bg-surface-900 border border-surface-700 rounded-xl text-xs font-semibold text-white placeholder:text-surface-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors shadow-inner"
        />
      </div>

      {/* Customers List */}
      <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
        {customersList.map((c) => {
          const profile = profilesMap[c.customer_number]
          const photosCount = profile?.photos?.length || 0

          return (
            <div
              key={c.customer_number}
              onClick={() => setSelectedCustomer(c)}
              className="p-3.5 rounded-xl bg-surface-900/90 border border-surface-800/80 hover:border-brand-700/80 hover:bg-surface-850 cursor-pointer transition-all flex items-center justify-between gap-3 group"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-bold text-brand-400 bg-brand-950 px-2 py-0.5 rounded border border-brand-800/40">
                    {c.customer_number}
                  </span>
                  <span className="text-xs text-surface-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-emerald-400" /> {c.city || 'Kosovo'}
                  </span>
                </div>
                <p className="text-sm font-bold text-surface-100 mt-1 truncate group-hover:text-brand-300 transition-colors">
                  {c.company_name}
                </p>
                {profile?.phone && (
                  <p className="text-[11px] text-surface-400 font-mono mt-0.5">
                    📞 {profile.phone}
                  </p>
                )}
              </div>

              <div className="flex flex-col items-end gap-1 shrink-0">
                {photosCount > 0 ? (
                  <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800/60 flex items-center gap-1">
                    <Camera className="w-3.5 h-3.5 text-emerald-400" />
                    {photosCount} Foto{photosCount > 1 ? 's' : ''}
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-brand-950 text-brand-300 border border-brand-800/60 flex items-center gap-1">
                    <Camera className="w-3.5 h-3.5 text-brand-400" />
                    + Foto
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal */}
      {selectedCustomer && (
        <CustomerPhotoModal
          initialCustomerNumber={selectedCustomer.customer_number}
          initialCompanyName={selectedCustomer.company_name}
          initialCity={selectedCustomer.city}
          onClose={() => setSelectedCustomer(null)}
          onSaved={(profile) => {
            setLastSaved(profile)
            setSelectedCustomer(null)
          }}
        />
      )}
    </div>
  )
}

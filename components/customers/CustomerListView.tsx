'use client'

import { useState, useMemo, useEffect } from 'react'
import dynamic from 'next/dynamic'
import {
  Users,
  Search,
  ArrowUpDown,
  MapPin,
  Phone,
  UserCheck,
  Navigation,
  ExternalLink,
  Map,
  List,
  Camera,
  Image,
  Plus,
  BarChart3,
} from 'lucide-react'
import { getCustomerGpsMap, type CustomerGpsInfo } from '@/lib/stockStore'
import { getCustomerProfilesMap, type CustomerExtendedProfile } from '@/lib/customerStore'
import CustomerDetailModal from '@/components/analytics/CustomerDetailModal'
import CustomerAnalyticsView from '@/components/analytics/CustomerAnalyticsView'
import CustomerPhotoModal from './CustomerPhotoModal'

const KosovoCustomerMap = dynamic(() => import('./KosovoCustomerMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[620px] rounded-2xl bg-surface-950 border border-surface-800 flex flex-col items-center justify-center gap-3 text-surface-400">
      <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin"></div>
      <p className="text-sm font-medium">Lade interaktive Kosovo-Landkarte…</p>
    </div>
  ),
})

export interface CustomerItem {
  id?: string
  customer_number?: string
  company_name: string
  city?: string
  phone?: string
  customer_type?: string
  notes?: string
  agent?: string
  is_active?: boolean
  latitude?: number
  longitude?: number
  google_maps_url?: string
}

interface CustomerListViewProps {
  customers: CustomerItem[]
}

export default function CustomerListView({ customers }: CustomerListViewProps) {
  const [viewMode, setViewMode] = useState<'map' | 'list' | 'analytics'>('map')
  const [searchQuery, setSearchQuery] = useState('')
  const [agentFilter, setAgentFilter] = useState('all')
  const [gpsFilter, setGpsFilter] = useState<'all' | 'with_gps' | 'without_gps'>('all')
  const [photoFilter, setPhotoFilter] = useState<'all' | 'with_photos' | 'without_photos'>('all')
  const [sortBy, setSortBy] = useState<'number_asc' | 'number_desc' | 'name_asc' | 'city_asc'>('number_asc')
  
  const [customerGpsMap, setCustomerGpsMap] = useState<Record<string, CustomerGpsInfo>>({})
  const [customerProfilesMap, setCustomerProfilesMap] = useState<Record<string, CustomerExtendedProfile>>({})
  
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null)
  const [photoModalCustomer, setPhotoModalCustomer] = useState<CustomerItem | null>(null)

  // Load and sync GPS Registry & Profiles
  useEffect(() => {
    function syncData() {
      const localGps = getCustomerGpsMap()
      const localProfiles = getCustomerProfilesMap()
      setCustomerProfilesMap(localProfiles)

      fetch('/api/sales/record')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.customerGpsMap) {
            setCustomerGpsMap({ ...localGps, ...data.customerGpsMap })
          } else {
            setCustomerGpsMap(localGps)
          }
        })
        .catch(() => setCustomerGpsMap(localGps))
    }

    syncData()
    window.addEventListener('m_one_customer_gps_updated', syncData)
    window.addEventListener('m_one_customer_profiles_updated', syncData)
    window.addEventListener('m_one_sale_recorded', syncData)
    return () => {
      window.removeEventListener('m_one_customer_gps_updated', syncData)
      window.removeEventListener('m_one_customer_profiles_updated', syncData)
      window.removeEventListener('m_one_sale_recorded', syncData)
    }
  }, [])

  // Helper to extract agent name
  function getAgentName(c: CustomerItem): string {
    if (c.agent) return c.agent
    const match = c.notes?.match(/Agent:\s*([^|]+)/i)?.[1]?.trim()
    if (match) return match
    const num = c.customer_number || ''
    if (num.startsWith('1') && num !== '10000') return 'Qerimi (Fahrzeug 2)'
    if (num.startsWith('2') && num !== '20000') return 'Mensuri (Fahrzeug 1)'
    if (num.startsWith('3') && num !== '30000') return 'M-ONE Zentrale (Hauptlager)'
    if (num.startsWith('4')) return 'M-ONE Zentrale (B2B Partner)'
    return 'M-ONE Zentrale'
  }

  // Helper to get GPS for a customer
  function getGpsInfo(c: CustomerItem): CustomerGpsInfo | null {
    const num = c.customer_number || ''
    if (num && customerGpsMap[num]) return customerGpsMap[num]
    const profile = num ? customerProfilesMap[num] : null
    if (profile?.gps) return profile.gps

    const match = c.notes?.match(/GPS:\s*([\d.-]+),\s*([\d.-]+)/i)
    if (match) {
      const lat = parseFloat(match[1])
      const lng = parseFloat(match[2])
      return {
        lat,
        lng,
        updatedAt: '',
        google_maps_url: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
      }
    }
    return null
  }

  function getCustomerPhotos(c: CustomerItem) {
    const num = c.customer_number || ''
    return num && customerProfilesMap[num] ? customerProfilesMap[num].photos || [] : []
  }

  function getCustomerPhone(c: CustomerItem) {
    const num = c.customer_number || ''
    return (num && customerProfilesMap[num]?.phone) || c.phone || ''
  }

  // Extract unique agents for dropdown filter
  const availableAgents = useMemo(() => {
    const agents = new Set<string>()
    customers.forEach((c) => {
      agents.add(getAgentName(c))
    })
    return Array.from(agents).sort()
  }, [customers])

  // Count customers with GPS & Photos
  const customersWithGpsCount = useMemo(() => {
    return customers.filter((c) => getGpsInfo(c) !== null).length
  }, [customers, customerGpsMap, customerProfilesMap])

  const customersWithPhotosCount = useMemo(() => {
    return customers.filter((c) => getCustomerPhotos(c).length > 0).length
  }, [customers, customerProfilesMap])

  // Filter & Sort Customers
  const processedCustomers = useMemo(() => {
    return customers
      .filter((c) => {
        // Search Filter (Company Name, Customer Number, City)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim()
          const nameMatch = c.company_name?.toLowerCase().includes(q)
          const numMatch = c.customer_number?.toLowerCase().includes(q)
          const cityMatch = c.city?.toLowerCase().includes(q)
          if (!nameMatch && !numMatch && !cityMatch) return false
        }

        // Agent / Tour Filter
        if (agentFilter !== 'all') {
          if (getAgentName(c) !== agentFilter) return false
        }

        // GPS Filter
        if (gpsFilter === 'with_gps') {
          if (!getGpsInfo(c)) return false
        } else if (gpsFilter === 'without_gps') {
          if (getGpsInfo(c)) return false
        }

        // Photo Filter
        if (photoFilter === 'with_photos') {
          if (getCustomerPhotos(c).length === 0) return false
        } else if (photoFilter === 'without_photos') {
          if (getCustomerPhotos(c).length > 0) return false
        }

        return true
      })
      .sort((a, b) => {
        const numA = parseInt(a.customer_number || '0') || 0
        const numB = parseInt(b.customer_number || '0') || 0

        if (sortBy === 'number_asc') return numA - numB
        if (sortBy === 'number_desc') return numB - numA
        if (sortBy === 'name_asc') return (a.company_name || '').localeCompare(b.company_name || '')
        if (sortBy === 'city_asc') return (a.city || '').localeCompare(b.city || '')
        return 0
      })
  }, [customers, searchQuery, agentFilter, gpsFilter, photoFilter, sortBy, customerGpsMap, customerProfilesMap])

  return (
    <div className="space-y-6">
      {/* Modal for Customer Details */}
      {selectedCustomer && (
        <CustomerDetailModal
          customer={selectedCustomer}
          sales={[]}
          onClose={() => setSelectedCustomer(null)}
        />
      )}

      {/* Modal for Photos & Check-in */}
      {photoModalCustomer && (
        <CustomerPhotoModal
          initialCustomerNumber={photoModalCustomer.customer_number}
          initialCompanyName={photoModalCustomer.company_name}
          initialCity={photoModalCustomer.city}
          onClose={() => setPhotoModalCustomer(null)}
          onSaved={() => {
            setPhotoModalCustomer(null)
            setCustomerProfilesMap(getCustomerProfilesMap())
          }}
        />
      )}

      {/* KPI Stats Banner for GPS & Photos */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="glass-card p-4 flex items-center justify-between border border-surface-700/60">
          <div>
            <p className="text-xs text-surface-400 font-medium">Gesamte Kundenkartei</p>
            <p className="text-2xl font-black text-surface-100 font-mono mt-0.5">{customers.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-surface-800 text-surface-300 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card p-4 flex items-center justify-between border border-surface-700/60">
          <div>
            <p className="text-xs text-surface-400 font-medium">📍 Live-GPS Standorte</p>
            <p className="text-2xl font-black text-emerald-400 font-mono mt-0.5">{customersWithGpsCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 flex items-center justify-center">
            <Navigation className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card p-4 flex items-center justify-between border border-surface-700/60">
          <div>
            <p className="text-xs text-surface-400 font-medium">📸 Kunden mit Fotos</p>
            <p className="text-2xl font-black text-brand-400 font-mono mt-0.5">{customersWithPhotosCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-brand-950/80 text-brand-400 border border-brand-800/60 flex items-center justify-center">
            <Camera className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card p-4 flex items-center justify-between border border-surface-700/60">
          <div>
            <p className="text-xs text-surface-400 font-medium">Fahrer & Touren</p>
            <p className="text-2xl font-black text-surface-100 font-mono mt-0.5">2 Touren</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-surface-800 text-surface-300 flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Header with Switcher: Map vs Table */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-surface-100 flex items-center gap-2">
            <span>Kundenverwaltung & GPS-Kartei (Kosovo)</span>
            <span className="text-xs font-mono font-normal text-surface-400 bg-surface-800 px-2 py-0.5 rounded-full">
              {processedCustomers.length} Treffer
            </span>
          </h2>
          <p className="text-xs text-surface-400 mt-0.5">
            Interaktive Kosovo-Landkarte & vollständige Kundenliste mit Fotos, Telefonnummern und GPS-Tracking
          </p>
        </div>

        {/* View Mode Toggle Button */}
        <div className="flex items-center gap-1 bg-surface-900 p-1 rounded-xl border border-surface-700/80">
          <button
            onClick={() => setViewMode('map')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'map'
                ? 'bg-brand-600 text-white shadow-glow'
                : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800'
            }`}
          >
            <Map className="w-4 h-4" />
            <span>Kosovo-Karte</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'list'
                ? 'bg-brand-600 text-white shadow-glow'
                : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800'
            }`}
          >
            <List className="w-4 h-4" />
            <span>Kundenkartei</span>
          </button>
          <button
            onClick={() => setViewMode('analytics')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'analytics'
                ? 'bg-brand-600 text-white shadow-glow'
                : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Umsatz & Analyse</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: MAP VIEW */}
      {viewMode === 'map' && (
        <div className="animate-in fade-in duration-300">
          <KosovoCustomerMap
            customers={processedCustomers}
            onSelectCustomer={(c) => setSelectedCustomer(c)}
          />
        </div>
      )}

      {/* VIEW 2: ANALYTICS VIEW */}
      {viewMode === 'analytics' && (
        <div className="animate-in fade-in duration-300">
          <CustomerAnalyticsView />
        </div>
      )}

      {/* VIEW 2: TABLE LIST VIEW */}
      {viewMode === 'list' && (
        <>
          {/* Filters & Search Toolbar */}
          <div className="glass-card p-4 border border-surface-700/60 space-y-4">
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Kunden suchen nach Name, Kd.-Nr. oder Stadt…"
                  className="input pl-10 py-2 bg-surface-900 border-surface-700 text-surface-100 placeholder:text-surface-500 w-full"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-surface-400 hover:text-surface-200"
                  >
                    Löschen
                  </button>
                )}
              </div>

              {/* Agent Filter */}
              <div className="w-56">
                <label className="text-[11px] font-semibold text-surface-400 uppercase tracking-wider block mb-1">
                  Tour / Fahrer
                </label>
                <select
                  value={agentFilter}
                  onChange={(e) => setAgentFilter(e.target.value)}
                  className="input py-2 bg-surface-900 border-surface-700 text-surface-100 w-full text-xs"
                >
                  <option value="all">Alle Touren ({customers.length})</option>
                  {availableAgents.map((agent) => (
                    <option key={agent} value={agent}>
                      {agent}
                    </option>
                  ))}
                </select>
              </div>

              {/* GPS Filter */}
              <div className="w-48">
                <label className="text-[11px] font-semibold text-surface-400 uppercase tracking-wider block mb-1">
                  GPS-Status
                </label>
                <select
                  value={gpsFilter}
                  onChange={(e) => setGpsFilter(e.target.value as any)}
                  className="input py-2 bg-surface-900 border-surface-700 text-surface-100 w-full text-xs"
                >
                  <option value="all">Alle Kunden</option>
                  <option value="with_gps">📍 Nur mit Live-GPS ({customersWithGpsCount})</option>
                  <option value="without_gps">Ohne GPS-Scan</option>
                </select>
              </div>

              {/* Photos Filter */}
              <div className="w-44">
                <label className="text-[11px] font-semibold text-surface-400 uppercase tracking-wider block mb-1">
                  Fotos
                </label>
                <select
                  value={photoFilter}
                  onChange={(e) => setPhotoFilter(e.target.value as any)}
                  className="input py-2 bg-surface-900 border-surface-700 text-surface-100 w-full text-xs"
                >
                  <option value="all">Alle Kunden</option>
                  <option value="with_photos">📸 Mit Fotos ({customersWithPhotosCount})</option>
                  <option value="without_photos">Ohne Fotos</option>
                </select>
              </div>

              {/* Sorting Control */}
              <div className="w-52">
                <label className="text-[11px] font-semibold text-surface-400 uppercase tracking-wider block mb-1">
                  Sortierung
                </label>
                <div className="relative">
                  <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500 pointer-events-none" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="input pl-9 py-2 bg-surface-900 border-surface-700 text-surface-100 w-full text-xs"
                  >
                    <option value="number_asc">Kd.-Nr. (aufsteigend)</option>
                    <option value="number_desc">Kd.-Nr. (absteigend)</option>
                    <option value="name_asc">Kundenname (A-Z)</option>
                    <option value="city_asc">Ort (A-Z)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Counter summary */}
            <div className="flex items-center justify-between pt-3 border-t border-surface-800/60 text-xs text-surface-400">
              <div>
                Angezeigt: <span className="text-surface-100 font-semibold">{processedCustomers.length} von {customers.length} Kunden</span>
              </div>
              <div>
                Sortiert nach: <span className="text-brand-400 font-semibold">
                  {sortBy === 'number_asc' ? 'Kundennummer (aufsteigend)' :
                   sortBy === 'number_desc' ? 'Kundennummer (absteigend)' :
                   sortBy === 'name_asc' ? 'Kundenname (A-Z)' : 'Ort (A-Z)'}
                </span>
              </div>
            </div>
          </div>

          {/* Customer Data Table */}
          <div className="glass-card overflow-hidden border border-surface-700/50 shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-surface-800/80 bg-surface-950/60 text-surface-400 font-semibold text-xs uppercase tracking-wider">
                    <th className="px-4 py-3 w-12 text-center">#</th>
                    <th className="px-4 py-3 w-28">Kd.-Nr.</th>
                    <th className="px-4 py-3">Kundenname / Firma</th>
                    <th className="px-4 py-3 w-32">Ort</th>
                    <th className="px-4 py-3 w-36">Telefon</th>
                    <th className="px-4 py-3 w-40">Agent / Fahrer</th>
                    <th className="px-4 py-3 w-32 text-center">📸 Fotos</th>
                    <th className="px-4 py-3 w-40 text-center">📍 GPS-Standort</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-800/40">
                  {processedCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-surface-500">
                        Keine Kunden für die gewählten Filter gefunden.
                      </td>
                    </tr>
                  ) : (
                    processedCustomers.map((c, idx) => {
                      const agentName = getAgentName(c)
                      const gps = getGpsInfo(c)
                      const photos = getCustomerPhotos(c)
                      const phone = getCustomerPhone(c)
                      const rowBg = idx % 2 === 0 ? 'bg-surface-900/10' : 'bg-surface-900/40'

                      return (
                        <tr
                          key={c.id || c.customer_number || idx}
                          className={`hover:bg-brand-900/20 transition-colors ${rowBg}`}
                        >
                          {/* Running Number */}
                          <td className="px-4 py-3 text-center text-surface-500 text-xs font-mono">
                            {idx + 1}
                          </td>

                          {/* Customer Number (Kd.-Nr.) */}
                          <td className="px-4 py-3">
                            <button
                              onClick={() => setSelectedCustomer(c)}
                              className="font-mono text-xs font-bold text-brand-400 bg-brand-950/60 hover:bg-brand-900 px-2 py-0.5 rounded border border-brand-800/40 hover:border-brand-700 transition-colors"
                              title="Kundenprofil öffnen"
                            >
                              {c.customer_number || '—'}
                            </button>
                          </td>

                          {/* Company Name */}
                          <td className="px-4 py-3 font-semibold text-surface-100">
                            <button
                              onClick={() => setSelectedCustomer(c)}
                              className="hover:text-brand-300 text-left transition-colors"
                            >
                              {c.company_name}
                            </button>
                          </td>

                          {/* City */}
                          <td className="px-4 py-3">
                            {c.city ? (
                              <span className="inline-flex items-center gap-1.5 text-surface-300 text-xs">
                                <MapPin className="w-3.5 h-3.5 text-surface-500 shrink-0" />
                                {c.city}
                              </span>
                            ) : (
                              <span className="text-surface-600 text-xs">—</span>
                            )}
                          </td>

                          {/* Phone */}
                          <td className="px-4 py-3">
                            {phone ? (
                              <a
                                href={`tel:${phone.replace(/[^0-9+]/g, '')}`}
                                className="inline-flex items-center gap-1.5 text-surface-300 hover:text-emerald-400 font-mono text-xs transition-colors"
                              >
                                <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                {phone}
                              </a>
                            ) : (
                              <span className="text-surface-600 text-xs">—</span>
                            )}
                          </td>

                          {/* Agent */}
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-emerald-950/60 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-800/40">
                              <UserCheck className="w-3 h-3 shrink-0" />
                              {agentName.split('(')[0].trim()}
                            </span>
                          </td>

                          {/* Photos Column */}
                          <td className="px-4 py-3 text-center">
                            {photos.length > 0 ? (
                              <button
                                onClick={() => setPhotoModalCustomer(c)}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-300 bg-brand-950/80 hover:bg-brand-900 border border-brand-800/60 px-2 py-1 rounded-lg transition-colors"
                                title="Fotos ansehen / bearbeiten"
                              >
                                <Camera className="w-3.5 h-3.5 text-brand-400" />
                                <span>{photos.length} Foto{photos.length > 1 ? 's' : ''}</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => setPhotoModalCustomer(c)}
                                className="inline-flex items-center gap-1 text-[10px] text-surface-500 hover:text-brand-300 hover:bg-surface-800 px-2 py-0.5 rounded transition-colors"
                                title="Foto aufnehmen"
                              >
                                <Plus className="w-3 h-3" /> Foto
                              </button>
                            )}
                          </td>

                          {/* GPS Location & Google Maps Link */}
                          <td className="px-4 py-3 text-center">
                            {gps ? (
                              <a
                                href={gps.google_maps_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-bold text-emerald-300 bg-emerald-950/90 hover:bg-emerald-900/90 border border-emerald-700/70 hover:border-emerald-500 px-2.5 py-1 rounded-xl transition-all shadow-sm active:scale-95 group"
                                title={`GPS: ${gps.lat}, ${gps.lng} — In Google Maps öffnen`}
                              >
                                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
                                <span>Maps</span>
                                <ExternalLink className="w-3 h-3 text-emerald-500" />
                              </a>
                            ) : (
                              <button
                                onClick={() => setPhotoModalCustomer(c)}
                                className="inline-flex items-center gap-1 text-[11px] text-surface-500 hover:text-emerald-400 italic px-2 py-0.5 rounded"
                                title="GPS erfassen"
                              >
                                <MapPin className="w-3 h-3 text-surface-600" />
                                Kein GPS
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="px-4 py-3 border-t border-surface-800/60 bg-surface-950/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-surface-400">
              <p>
                Gesamt: <strong className="text-surface-100 font-bold">{processedCustomers.length} Kunden</strong> ·{' '}
                <strong className="text-emerald-400 font-bold">{customersWithGpsCount} mit GPS</strong> ·{' '}
                <strong className="text-brand-400 font-bold">{customersWithPhotosCount} mit Fotos</strong>
              </p>
              <p className="text-[11px] text-surface-500">
                Fahrer erfassen Fotos & GPS direkt beim Kundenbesuch
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

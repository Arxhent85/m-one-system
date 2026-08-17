'use client'

import { useState, useMemo, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Users, Search, ArrowUpDown, MapPin, Phone, UserCheck, Navigation, ExternalLink, Map, List } from 'lucide-react'
import { getCustomerGpsMap, type CustomerGpsInfo } from '@/lib/stockStore'
import CustomerDetailModal from '@/components/analytics/CustomerDetailModal'

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
  const [viewMode, setViewMode] = useState<'list' | 'map'>('map')
  const [searchQuery, setSearchQuery] = useState('')
  const [agentFilter, setAgentFilter] = useState('all')
  const [gpsFilter, setGpsFilter] = useState<'all' | 'with_gps' | 'without_gps'>('all')
  const [sortBy, setSortBy] = useState<'number_asc' | 'number_desc' | 'name_asc' | 'city_asc'>('number_asc')
  const [customerGpsMap, setCustomerGpsMap] = useState<Record<string, CustomerGpsInfo>>({})
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null)

  // Load and sync GPS Registry
  useEffect(() => {
    function syncGps() {
      const localGps = getCustomerGpsMap()
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

    syncGps()
    window.addEventListener('m_one_customer_gps_updated', syncGps)
    window.addEventListener('m_one_sale_recorded', syncGps)
    return () => {
      window.removeEventListener('m_one_customer_gps_updated', syncGps)
      window.removeEventListener('m_one_sale_recorded', syncGps)
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

    // Fallback: check if notes contain GPS
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

  // Extract unique agents for dropdown filter
  const availableAgents = useMemo(() => {
    const agents = new Set<string>()
    customers.forEach((c) => {
      agents.add(getAgentName(c))
    })
    return Array.from(agents).sort()
  }, [customers])

  // Count customers with GPS
  const customersWithGpsCount = useMemo(() => {
    return customers.filter((c) => getGpsInfo(c) !== null).length
  }, [customers, customerGpsMap])

  // Filter & Sort Customers
  const processedCustomers = useMemo(() => {
    return customers
      .filter((c) => {
        // Agent filter
        if (agentFilter !== 'all') {
          const agentName = getAgentName(c)
          if (agentName.toLowerCase() !== agentFilter.toLowerCase()) return false
        }
        // GPS filter
        const gps = getGpsInfo(c)
        if (gpsFilter === 'with_gps' && !gps) return false
        if (gpsFilter === 'without_gps' && gps) return false

        // Search filter
        if (!searchQuery.trim()) return true
        const q = searchQuery.toLowerCase()
        const num = (c.customer_number ?? '').toLowerCase()
        const name = (c.company_name ?? '').toLowerCase()
        const city = (c.city ?? '').toLowerCase()
        const phone = (c.phone ?? '').toLowerCase()
        return num.includes(q) || name.includes(q) || city.includes(q) || phone.includes(q)
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
  }, [customers, searchQuery, agentFilter, gpsFilter, sortBy, customerGpsMap])

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

      {/* KPI Stats Banner for GPS Tracking */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="glass-card p-4 flex items-center justify-between border border-surface-700/60">
          <div>
            <p className="text-xs text-surface-400 font-medium">Gesamte Kundenkartei</p>
            <p className="text-2xl font-black text-surface-100 font-mono mt-0.5">{customers.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-surface-800 text-surface-300 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card p-4 flex items-center justify-between border border-emerald-800/40 bg-emerald-950/20">
          <div>
            <p className="text-xs text-emerald-400 font-semibold">📍 GPS-Standort erfasst</p>
            <p className="text-2xl font-black text-emerald-300 font-mono mt-0.5">{customersWithGpsCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-800/60 text-emerald-400 flex items-center justify-center">
            <Navigation className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card p-4 flex items-center justify-between border border-surface-700/60">
          <div>
            <p className="text-xs text-surface-400 font-medium">Noch ohne Standort</p>
            <p className="text-2xl font-black text-surface-400 font-mono mt-0.5">{customers.length - customersWithGpsCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-surface-900 text-surface-500 flex items-center justify-center">
            <MapPin className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* VIEW MODE TABS: TABELLE VS KOSOVO-LANDKARTE */}
      <div className="flex items-center justify-between gap-3 border-b border-surface-800/80 pb-2">
        <div className="flex items-center gap-2 bg-surface-900/90 p-1.5 rounded-2xl border border-surface-700/60 shadow-inner">
          <button
            type="button"
            onClick={() => setViewMode('map')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              viewMode === 'map'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-950/60'
                : 'text-surface-400 hover:text-surface-200'
            }`}
          >
            <Map className="w-4 h-4 text-emerald-300" />
            <span>🗺️ Kosovo-Landkarte (Interaktiv)</span>
            <span className="bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded-md text-[10px] font-mono font-black border border-emerald-700/60 shadow-sm">
              NEU
            </span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              viewMode === 'list'
                ? 'bg-brand-600 text-white shadow-md'
                : 'text-surface-400 hover:text-surface-200'
            }`}
          >
            <List className="w-4 h-4" />
            <span>📋 Tabellenansicht ({customers.length})</span>
          </button>
        </div>

        <span className="text-xs text-surface-400 font-medium hidden sm:inline">
          {viewMode === 'map' ? '🇽🇰 Nur Kosovo sichtbar · Nachbarländer maskiert' : 'Kundenkartei mit Touren & Live-GPS'}
        </span>
      </div>

      {/* MAP VIEW */}
      {viewMode === 'map' && (
        <KosovoCustomerMap
          customers={customers}
          onSelectCustomer={(c) => setSelectedCustomer(c)}
        />
      )}

      {/* TABLE VIEW */}
      {viewMode === 'list' && (
        <>
          {/* Search and Filter Controls */}
          <div className="glass-card p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              
              {/* Quick Search */}
              <div className="flex-1 min-w-[260px]">
                <label className="text-[11px] font-semibold text-surface-400 uppercase tracking-wider block mb-1">
                  Kunden suchen
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500 pointer-events-none" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Kd.-Nr., Firma, Ort oder Telefon..."
                    className="input pl-9 py-2 bg-surface-900 border-surface-700 w-full"
                  />
                </div>
              </div>

              {/* GPS Filter Toggle */}
              <div className="w-48">
                <label className="text-[11px] font-semibold text-surface-400 uppercase tracking-wider block mb-1">
                  GPS-Standort
                </label>
                <select
                  value={gpsFilter}
                  onChange={(e) => setGpsFilter(e.target.value as any)}
                  className="input py-2 bg-surface-900 border-surface-700 text-surface-100 w-full font-medium"
                >
                  <option value="all">📍 Alle Kunden</option>
                  <option value="with_gps">✅ Mit GPS ({customersWithGpsCount})</option>
                  <option value="without_gps">⏳ Noch ohne GPS</option>
                </select>
              </div>

              {/* Agent/Driver Filter */}
              <div className="w-56">
                <label className="text-[11px] font-semibold text-surface-400 uppercase tracking-wider block mb-1">
                  Fahrer / Agent
                </label>
                <select
                  value={agentFilter}
                  onChange={(e) => setAgentFilter(e.target.value)}
                  className="input py-2 bg-surface-900 border-surface-700 text-surface-100 w-full font-medium"
                >
                  <option value="all">👤 Alle Agenten</option>
                  {availableAgents.map((agent) => (
                    <option key={agent} value={agent}>
                      🚚 {agent}
                    </option>
                  ))}
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
                    className="input pl-9 py-2 bg-surface-900 border-surface-700 text-surface-100 w-full"
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
                    <th className="px-4 py-3 w-36">Ort</th>
                    <th className="px-4 py-3 w-40">Telefon</th>
                    <th className="px-4 py-3 w-44">Agent / Fahrer</th>
                    <th className="px-4 py-3 w-48 text-center">📍 GPS-Standort</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-800/40">
                  {processedCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-surface-500">
                        Keine Kunden für die gewählten Filter gefunden.
                      </td>
                    </tr>
                  ) : (
                    processedCustomers.map((c, idx) => {
                      const agentName = getAgentName(c)
                      const gps = getGpsInfo(c)
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
                            <span className="font-mono text-sm font-bold text-brand-400 bg-brand-950/60 px-2 py-0.5 rounded border border-brand-800/40">
                              {c.customer_number || '—'}
                            </span>
                          </td>

                          {/* Company Name */}
                          <td className="px-4 py-3 font-semibold text-surface-100">
                            {c.company_name}
                          </td>

                          {/* City */}
                          <td className="px-4 py-3">
                            {c.city ? (
                              <span className="inline-flex items-center gap-1.5 text-surface-300">
                                <MapPin className="w-3.5 h-3.5 text-surface-500 shrink-0" />
                                {c.city}
                              </span>
                            ) : (
                              <span className="text-surface-600">—</span>
                            )}
                          </td>

                          {/* Phone */}
                          <td className="px-4 py-3">
                            {c.phone ? (
                              <span className="inline-flex items-center gap-1.5 text-surface-300 font-mono text-xs">
                                <Phone className="w-3.5 h-3.5 text-surface-500 shrink-0" />
                                {c.phone}
                              </span>
                            ) : (
                              <span className="text-surface-600">—</span>
                            )}
                          </td>

                          {/* Agent */}
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1 text-xs font-medium bg-emerald-950/60 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-800/40">
                              <UserCheck className="w-3 h-3 shrink-0" />
                              {agentName}
                            </span>
                          </td>

                          {/* GPS Location & Google Maps Link */}
                          <td className="px-4 py-3 text-center">
                            {gps ? (
                              <a
                                href={gps.google_maps_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300 bg-emerald-950/90 hover:bg-emerald-900/90 border border-emerald-700/70 hover:border-emerald-500 px-3 py-1.5 rounded-xl transition-all shadow-sm active:scale-95 group"
                                title={`GPS: ${gps.lat}, ${gps.lng} — In Google Maps öffnen`}
                              >
                                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
                                <span>Google Maps</span>
                                <ExternalLink className="w-3 h-3 text-emerald-500 ml-0.5" />
                              </a>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] text-surface-500 italic px-2 py-1 rounded bg-surface-950/40">
                                <MapPin className="w-3 h-3 text-surface-600" />
                                Noch kein GPS
                              </span>
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
            <div className="px-4 py-3 border-t border-surface-800/60 bg-surface-950/80 flex items-center justify-between text-xs text-surface-400">
              <p>
                Gesamt: <strong className="text-surface-100 font-bold">{processedCustomers.length} Kunden</strong> · <strong className="text-emerald-400 font-bold">{customersWithGpsCount} mit GPS-Position</strong>
              </p>
              <p>
                Automatische Standorterfassung bei jedem Fahrer-Scan aktiv
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

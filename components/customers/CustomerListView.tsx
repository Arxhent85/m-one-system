'use client'

import { useState, useMemo } from 'react'
import { Users, Search, ArrowUpDown, MapPin, Phone, UserCheck } from 'lucide-react'

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
}

interface CustomerListViewProps {
  customers: CustomerItem[]
}

export default function CustomerListView({ customers }: CustomerListViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [agentFilter, setAgentFilter] = useState('all')
  const [sortBy, setSortBy] = useState<'number_asc' | 'number_desc' | 'name_asc' | 'city_asc'>('number_asc')

  // Helper to extract agent name
  function getAgentName(c: CustomerItem): string {
    if (c.agent) return c.agent
    const match = c.notes?.match(/Agent:\s*([^|]+)/i)?.[1]?.trim()
    if (match) return match
    const num = c.customer_number || ''
    if (num.startsWith('1')) return 'Qerimi (Fahrzeug 2)'
    if (num.startsWith('2')) return 'Mensuri (Fahrzeug 1)'
    if (num.startsWith('3')) return 'Miloti'
    return 'M-ONE Admin'
  }

  // Extract unique agents for dropdown filter
  const availableAgents = useMemo(() => {
    const agents = new Set<string>()
    customers.forEach((c) => {
      agents.add(getAgentName(c))
    })
    return Array.from(agents).sort()
  }, [customers])

  // Filter & Sort Customers
  const processedCustomers = useMemo(() => {
    return customers
      .filter((c) => {
        // Agent filter
        if (agentFilter !== 'all') {
          const agentName = getAgentName(c)
          if (agentName.toLowerCase() !== agentFilter.toLowerCase()) return false
        }
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
  }, [customers, searchQuery, agentFilter, sortBy])

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <div className="glass-card p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          
          {/* Quick Search */}
          <div className="flex-1 min-w-[280px]">
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

          {/* Agent/Driver Filter */}
          <div className="w-64">
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
          <div className="w-56">
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
                <th className="px-4 py-3 w-40">Ort</th>
                <th className="px-4 py-3 w-44">Telefon</th>
                <th className="px-4 py-3 w-48">Agent / Fahrer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-800/40">
              {processedCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-surface-500">
                    Keine Kunden für die gewählten Filter gefunden.
                  </td>
                </tr>
              ) : (
                processedCustomers.map((c, idx) => {
                  const agentName = getAgentName(c)
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
            Gesamt: <strong className="text-surface-100 font-bold">{processedCustomers.length} Kunden</strong>
          </p>
          <p>
            Alle Kundennummern aus der Kundenkartei 2026 übernommen
          </p>
        </div>
      </div>
    </div>
  )
}

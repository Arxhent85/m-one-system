'use client'

import { useState, useMemo } from 'react'
import { Truck, Search, ArrowUpDown, Filter, Package, AlertCircle } from 'lucide-react'

interface StockItem {
  quantity: number
  min_stock?: number
  products: {
    id: string
    sku: string
    name: string
    unit: string
    selling_price: number
    purchase_price: number
  }
}

interface Location {
  id: string
  name: string
  type: string
  stock_items: StockItem[]
}

interface VehicleStockViewProps {
  locations: Location[]
}

export default function VehicleStockView({ locations }: VehicleStockViewProps) {
  // Keep strictly official vehicle depots (Mensuri & Qerimi)
  const vehicles = useMemo(() => {
    const OFFICIAL_VEHICLE_IDS = [
      '22222222-2222-2222-2222-222222222222',
      '33333333-3333-3333-3333-333333333333'
    ]
    return locations.filter((loc) =>
      OFFICIAL_VEHICLE_IDS.includes(loc.id) ||
      loc.name.includes('Depo Mensuri') ||
      loc.name.includes('Depo Qerimi')
    )
  }, [locations])

  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'sku_asc' | 'sku_desc' | 'name_asc' | 'qty_desc' | 'val_desc'>('sku_asc')

  // Filter vehicles by selected dropdown
  const filteredVehicles = useMemo(() => {
    if (selectedVehicleId === 'all') {
      return vehicles
    }
    return vehicles.filter((v) => v.id === selectedVehicleId)
  }, [vehicles, selectedVehicleId])

  // Summary statistics across filtered vehicles
  const overallStats = useMemo(() => {
    let totalItemsCount = 0
    let totalQty = 0
    let totalValue = 0

    filteredVehicles.forEach((v) => {
      v.stock_items?.forEach((item) => {
        if (item.quantity > 0) {
          totalItemsCount += 1
          totalQty += item.quantity
          totalValue += item.quantity * (item.products?.selling_price ?? 0)
        }
      })
    })

    return { totalItemsCount, totalQty, totalValue }
  }, [filteredVehicles])

  return (
    <div className="space-y-6">
      {/* Dynamic Controls Bar */}
      <div className="glass-card p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          
          {/* Vehicle Dropdown Selector */}
          <div className="flex items-center gap-3 flex-1 min-w-[280px]">
            <div className="w-9 h-9 rounded-xl bg-brand-900/60 text-brand-400 flex items-center justify-center shrink-0 border border-brand-700/30">
              <Truck className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <label className="text-[11px] font-semibold text-surface-400 uppercase tracking-wider block mb-1">
                Fahrzeug auswählen
              </label>
              <select
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                className="input py-2 px-3 font-medium bg-surface-900 border-surface-700 text-surface-100 w-full focus:ring-2 focus:ring-brand-500"
              >
                <option value="all">🚛 Alle Fahrzeuge ({vehicles.length})</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    📦 {v.name} ({v.stock_items?.length ?? 0} Artikel)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Search */}
          <div className="flex-1 min-w-[240px]">
            <label className="text-[11px] font-semibold text-surface-400 uppercase tracking-wider block mb-1">
              Artikel suchen
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Art.-Nr. oder Name..."
                className="input pl-9 py-2 bg-surface-900 border-surface-700 w-full"
              />
            </div>
          </div>

          {/* Sort Dropdown */}
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
                <option value="sku_asc">Art.-Nr. (aufsteigend)</option>
                <option value="sku_desc">Art.-Nr. (absteigend)</option>
                <option value="name_asc">Bezeichnung (A-Z)</option>
                <option value="qty_desc">Menge (höchste zuerst)</option>
                <option value="val_desc">Bestandswert (€ höchste)</option>
              </select>
            </div>
          </div>

        </div>

        {/* Quick KPI Bar for current selection */}
        <div className="flex items-center justify-between pt-3 border-t border-surface-800/60 text-xs text-surface-400">
          <div>
            Ausgewählt: <span className="text-surface-100 font-semibold">{filteredVehicles.length} Fahrzeug(e)</span>
          </div>
          <div className="flex items-center gap-6">
            <div>
              Positionen: <span className="text-surface-100 font-bold tabular-nums">{overallStats.totalItemsCount}</span>
            </div>
            <div>
              Stückzahl gesamt: <span className="text-surface-100 font-bold tabular-nums">{overallStats.totalQty.toLocaleString('de-DE')}</span>
            </div>
            <div>
              Warenwert (VK): <span className="text-emerald-400 font-bold tabular-nums">{overallStats.totalValue.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Render Vehicles Stock Tables */}
      {filteredVehicles.length === 0 ? (
        <div className="glass-card p-12 text-center text-surface-400">
          <Truck className="w-12 h-12 mx-auto mb-4 opacity-30 text-brand-400" />
          <p className="text-lg font-medium">Keine Fahrzeuge gefunden</p>
        </div>
      ) : (
        filteredVehicles.map((vehicle) => {
          // Process and sort items for this vehicle
          const processedItems = (vehicle.stock_items ?? [])
            .filter((item) => {
              if (!searchQuery.trim()) return true
              const q = searchQuery.toLowerCase()
              const sku = item.products?.sku?.toLowerCase() ?? ''
              const name = item.products?.name?.toLowerCase() ?? ''
              return sku.includes(q) || name.includes(q)
            })
            .sort((a, b) => {
              const pA = a.products
              const pB = b.products
              if (!pA || !pB) return 0

              if (sortBy === 'sku_asc') {
                return (parseInt(pA.sku) || 0) - (parseInt(pB.sku) || 0)
              }
              if (sortBy === 'sku_desc') {
                return (parseInt(pB.sku) || 0) - (parseInt(pA.sku) || 0)
              }
              if (sortBy === 'name_asc') {
                return pA.name.localeCompare(pB.name)
              }
              if (sortBy === 'qty_desc') {
                return (b.quantity || 0) - (a.quantity || 0)
              }
              if (sortBy === 'val_desc') {
                const valA = (a.quantity || 0) * (pA.selling_price || 0)
                const valB = (b.quantity || 0) * (pB.selling_price || 0)
                return valB - valA
              }
              return 0
            })

          const vehicleTotalQty = processedItems.reduce((s, i) => s + (i.quantity ?? 0), 0)
          const vehicleTotalValue = processedItems.reduce(
            (s, i) => s + (i.quantity ?? 0) * (i.products?.selling_price ?? 0),
            0
          )

          return (
            <div key={vehicle.id} className="glass-card overflow-hidden border border-surface-700/50 shadow-lg">
              {/* Vehicle Header Card */}
              <div className="px-5 py-4 bg-gradient-to-r from-emerald-950/60 via-surface-900 to-surface-900 border-b border-surface-700/50 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-800/40 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-surface-50 text-base flex items-center gap-2">
                      {vehicle.name}
                    </h2>
                    <p className="text-xs text-surface-400">
                      Lieferfahrzeug · <span className="text-emerald-400 font-semibold">{processedItems.length}</span> Artikel geladen
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-right">
                  <div>
                    <p className="text-base font-bold text-surface-100 tabular-nums">
                      {vehicleTotalQty.toLocaleString('de-DE')} Stk.
                    </p>
                    <p className="text-[11px] text-surface-500 uppercase tracking-wider">Geladene Menge</p>
                  </div>
                  <div className="pl-4 border-l border-surface-700/60">
                    <p className="text-base font-bold text-emerald-400 tabular-nums">
                      {vehicleTotalValue.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                    </p>
                    <p className="text-[11px] text-surface-500 uppercase tracking-wider">Warenwert (VK)</p>
                  </div>
                </div>
              </div>

              {/* Vehicle Stock Table */}
              {processedItems.length === 0 ? (
                <div className="px-5 py-8 text-center text-surface-500 text-sm">
                  {searchQuery ? 'Keine Artikel entsprechen den Suchkriterien.' : 'Keine Artikel auf diesem Fahrzeug geladen.'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b border-surface-800/80 bg-surface-950/60 text-surface-400 font-semibold text-xs uppercase tracking-wider">
                        <th className="px-4 py-3 w-12 text-center">#</th>
                        <th className="px-4 py-3 w-28">Art.-Nr.</th>
                        <th className="px-4 py-3">Bezeichnung</th>
                        <th className="px-4 py-3 text-right w-36">Menge</th>
                        <th className="px-4 py-3 text-right w-28">VK-Preis</th>
                        <th className="px-4 py-3 text-right w-32">Warenwert</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-800/40">
                      {processedItems.map((item, idx) => {
                        const p = item.products
                        if (!p) return null
                        const qty = item.quantity ?? 0
                        const val = qty * (p.selling_price ?? 0)
                        const isOut = qty <= 0

                        const rowBg = isOut
                          ? 'bg-danger-950/40 border-l-4 border-l-danger-500 hover:bg-danger-950/60'
                          : idx % 2 === 0
                            ? 'bg-surface-900/10'
                            : 'bg-surface-900/40'

                        return (
                          <tr key={`${p.id}-${idx}`} className={`hover:bg-brand-900/20 transition-colors ${rowBg}`}>
                            <td className={`px-4 py-3 text-center text-xs tabular-nums font-mono ${isOut ? 'text-danger-400 font-bold' : 'text-surface-500'}`}>
                              {idx + 1}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`font-mono text-sm font-bold tracking-wider ${isOut ? 'text-danger-400' : 'text-brand-400'}`}>
                                {p.sku}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-medium">
                              <span className={isOut ? 'text-danger-200 font-semibold' : 'text-surface-100'}>
                                {p.name}
                              </span>
                              {isOut && (
                                <span className="ml-2.5 inline-flex items-center gap-1 text-[10px] bg-danger-900/90 text-danger-300 border border-danger-700/80 px-2 py-0.5 rounded-full font-mono font-bold">
                                  ⚠️ 0 STÜCK
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className={`font-black tabular-nums text-base ${isOut ? 'text-danger-400' : 'text-surface-50'}`}>
                                {qty.toLocaleString('de-DE')}
                              </span>
                              <span className={`text-xs ml-1 font-semibold ${isOut ? 'text-danger-400' : 'text-surface-400'}`}>
                                {p.unit}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums text-surface-300 font-medium">
                              {p.selling_price > 0
                                ? p.selling_price.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
                                : '—'}
                            </td>
                            <td className={`px-4 py-3 text-right tabular-nums font-bold ${isOut ? 'text-danger-400/80' : 'text-emerald-400'}`}>
                              {val > 0
                                ? val.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
                                : '0,00 €'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-surface-700/80 bg-surface-950/80 text-surface-200">
                        <td colSpan={3} className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">
                          Gesamt {vehicle.name} ({processedItems.length} Positionen)
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-base text-surface-50 tabular-nums">
                          {vehicleTotalQty.toLocaleString('de-DE')} Stk.
                        </td>
                        <td />
                        <td className="px-4 py-3 text-right font-bold text-base text-emerald-400 tabular-nums">
                          {vehicleTotalValue.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}

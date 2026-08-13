'use client'

import { useState, useMemo, useEffect } from 'react'
import { Warehouse, Truck, Search, ArrowUpDown, Filter, ArrowRightLeft } from 'lucide-react'
import Link from 'next/link'
import { getStockMap, INITIAL_DEPO_PRODUCTS, LOCATION_IDS } from '@/lib/stockStore'

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

interface InventoryViewProps {
  locations: Location[]
}

export default function InventoryView({ locations: initialLocations }: InventoryViewProps) {
  const [selectedLocationId, setSelectedLocationId] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'sku_asc' | 'sku_desc' | 'name_asc' | 'qty_desc' | 'val_desc'>('sku_asc')
  
  // Dynamic stock map state
  const [stockMap, setStockMap] = useState<Record<string, Record<string, number>>>({})

  useEffect(() => {
    function syncServerStock() {
      // 1. Read local stock map
      const local = getStockMap()
      
      // 2. Fetch server stock map from central API (cross-device sync)
      fetch('/api/sales/record')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.stockMap) {
            const merged = { ...local }
            Object.keys(data.stockMap).forEach((locId) => {
              merged[locId] = { ...(merged[locId] || {}), ...data.stockMap[locId] }
            })
            setStockMap(merged)
          } else {
            setStockMap(local)
          }
        })
        .catch(() => {
          setStockMap(local)
        })
    }

    syncServerStock()
    window.addEventListener('focus', syncServerStock)
    window.addEventListener('m_one_stock_changed', syncServerStock)
    return () => {
      window.removeEventListener('focus', syncServerStock)
      window.removeEventListener('m_one_stock_changed', syncServerStock)
    }
  }, [])

  // Build live locations with real current stock map
  const liveLocations = useMemo(() => {
    const OFFICIAL_LOCS = [
      { id: LOCATION_IDS.DEPOT, name: 'Hauptlager Depot (M-ONE)', type: 'depot' },
      { id: LOCATION_IDS.MENSURI, name: 'Fahrzeug 1 (Depo Mensuri)', type: 'vehicle' },
      { id: LOCATION_IDS.QERIMI, name: 'Fahrzeug 2 (Depo Qerimi)', type: 'vehicle' },
    ]

    return OFFICIAL_LOCS.map((loc) => {
      const locStock = stockMap[loc.id] ?? {}

      const stock_items: StockItem[] = INITIAL_DEPO_PRODUCTS.map((p) => {
        const qty = locStock[p.sku] ?? (loc.id === LOCATION_IDS.DEPOT ? p.stock : 0)
        return {
          quantity: qty,
          products: {
            id: p.id,
            sku: p.sku,
            name: p.name,
            unit: p.unit,
            selling_price: p.selling_price,
            purchase_price: p.purchase_price,
          }
        }
      })

      return {
        id: loc.id,
        name: loc.name,
        type: loc.type,
        stock_items,
      }
    })
  }, [stockMap])

  // Filter locations
  const filteredLocations = useMemo(() => {
    if (selectedLocationId === 'all') return liveLocations
    return liveLocations.filter((loc) => loc.id === selectedLocationId)
  }, [liveLocations, selectedLocationId])

  // Overall summary statistics
  const summaryStats = useMemo(() => {
    let totalItems = 0
    let totalQty = 0
    let totalValue = 0

    filteredLocations.forEach((loc) => {
      loc.stock_items?.forEach((si) => {
        if (si.quantity > 0) {
          totalItems += 1
          totalQty += si.quantity
          totalValue += si.quantity * (si.products?.selling_price ?? 0)
        }
      })
    })

    return { totalItems, totalQty, totalValue }
  }, [filteredLocations])

  return (
    <div className="space-y-6">
      {/* Control Bar: Location Dropdown, Search, Sort */}
      <div className="glass-card p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          
          {/* Location Dropdown */}
          <div className="flex items-center gap-3 flex-1 min-w-[280px]">
            <div className="w-9 h-9 rounded-xl bg-brand-900/60 text-brand-400 flex items-center justify-center shrink-0 border border-brand-700/30">
              <Warehouse className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <label className="text-[11px] font-semibold text-surface-400 uppercase tracking-wider block mb-1">
                Standort Filter
              </label>
              <select
                value={selectedLocationId}
                onChange={(e) => setSelectedLocationId(e.target.value)}
                className="input py-2 px-3 font-medium bg-surface-900 border-surface-700 text-surface-100 w-full focus:ring-2 focus:ring-brand-500"
              >
                <option value="all">🏢 Alle Standorte ({liveLocations.length})</option>
                {liveLocations.map((loc) => {
                  const isDepot = loc.type === 'depot'
                  const nonZeroCount = loc.stock_items.filter(i => i.quantity > 0).length
                  return (
                    <option key={loc.id} value={loc.id}>
                      {isDepot ? '🏬' : '🚚'} {loc.name} ({nonZeroCount} Artikel im Lager)
                    </option>
                  )
                })}
              </select>
            </div>
          </div>

          {/* Quick Search Input */}
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
                <option value="sku_asc">Art.-Nr. (aufsteigend)</option>
                <option value="sku_desc">Art.-Nr. (absteigend)</option>
                <option value="name_asc">Bezeichnung (A-Z)</option>
                <option value="qty_desc">Menge (höchste zuerst)</option>
                <option value="val_desc">Bestandswert (€ höchste)</option>
              </select>
            </div>
          </div>

        </div>

        {/* Quick Stats Banner */}
        <div className="flex items-center justify-between pt-3 border-t border-surface-800/60 text-xs text-surface-400">
          <div>
            Angezeigt: <span className="text-surface-100 font-semibold">{filteredLocations.length} Standort(e)</span>
          </div>
          <div className="flex items-center gap-6">
            <div>
              Menge gesamt: <span className="text-surface-100 font-bold tabular-nums">{summaryStats.totalQty.toLocaleString('de-DE')} Stk.</span>
            </div>
            <div>
              Warenwert (VK): <span className="text-emerald-400 font-bold tabular-nums">{summaryStats.totalValue.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Render Location Tables */}
      {filteredLocations.map((location) => {
        const isDepot = location.type === 'depot'

        // Filter and sort items (DO NOT HIDE ZERO STOCK ITEMS)
        const processedItems = (location.stock_items ?? [])
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

        const totalQty = processedItems.reduce((s, i) => s + (i.quantity ?? 0), 0)
        const totalVal = processedItems.reduce((s, i) => s + (i.quantity ?? 0) * (i.products?.selling_price ?? 0), 0)
        const zeroStockCount = processedItems.filter((i) => (i.quantity ?? 0) <= 0).length

        return (
          <div key={location.id} className="glass-card overflow-hidden border border-surface-700/50 shadow-lg">
            {/* Header */}
            <div className={`px-5 py-4 border-b border-surface-700/50 flex flex-wrap items-center justify-between gap-4 ${
              isDepot ? 'bg-gradient-to-r from-brand-950/70 via-surface-900 to-surface-900' : 'bg-gradient-to-r from-emerald-950/70 via-surface-900 to-surface-900'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                  isDepot ? 'bg-brand-800/40 text-brand-400 border-brand-500/30' : 'bg-emerald-800/40 text-emerald-400 border-emerald-500/30'
                }`}>
                  {isDepot ? <Warehouse className="w-5 h-5" /> : <Truck className="w-5 h-5" />}
                </div>
                <div>
                  <h2 className="font-bold text-surface-50 text-base">{location.name}</h2>
                  <p className="text-xs text-surface-400 flex items-center gap-2">
                    <span>{isDepot ? 'Zentrales Hauptlager' : 'Lieferfahrzeug'} · <strong className="text-brand-400">{processedItems.length}</strong> Artikel</span>
                    {zeroStockCount > 0 && (
                      <span className="bg-danger-950 text-danger-400 border border-danger-800 px-2 py-0.5 rounded-full text-[10px] font-bold">
                        ⚠️ {zeroStockCount} leer (0 Bestand)
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6 text-right">
                <div>
                  <p className="text-base font-bold text-surface-100 tabular-nums">
                    {totalQty.toLocaleString('de-DE')} Stk.
                  </p>
                  <p className="text-[11px] text-surface-500 uppercase tracking-wider">Lagerbestand</p>
                </div>
                <div className="pl-4 border-l border-surface-700/60">
                  <p className="text-base font-bold text-emerald-400 tabular-nums">
                    {totalVal.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                  </p>
                  <p className="text-[11px] text-surface-500 uppercase tracking-wider">Warenwert (VK)</p>
                </div>
              </div>
            </div>

            {/* Table */}
            {processedItems.length === 0 ? (
              <div className="px-5 py-8 text-center text-surface-500 text-sm">
                Keine Artikel auf diesem Fahrzeug / Lager vorhanden.
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
                      <th className="px-4 py-3 text-right w-28">EK-Preis</th>
                      <th className="px-4 py-3 text-right w-28">VK-Preis</th>
                      <th className="px-4 py-3 text-right w-32">Bestandswert</th>
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
                                ⚠️ 0 BESTAND
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
                          <td className="px-4 py-3 text-right tabular-nums text-surface-400 font-medium">
                            {p.purchase_price > 0 ? p.purchase_price.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }) : '—'}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-surface-200 font-semibold">
                            {p.selling_price > 0 ? p.selling_price.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }) : '—'}
                          </td>
                          <td className={`px-4 py-3 text-right tabular-nums font-bold ${isOut ? 'text-danger-400/80' : 'text-emerald-400'}`}>
                            {val > 0 ? val.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }) : '0,00 €'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-surface-700/80 bg-surface-950/80 text-surface-200">
                      <td colSpan={3} className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">
                        Gesamt {location.name} ({processedItems.length} Artikel)
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-base text-surface-50 tabular-nums">
                        {totalQty.toLocaleString('de-DE')} Stk.
                      </td>
                      <td colSpan={2} />
                      <td className="px-4 py-3 text-right font-bold text-base text-emerald-400 tabular-nums">
                        {totalVal.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

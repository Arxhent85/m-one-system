'use client'

import { useEffect, useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { Package, Truck, AlertTriangle, TrendingDown } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/currency'
import {
  getStockMap,
  INITIAL_DEPO_PRODUCTS,
  INITIAL_MENSURI_STOCK,
  INITIAL_QERIMI_STOCK,
  LOCATION_IDS,
} from '@/lib/stockStore'

export default function DriverStockPage() {
  const searchParams = useSearchParams()
  const driver = searchParams.get('driver') ?? 'mensuri'

  const isMensuri = driver === 'mensuri'
  const vehicleLocId  = isMensuri ? LOCATION_IDS.MENSURI : LOCATION_IDS.QERIMI
  const vehicleName   = isMensuri ? 'Fahrzeug 1 – Mensuri' : 'Fahrzeug 2 – Qerimi'
  const driverPrefix  = isMensuri ? '2' : '1'

  const [stockMap, setStockMap] = useState<Record<string, Record<string, number>>>({})

  useEffect(() => {
    function load() { setStockMap(getStockMap()) }
    load()
    window.addEventListener('m_one_stock_changed', load)
    return () => window.removeEventListener('m_one_stock_changed', load)
  }, [])

  const vehicleStock = stockMap[vehicleLocId] ?? {}

  // Alle Produkte des Fahrzeugs (die jemals geladen waren ODER gerade 0 sind)
  const initialVehicleStock = isMensuri ? INITIAL_MENSURI_STOCK : INITIAL_QERIMI_STOCK

  const items = useMemo(() =>
    INITIAL_DEPO_PRODUCTS
      .filter(p => p.sku in initialVehicleStock)  // nur Artikel die für dieses Fahrzeug relevant sind
      .map(p => ({
        ...p,
        currentQty: vehicleStock[p.sku] ?? 0,
      }))
      .sort((a, b) => (parseInt(a.sku) || 0) - (parseInt(b.sku) || 0)),
  [vehicleStock, initialVehicleStock])

  const outOfStock  = items.filter(i => i.currentQty <= 0)
  const inStock     = items.filter(i => i.currentQty > 0)
  const totalValue  = items.reduce((s, i) => s + i.currentQty * i.selling_price, 0)

  return (
    <div className="p-4 space-y-4 animate-in max-w-lg mx-auto pb-24">
      {/* Header */}
      <div className="pt-2 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-surface-50 flex items-center gap-2">
            <Package className="w-5 h-5 text-brand-400" />
            Mein Fahrzeugbestand
          </h1>
          <p className="text-emerald-400 text-xs flex items-center gap-1 font-semibold mt-0.5">
            <Truck className="w-3.5 h-3.5" /> {vehicleName}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-surface-50 tabular-nums">{formatCurrency(totalValue)}</p>
          <p className="text-[10px] text-surface-500 uppercase tracking-wider">Warenwert (VK)</p>
        </div>
      </div>

      {/* Warnung wenn Artikel auf 0 */}
      {outOfStock.length > 0 && (
        <div className="flex items-start gap-3 p-3 rounded-xl border bg-danger-950/60 border-danger-700/60 shadow-lg shadow-danger-900/20 animate-pulse-once">
          <AlertTriangle className="w-5 h-5 text-danger-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-danger-300">
              {outOfStock.length} Artikel aufgebraucht!
            </p>
            <p className="text-xs text-danger-400/80 mt-0.5">
              Diese Produkte sind leer — Nachladung aus dem Hauptlager nötig.
            </p>
          </div>
        </div>
      )}

      {/* AUFGEBRAUCHTE ARTIKEL – ROT */}
      {outOfStock.length > 0 && (
        <div className="glass-card overflow-hidden border-danger-800/50">
          <div className="p-3 border-b border-danger-800/40 bg-danger-950/60 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-danger-400">
            <TrendingDown className="w-3.5 h-3.5" />
            Aufgebraucht – Nachfüllen nötig ({outOfStock.length})
          </div>
          <div className="divide-y divide-danger-900/30">
            {outOfStock.map(item => (
              <div
                key={item.sku}
                className="flex items-center justify-between px-4 py-3 bg-danger-950/30 hover:bg-danger-950/50 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-mono font-bold text-danger-500">{item.sku}</p>
                  <p className="text-sm font-medium text-danger-300 truncate">{item.name}</p>
                </div>
                <div className="text-right ml-3 shrink-0">
                  <p className="text-base font-black tabular-nums text-danger-400 animate-pulse">
                    0 {item.unit}
                  </p>
                  <p className="text-[10px] text-danger-600 font-semibold uppercase tracking-wider">Leer!</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VORHANDENE ARTIKEL – GRÜN */}
      <div className="glass-card overflow-hidden">
        <div className="p-3 border-b border-surface-800 bg-surface-950/60 flex items-center justify-between text-xs text-surface-400 font-semibold uppercase tracking-wider">
          <span>Auf Lager ({inStock.length} Positionen)</span>
          <span>Menge</span>
        </div>
        <div className="divide-y divide-surface-800/40">
          {inStock.length === 0 ? (
            <div className="p-6 text-center text-surface-500 text-xs">
              Alle Artikel aufgebraucht.
            </div>
          ) : (
            inStock.map(item => (
              <div
                key={item.sku}
                className="flex items-center justify-between px-4 py-3 hover:bg-surface-900/30 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-mono font-bold text-brand-400">{item.sku}</p>
                  <p className="text-sm font-medium text-surface-100 truncate">{item.name}</p>
                </div>
                <div className="text-right ml-3 shrink-0">
                  <p className="text-base font-bold tabular-nums text-emerald-400">
                    {item.currentQty.toLocaleString('de-DE')} {item.unit}
                  </p>
                  <p className="text-xs text-surface-400 tabular-nums">
                    {formatCurrency(item.selling_price)} / Stk
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

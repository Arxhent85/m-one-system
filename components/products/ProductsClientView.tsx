'use client'

import { useState, useEffect, useMemo } from 'react'
import { Package, Search, Save, RotateCcw, CheckCircle2, AlertCircle, Edit3, DollarSign, Sparkles } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/currency'
import { INITIAL_DEPO_PRODUCTS, getCustomPricesMap, saveCustomPricesMap, ProductStockInfo } from '@/lib/stockStore'
import Link from 'next/link'

interface ProductsClientViewProps {
  initialProducts: any[]
}

export default function ProductsClientView({ initialProducts }: ProductsClientViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [pricesMap, setPricesMap] = useState<Record<string, number>>({})
  const [originalPricesMap, setOriginalPricesMap] = useState<Record<string, number>>({})
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Load custom prices on mount and sync with server API
  useEffect(() => {
    function loadPrices() {
      const localMap = getCustomPricesMap()
      const merged: Record<string, number> = {}
      
      INITIAL_DEPO_PRODUCTS.forEach((p) => {
        merged[p.sku] = localMap[p.sku] !== undefined ? localMap[p.sku] : p.selling_price
      })

      setPricesMap(merged)
      setOriginalPricesMap(merged)

      // Sync with server API
      fetch('/api/products/prices')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.prices && Object.keys(data.prices).length > 0) {
            const serverMap = { ...merged, ...data.prices }
            setPricesMap(serverMap)
            setOriginalPricesMap(serverMap)
            saveCustomPricesMap(serverMap)
          }
        })
        .catch((e) => console.warn('Server price load warning:', e))
    }

    loadPrices()
    window.addEventListener('m_one_products_changed', loadPrices)
    return () => window.removeEventListener('m_one_products_changed', loadPrices)
  }, [])

  // Filter products by search query
  const filteredProducts = useMemo(() => {
    return INITIAL_DEPO_PRODUCTS.filter((p) => {
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      return p.sku.toLowerCase().includes(q) || p.name.toLowerCase().includes(q)
    })
  }, [searchQuery])

  // Count modified prices
  const dirtyCount = useMemo(() => {
    let count = 0
    Object.keys(pricesMap).forEach((sku) => {
      if (pricesMap[sku] !== originalPricesMap[sku]) {
        count++
      }
    })
    return count
  }, [pricesMap, originalPricesMap])

  function handlePriceChange(sku: string, valStr: string) {
    const val = parseFloat(valStr.replace(',', '.'))
    setPricesMap((prev) => ({
      ...prev,
      [sku]: isNaN(val) ? 0 : val,
    }))
  }

  async function handleSaveAll() {
    setIsSaving(true)
    saveCustomPricesMap(pricesMap)
    setOriginalPricesMap({ ...pricesMap })

    try {
      await fetch('/api/products/prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prices: pricesMap }),
      })
    } catch (e) {
      console.warn('Server price save warning:', e)
    }

    setIsSaving(false)
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 3500)
  }

  function handleResetToDefaults() {
    if (confirm('Möchtest du wirklich alle Verkaufspreise auf die Standard-Shumice-Preise zurücksetzen?')) {
      const defaultMap: Record<string, number> = {}
      INITIAL_DEPO_PRODUCTS.forEach((p) => {
        defaultMap[p.sku] = p.selling_price
      })
      setPricesMap(defaultMap)
      setOriginalPricesMap(defaultMap)
      saveCustomPricesMap(defaultMap)
      
      fetch('/api/products/prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prices: defaultMap }),
      }).catch((e) => console.warn('Reset error:', e))
    }
  }

  return (
    <div className="space-y-6 animate-in">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-50 flex items-center gap-2.5">
            <Package className="w-7 h-7 text-brand-400" />
            Produktkatalog & Preisverwaltung
          </h1>
          <p className="text-surface-400 text-sm mt-1">
            {INITIAL_DEPO_PRODUCTS.length} Artikel im Sortiment · <span className="text-emerald-400 font-semibold">Preise im Büro anpassen & live für Fahrer-App speichern</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          {dirtyCount > 0 && (
            <button
              onClick={() => setPricesMap({ ...originalPricesMap })}
              className="btn-ghost py-2 px-3 text-xs text-surface-400 hover:text-surface-200"
            >
              Änderungen verwerfen
            </button>
          )}

          <button
            onClick={handleResetToDefaults}
            className="btn-secondary py-2 px-3 text-xs flex items-center gap-1.5 text-surface-300"
            title="Auf Standard-Preise zurücksetzen"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Standard-Preise
          </button>

          <button
            onClick={handleSaveAll}
            disabled={dirtyCount === 0 || isSaving}
            className={`btn-primary py-2.5 px-5 font-bold text-sm flex items-center gap-2 transition-all ${
              dirtyCount > 0
                ? 'bg-emerald-600 hover:bg-emerald-500 shadow-glow text-white'
                : 'opacity-50 cursor-not-allowed bg-surface-800 text-surface-500 border-surface-700'
            }`}
          >
            <Save className="w-4 h-4" />
            <span>Preise speichern</span>
            {dirtyCount > 0 && (
              <span className="ml-1 bg-white text-emerald-950 px-2 py-0.5 rounded-full text-xs font-black">
                {dirtyCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Erfolgs-Meldung */}
      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-sm flex items-center gap-3 shadow-lg animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <p className="font-bold">Verkaufspreise erfolgreich gespeichert!</p>
            <p className="text-xs text-emerald-400/80">Alle Preise wurden aktualisiert und sind ab sofort live auf allen Smartphones (Fahrer-App) & im Büro aktiv.</p>
          </div>
        </div>
      )}

      {/* Suche & Filter Bar */}
      <div className="glass-card p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Artikelnummer oder Bezeichnung suchen…"
              className="input pl-9 py-2 bg-surface-900 border-surface-700 w-full"
            />
          </div>

          <div className="text-xs text-surface-400 flex items-center gap-3">
            <span>Angezeigt: <strong className="text-surface-100">{filteredProducts.length} Artikel</strong></span>
            {dirtyCount > 0 && (
              <span className="text-amber-400 font-bold bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-800/60">
                ✏️ {dirtyCount} ungespeicherte Änderung(en)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Interaktive Produkttabelle */}
      <div className="glass-card overflow-hidden border border-surface-700/50 shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-700/60 bg-surface-950/80 text-surface-400 font-semibold text-xs uppercase tracking-wider">
                <th className="text-center px-4 py-3 w-12">#</th>
                <th className="text-left px-4 py-3 w-32">Art.-Nr.</th>
                <th className="text-left px-4 py-3">Bezeichnung</th>
                <th className="text-left px-4 py-3 w-24">Einheit</th>
                <th className="text-right px-4 py-3 w-28">EK-Preis</th>
                <th className="text-right px-4 py-3 w-40">VK-Preis (Shumice)</th>
                <th className="text-right px-4 py-3 w-24">Marge</th>
                <th className="text-center px-4 py-3 w-28">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-800/40">
              {filteredProducts.map((product, idx) => {
                const currentVk = pricesMap[product.sku] ?? product.selling_price
                const isModified = currentVk !== originalPricesMap[product.sku]
                const margin = currentVk > 0
                  ? ((currentVk - product.purchase_price) / currentVk) * 100
                  : 0
                const rowBg = isModified
                  ? 'bg-amber-950/20 border-l-4 border-l-amber-500'
                  : idx % 2 === 0
                  ? 'bg-surface-900/10'
                  : 'bg-surface-900/40'

                return (
                  <tr
                    key={product.sku}
                    className={`hover:bg-brand-900/15 transition-colors ${rowBg}`}
                  >
                    <td className="px-4 py-3 text-center text-surface-500 text-xs font-mono">
                      {idx + 1}
                    </td>

                    <td className="px-4 py-3 font-mono text-sm font-bold text-brand-400">
                      {product.sku}
                    </td>

                    <td className="px-4 py-3 font-semibold text-surface-100">
                      {product.name}
                    </td>

                    <td className="px-4 py-3 text-xs text-surface-400">
                      <span className="bg-surface-800 px-2 py-0.5 rounded font-mono">
                        {product.unit}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right text-xs text-surface-400 font-mono">
                      {product.purchase_price > 0 ? formatCurrency(product.purchase_price) : '—'}
                    </td>

                    {/* Interaktives VK-Preis Eingabefeld */}
                    <td className="px-4 py-2.5 text-right">
                      <div className="relative inline-flex items-center">
                        <input
                          type="number"
                          step="0.05"
                          min="0"
                          value={currentVk === 0 ? '' : currentVk}
                          onChange={(e) => handlePriceChange(product.sku, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && dirtyCount > 0) {
                              handleSaveAll()
                            }
                          }}
                          className={`w-28 text-right font-bold text-sm font-mono py-1.5 px-2.5 rounded-xl border transition-all ${
                            isModified
                              ? 'bg-amber-950/80 text-amber-300 border-amber-500 focus:ring-2 focus:ring-amber-400'
                              : 'bg-surface-900 text-emerald-400 border-surface-700 focus:border-brand-500'
                          }`}
                        />
                        <span className="ml-1 text-xs font-bold text-surface-400">€</span>
                      </div>
                    </td>

                    {/* Marge % */}
                    <td className="px-4 py-3 text-right tabular-nums">
                      {currentVk > 0 ? (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          margin >= 40 ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                          margin >= 20 ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                          'bg-rose-950 text-rose-400 border border-rose-800'
                        }`}>
                          {margin.toFixed(0)}%
                        </span>
                      ) : (
                        <span className="text-surface-600 text-xs">—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 text-center">
                      {isModified ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-700/60">
                          <Edit3 className="w-3 h-3" /> Geändert
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-surface-500">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500/70" /> Gespeichert
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-surface-800/60 bg-surface-950/80 flex items-center justify-between text-xs text-surface-400">
          <p>
            Gesamt: <strong className="text-surface-100 font-bold">{INITIAL_DEPO_PRODUCTS.length} Artikel</strong>
          </p>
          {dirtyCount > 0 ? (
            <button
              onClick={handleSaveAll}
              className="text-emerald-400 hover:underline font-bold flex items-center gap-1"
            >
              <Save className="w-3.5 h-3.5" /> {dirtyCount} Änderung(en) jetzt speichern →
            </button>
          ) : (
            <p className="text-surface-500">
              Alle Verkaufspreise sind aktuell & synchron.
            </p>
          )}
        </div>
      </div>

    </div>
  )
}

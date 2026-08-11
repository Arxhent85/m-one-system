'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import {
  ArrowLeftRight, Check, Loader2, Trash2,
  Zap, BookmarkCheck, X, Plus, AlertCircle, Warehouse
} from 'lucide-react'
import {
  INITIAL_DEPO_PRODUCTS,
  LOCATION_IDS,
  getStockMap,
  executeStockTransfer,
  getTransfersHistory,
  StockTransferRecord
} from '@/lib/stockStore'

// VORLAGEN JE FAHRZEUG (basierend auf typischer Beladung laut Depo-Dateien)
const TEMPLATE_MENSURI = [
  { sku: '35109', qty: 24 }, { sku: '35110', qty: 12 },
  { sku: '35121', qty: 24 }, { sku: '35108', qty: 24 },
  { sku: '35113', qty: 24 }, { sku: '35111', qty: 12 },
  { sku: '35112', qty: 24 }, { sku: '35115', qty: 12 },
  { sku: '54412', qty: 12 }, { sku: '49644', qty: 12 },
]
const TEMPLATE_QERIMI = [
  { sku: '35109', qty: 24 }, { sku: '35110', qty: 24 },
  { sku: '35121', qty: 24 }, { sku: '35111', qty: 24 },
  { sku: '35113', qty: 24 }, { sku: '35115', qty: 24 },
  { sku: '35112', qty: 24 }, { sku: '35128', qty: 24 },
  { sku: '54412', qty: 24 }, { sku: '49644', qty: 24 },
]

export interface ProductItem {
  id: string
  sku: string
  name: string
  stock: number
  unit: string
  purchase_price: number
  selling_price: number
}

interface TransferLine {
  id: string
  product: ProductItem | null
  qty: number
  searchText: string
  showDropdown: boolean
}

function emptyLine(): TransferLine {
  return {
    id: Math.random().toString(36).slice(2),
    product: null, qty: 0, searchText: '', showDropdown: false,
  }
}

const DESTINATIONS = [
  { id: LOCATION_IDS.MENSURI, label: '🚚 Fahrzeug 1 — Depo Mensuri', template: TEMPLATE_MENSURI },
  { id: LOCATION_IDS.QERIMI, label: '🚚 Fahrzeug 2 — Depo Qerimi',  template: TEMPLATE_QERIMI  },
  { id: LOCATION_IDS.DEPOT, label: '🏭 Hauptlager Depot (M-ONE)',   template: []               },
]

export default function QuickTransferForm() {
  const [destId, setDestId] = useState(DESTINATIONS[0].id)
  const [srcId,  setSrcId]  = useState(LOCATION_IDS.DEPOT)
  const [lines,  setLines]  = useState<TransferLine[]>([emptyLine()])
  const [notes,  setNotes]  = useState('')
  const [status, setStatus] = useState<'idle'|'loading'|'success'|'error'>('idle')
  const [message, setMsg]   = useState('')
  const [history, setHistory] = useState<StockTransferRecord[]>([])
  
  // State for live stock map
  const [stockMap, setStockMap] = useState<Record<string, Record<string, number>>>({})

  // Load stock map on mount & listen to changes
  useEffect(() => {
    function reload() {
      setStockMap(getStockMap())
      setHistory(getTransfersHistory())
    }
    reload()
    window.addEventListener('m_one_stock_changed', reload)
    return () => window.removeEventListener('m_one_stock_changed', reload)
  }, [])

  // Build live product list with current stock for selected source location
  const liveProducts: ProductItem[] = useMemo(() => {
    const srcStock = stockMap[srcId] ?? {}
    return INITIAL_DEPO_PRODUCTS.map(p => ({
      ...p,
      stock: srcStock[p.sku] ?? 0
    }))
  }, [stockMap, srcId])

  const dest = DESTINATIONS.find(d => d.id === destId) ?? DESTINATIONS[0]
  const src  = DESTINATIONS.find(d => d.id === srcId) ?? DESTINATIONS[2]

  const totalFull = lines.filter(l => l.product && l.qty > 0).length

  // Check if any line exceeds current available stock at source
  const hasStockExceeded = useMemo(() => {
    return lines.some(l => {
      if (!l.product) return false
      const available = stockMap[srcId]?.[l.product.sku] ?? l.product.stock
      return l.qty > available
    })
  }, [lines, stockMap, srcId])

  const searchInputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const qtyInputRefs    = useRef<Record<string, HTMLInputElement | null>>({})

  function patchLine(id: string, patch: Partial<TransferLine>) {
    setLines(prev => prev.map(l => l.id === id ? { ...l, ...patch } : l))
  }

  function loadTemplate() {
    const newLines: TransferLine[] = dest.template.map(t => {
      const prod = liveProducts.find(p => p.sku === t.sku) ?? null
      return {
        id: Math.random().toString(36).slice(2),
        product: prod, qty: t.qty,
        searchText: prod ? `${prod.sku} — ${prod.name}` : '',
        showDropdown: false,
      }
    })
    newLines.push(emptyLine())
    setLines(newLines)
  }

  function selectProduct(lineId: string, prod: ProductItem) {
    patchLine(lineId, {
      product: prod,
      searchText: `${prod.sku} — ${prod.name}`,
      showDropdown: false,
      qty: 1,
    })
    setTimeout(() => {
      const el = qtyInputRefs.current[lineId]
      if (el) { el.focus(); el.select() }
    }, 50)
  }

  function afterQty(lineId: string) {
    const idx = lines.findIndex(l => l.id === lineId)
    if (idx === lines.length - 1) {
      const nl = emptyLine()
      setLines(prev => [...prev, nl])
      setTimeout(() => searchInputRefs.current[nl.id]?.focus(), 50)
    } else {
      const next = lines[idx + 1]
      searchInputRefs.current[next.id]?.focus()
    }
  }

  function removeLine(id: string) {
    setLines(prev => {
      const f = prev.filter(l => l.id !== id)
      return f.length ? f : [emptyLine()]
    })
  }

  function getMatches(text: string): ProductItem[] {
    const q = text.trim().toLowerCase()
    if (!q) return liveProducts.slice(0, 8)

    const skuStart = liveProducts.filter(p => p.sku.startsWith(q))
    const skuAny   = liveProducts.filter(p => p.sku.includes(q) && !p.sku.startsWith(q))
    const nameAny  = liveProducts.filter(p => p.name.toLowerCase().includes(q) && !p.sku.includes(q))

    return [...skuStart, ...skuAny, ...nameAny].slice(0, 8)
  }

  async function handleBook(e: React.FormEvent) {
    e.preventDefault()
    if (hasStockExceeded) {
      setMsg('Fehler: Eine oder mehrere Mengen überschreiten den verfügbaren Lagerbestand!')
      setStatus('error')
      return
    }
    const valid = lines.filter(l => l.product && l.qty > 0)
    if (!valid.length) { setMsg('Mindestens ein Produkt mit Menge angeben.'); setStatus('error'); return }
    if (srcId === destId) { setMsg('Quelle und Ziel dürfen nicht gleich sein.'); setStatus('error'); return }

    setStatus('loading')

    // REAL STOCK MUTATION
    const itemsToTransfer = valid.map(l => ({
      sku: l.product!.sku,
      name: l.product!.name,
      qty: l.qty,
    }))

    const record = executeStockTransfer(
      srcId,
      src.label.replace(/^[🏭🚚]\s*/, ''),
      destId,
      dest.label.replace(/^[🏭🚚]\s*/, ''),
      itemsToTransfer,
      notes
    )

    setStatus('success')
    setMsg(`✓ Umlagerung ${record.transfer_number} erfolgreich gebucht! Bestände wurden in Echtzeit aktualisiert.`)

    setTimeout(() => {
      setStatus('idle')
      setMsg('')
      setLines([emptyLine()])
      setNotes('')
    }, 2500)
  }

  const srcOptions  = DESTINATIONS.filter(d => d.id !== destId)
  const destOptions = DESTINATIONS.filter(d => d.id !== srcId)

  return (
    <div className="space-y-6">
      <form onSubmit={handleBook} className="space-y-0">
        <div className="bg-surface-900/40 rounded-xl border border-surface-700/60">

          {/* Von / Nach */}
          <div className="p-4 border-b border-surface-700/50 grid sm:grid-cols-2 gap-4 bg-surface-950/60 rounded-t-xl">
            <div>
              <label className="text-[11px] font-bold text-surface-400 uppercase tracking-widest block mb-1.5">🏭 Von (Quelle)</label>
              <select value={srcId} onChange={e => setSrcId(e.target.value)} className="input bg-surface-900 border-surface-700 text-surface-100 py-2 w-full font-semibold">
                {srcOptions.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold text-surface-400 uppercase tracking-widest block mb-1.5">🚚 Nach (Ziel)</label>
              <select value={destId} onChange={e => setDestId(e.target.value)} className="input bg-surface-900 border-surface-700 text-surface-100 py-2 w-full font-semibold">
                {destOptions.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
              </select>
            </div>
          </div>

          {/* Vorlage-Banner */}
          {dest.template.length > 0 && (
            <div className="px-4 py-2.5 bg-brand-950/40 border-b border-brand-900/40 flex items-center justify-between gap-3 flex-wrap">
              <p className="text-xs text-brand-300">
                <Zap className="w-3.5 h-3.5 inline mr-1 text-brand-400" />
                Standard-Beladung für <strong>{dest.label.replace('🚚 ', '')}</strong> verfügbar
              </p>
              <button type="button" onClick={loadTemplate}
                className="text-xs font-bold text-brand-300 bg-brand-900/60 border border-brand-700/50 px-3 py-1.5 rounded-lg hover:bg-brand-800/60 transition-colors flex items-center gap-1.5">
                <BookmarkCheck className="w-3.5 h-3.5" /> Vorlage laden
              </button>
            </div>
          )}

          {/* Tabelle */}
          <div className="p-3">
            <div className="grid grid-cols-[32px_1fr_210px_32px] gap-2 px-2 pb-1.5 text-[10px] font-bold text-surface-500 uppercase tracking-widest border-b border-surface-800/60 mb-1">
              <span>#</span>
              <span>Artikel-Nr. oder Produktname</span>
              <span className="text-right">Bestand (Quelle) & Umbuch-Menge</span>
              <span />
            </div>

            <div className="space-y-1.5">
              {lines.map((line, idx) => (
                <LineRow
                  key={line.id}
                  line={line}
                  idx={idx}
                  srcId={srcId}
                  stockMap={stockMap}
                  registerSearchInput={el => { searchInputRefs.current[line.id] = el }}
                  registerQtyInput={el => { qtyInputRefs.current[line.id] = el }}
                  onSearchChange={text => patchLine(line.id, { searchText: text, showDropdown: true, product: null })}
                  onSelectProduct={prod => selectProduct(line.id, prod)}
                  onQtyChange={q => patchLine(line.id, { qty: q })}
                  onQtyEnter={() => afterQty(line.id)}
                  onRemove={() => removeLine(line.id)}
                  onDropdownOpen={() => patchLine(line.id, { showDropdown: true })}
                  onDropdownClose={() => patchLine(line.id, { showDropdown: false })}
                  getMatches={getMatches}
                />
              ))}
            </div>

            <button type="button"
              onClick={() => {
                const nl = emptyLine()
                setLines(prev => [...prev, nl])
                setTimeout(() => searchInputRefs.current[nl.id]?.focus(), 50)
              }}
              className="mt-2.5 flex items-center gap-1.5 text-xs text-surface-400 hover:text-brand-400 px-2 py-1.5 transition-colors font-medium">
              <Plus className="w-3.5 h-3.5" /> Zeile hinzufügen
            </button>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-surface-700/50 bg-surface-950/40 rounded-b-xl space-y-3">
            <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Hinweis (optional) — z.B. Morgen-Beladung Tour Nord"
              className="input bg-surface-900 border-surface-700 text-surface-100 py-2 w-full text-sm" />

            {message && (
              <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
                status === 'success'
                  ? 'bg-success-900/40 border border-success-500/30 text-success-300'
                  : 'bg-danger-900/40 border border-danger-500/30 text-danger-300'
              }`}>
                {status === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                {message}
              </div>
            )}

            <div className="flex items-center justify-between gap-4">
              <p className="text-xs text-surface-400">
                {totalFull > 0
                  ? <><span className="text-surface-100 font-bold">{totalFull} Produkte</span> bereit zur Umbuchung</>
                  : 'Noch keine Produkte eingetragen'
                }
              </p>
              <button type="submit" disabled={status === 'loading' || totalFull === 0 || hasStockExceeded}
                className="btn-primary flex items-center gap-2 px-6 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed">
                {status === 'loading'
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Buche…</>
                  : <><ArrowLeftRight className="w-4 h-4" /> Jetzt umlagern ({totalFull} Pos.)</>}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* HISTORIE DER LETZTEN UMLAGERUNGEN */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-surface-700/50 flex items-center justify-between">
          <h2 className="font-semibold text-surface-100 flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4 text-brand-400" />
            Protokoll der gebuchten Umlagerungen
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Beleg-Nr.</th>
                <th>Von (Quelle)</th>
                <th>Nach (Ziel)</th>
                <th>Positionen</th>
                <th>Hinweis</th>
                <th>Datum</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map((t) => (
                <tr key={t.id}>
                  <td>
                    <span className="font-mono text-xs font-semibold text-brand-400">
                      {t.transfer_number}
                    </span>
                  </td>
                  <td>
                    <span className="text-surface-200 text-sm flex items-center gap-1.5">
                      <Warehouse className="w-3.5 h-3.5 text-brand-400" />
                      {t.from_location_name}
                    </span>
                  </td>
                  <td>
                    <span className="text-surface-200 text-sm flex items-center gap-1.5">
                      <Warehouse className="w-3.5 h-3.5 text-success-500" />
                      {t.to_location_name}
                    </span>
                  </td>
                  <td>
                    <span className="text-xs text-surface-300 font-mono">
                      {t.items_count} Pos.
                    </span>
                  </td>
                  <td>
                    <span className="text-xs text-surface-400">{t.notes}</span>
                  </td>
                  <td>
                    <span className="text-xs text-surface-400">
                      {new Date(t.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr
                    </span>
                  </td>
                  <td>
                    <span className="badge-success inline-flex items-center gap-1">
                      <Check className="w-3 h-3" /> Gebucht
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// ZEILEN-KOMPONENTE
// ──────────────────────────────────────────────────────────────────────────────
interface LineRowProps {
  line: TransferLine
  idx: number
  srcId: string
  stockMap: Record<string, Record<string, number>>
  registerSearchInput: (el: HTMLInputElement | null) => void
  registerQtyInput: (el: HTMLInputElement | null) => void
  onSearchChange: (text: string) => void
  onSelectProduct: (prod: ProductItem) => void
  onQtyChange: (q: number) => void
  onQtyEnter: () => void
  onRemove: () => void
  onDropdownOpen: () => void
  onDropdownClose: () => void
  getMatches: (text: string) => ProductItem[]
}

function LineRow({
  line, idx, srcId, stockMap,
  registerSearchInput, registerQtyInput,
  onSearchChange, onSelectProduct, onQtyChange, onQtyEnter, onRemove,
  onDropdownOpen, onDropdownClose, getMatches
}: LineRowProps) {
  const [highlighted, setHighlighted] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const matches = useMemo(() => getMatches(line.searchText), [line.searchText, getMatches])

  const availableStock = useMemo(() => {
    if (!line.product) return 0
    return stockMap[srcId]?.[line.product.sku] ?? line.product.stock
  }, [line.product, stockMap, srcId])

  const isOverStock = line.product ? line.qty > availableStock : false

  useEffect(() => { setHighlighted(0) }, [line.searchText])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onDropdownClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onDropdownClose])

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!line.showDropdown || line.product) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlighted(h => Math.min(h + 1, matches.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlighted(h => Math.max(h - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (matches[highlighted]) {
        onSelectProduct(matches[highlighted])
      }
    } else if (e.key === 'Escape') {
      onDropdownClose()
    }
  }

  const showDrop = line.showDropdown && !line.product && matches.length > 0

  return (
    <div
      ref={containerRef}
      className={`grid grid-cols-[32px_1fr_210px_32px] gap-2 items-center px-2 py-1.5 rounded-lg border relative transition-all
        ${isOverStock
          ? 'bg-danger-950/40 border-danger-500/80 shadow-md shadow-danger-900/20'
          : line.product
            ? 'bg-surface-900/80 border-surface-700/70'
            : 'bg-surface-900/40 border-surface-800/60 hover:border-surface-700/60'
        }`}
    >
      {/* Index */}
      <span className={`text-center text-xs font-mono font-bold ${
        isOverStock ? 'text-danger-400' : line.product ? 'text-brand-400' : 'text-surface-600'
      }`}>
        {idx + 1}
      </span>

      {/* Suche */}
      <div className="relative flex items-center gap-1.5">
        {line.product && (
          <span className="text-[10px] font-mono bg-brand-900/80 text-brand-400 border border-brand-800/60 px-1.5 py-0.5 rounded shrink-0 font-bold">
            {line.product.sku}
          </span>
        )}
        <input
          ref={registerSearchInput}
          type="text"
          value={line.product ? line.product.name : line.searchText}
          onChange={e => { onSearchChange(e.target.value); setHighlighted(0) }}
          onFocus={() => { if (!line.product) onDropdownOpen() }}
          onKeyDown={handleKeyDown}
          placeholder={idx === 0 ? 'Art.-Nr. oder Name tippen…' : 'Artikel…'}
          autoComplete="off"
          spellCheck={false}
          className="bg-transparent text-surface-100 text-sm outline-none flex-1 min-w-0 placeholder:text-surface-600 caret-brand-400 font-medium"
        />
        {line.product && (
          <button type="button" onClick={() => onSearchChange('')}
            className="text-surface-500 hover:text-surface-300 p-0.5 shrink-0 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {/* DROPDOWN */}
        {showDrop && (
          <div className="absolute left-0 top-full mt-1.5 z-50 w-full min-w-[340px] max-w-[460px] bg-surface-900 border border-surface-700 rounded-xl shadow-2xl overflow-hidden animate-in">
            <ul className="max-h-56 overflow-y-auto divide-y divide-surface-800/40">
              {matches.map((p, i) => {
                const currentStock = stockMap[srcId]?.[p.sku] ?? p.stock
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => onSelectProduct(p)}
                      onMouseEnter={() => setHighlighted(i)}
                      className={`w-full text-left px-3 py-2.5 flex items-center gap-3 transition-colors ${
                        i === highlighted ? 'bg-brand-900/60 text-brand-300' : 'hover:bg-surface-800/60 text-surface-200'
                      }`}
                    >
                      <SkuHighlight sku={p.sku} query={line.searchText} />
                      <span className="text-sm flex-1 truncate font-medium">{p.name}</span>
                      
                      {/* Bestand Badge */}
                      <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-surface-800 text-emerald-400 border border-emerald-800/40 shrink-0">
                        Lager: {currentStock.toLocaleString('de-DE')} Stk.
                      </span>

                      {i === highlighted && (
                        <span className="text-[10px] text-brand-400 bg-brand-950 border border-brand-800 px-1.5 py-0.5 rounded font-mono shrink-0">
                          Enter ↵
                        </span>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
            <div className="px-3 py-1.5 border-t border-surface-800 bg-surface-950/80">
              <p className="text-[10px] text-surface-500">
                <kbd className="bg-surface-800 px-1 rounded text-surface-300">↑↓</kbd> navigieren ·{' '}
                <kbd className="bg-surface-800 px-1 rounded text-surface-300">Enter</kbd> wählen
              </p>
            </div>
          </div>
        )}
      </div>

      {/* LAGERBESTAND & MENGEN-EINGABE */}
      <div className="flex items-center justify-end gap-2">
        {line.product && (
          <div className="text-right shrink-0">
            <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded border block ${
              isOverStock
                ? 'bg-danger-950 text-danger-400 border-danger-800 animate-pulse'
                : 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60'
            }`}>
              Max: {availableStock.toLocaleString('de-DE')} Stk.
            </span>
          </div>
        )}

        <input
          ref={registerQtyInput}
          type="number"
          min="0"
          max={availableStock}
          step="1"
          value={line.qty || ''}
          onChange={e => onQtyChange(parseInt(e.target.value) || 0)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault()
              if (line.product && line.qty > 0 && !isOverStock) onQtyEnter()
            }
          }}
          placeholder="0"
          className={`border rounded-lg text-right text-sm font-bold tabular-nums px-2 py-1 outline-none w-24 transition-colors ${
            isOverStock
              ? 'bg-danger-900/50 border-danger-500 text-danger-200 focus:border-danger-400'
              : 'bg-surface-800/80 border-surface-700/60 text-surface-100 focus:border-brand-500/80'
          }`}
        />
      </div>

      {/* Löschen */}
      <button type="button" onClick={onRemove}
        className="flex items-center justify-center text-surface-600 hover:text-danger-400 p-1 rounded transition-colors">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

function SkuHighlight({ sku, query }: { sku: string; query: string }) {
  const q = query.trim().toLowerCase()
  const matchLen = sku.toLowerCase().startsWith(q) ? q.length : 0

  return (
    <span className="font-mono text-xs font-bold w-12 shrink-0">
      {matchLen > 0 ? (
        <>
          <span className="text-brand-300">{sku.slice(0, matchLen)}</span>
          <span className="text-surface-500">{sku.slice(matchLen)}</span>
        </>
      ) : (
        <span className="text-brand-400">{sku}</span>
      )}
    </span>
  )
}

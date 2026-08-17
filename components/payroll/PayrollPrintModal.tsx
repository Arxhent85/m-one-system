'use client'

import { useState, useMemo } from 'react'
import { X, Printer, User, Calendar, Package, ArrowUpDown, ArrowUp, ArrowDown, Columns, LayoutList } from 'lucide-react'
import { formatCurrency, formatNumber } from '@/lib/utils/currency'
import { formatMonthKey } from '@/lib/commission'

interface PayrollPrintModalProps {
  driverName: string
  monthKey: string
  totalCommission: number
  totalPieces: number
  totalSalesVolume: number
  totalOrders: number
  itemBreakdown: {
    sku: string
    name: string
    qty: number
    rate: number
    commission: number
  }[]
  onClose: () => void
}

export default function PayrollPrintModal({
  driverName,
  monthKey,
  totalCommission,
  totalPieces,
  totalSalesVolume,
  totalOrders,
  itemBreakdown,
  onClose,
}: PayrollPrintModalProps) {
  const [sortKey, setSortKey] = useState<'sku' | 'name' | 'qty' | 'rate' | 'commission'>('sku')
  const [sortAsc, setSortAsc] = useState<boolean>(true)
  const [layoutMode, setLayoutMode] = useState<'compact-2col' | 'single-col'>('compact-2col')

  function handlePrint() {
    window.print()
  }

  function handleSort(key: 'sku' | 'name' | 'qty' | 'rate' | 'commission') {
    if (sortKey === key) {
      setSortAsc((prev) => !prev)
    } else {
      setSortKey(key)
      setSortAsc(key === 'sku' || key === 'name')
    }
  }

  const sortedItems = useMemo(() => {
    const list = [...itemBreakdown]
    list.sort((a, b) => {
      if (sortKey === 'sku') {
        return sortAsc
          ? a.sku.localeCompare(b.sku, undefined, { numeric: true })
          : b.sku.localeCompare(a.sku, undefined, { numeric: true })
      }
      if (sortKey === 'name') {
        return sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
      }
      if (sortKey === 'qty') {
        return sortAsc ? a.qty - b.qty : b.qty - a.qty
      }
      if (sortKey === 'rate') {
        return sortAsc ? a.rate - b.rate : b.rate - a.rate
      }
      if (sortKey === 'commission') {
        return sortAsc ? a.commission - b.commission : b.commission - a.commission
      }
      return 0
    })
    return list
  }, [itemBreakdown, sortKey, sortAsc])

  // Split into 2 columns for compact 1-page printing
  const { leftItems, rightItems } = useMemo(() => {
    const mid = Math.ceil(sortedItems.length / 2)
    return {
      leftItems: sortedItems.slice(0, mid),
      rightItems: sortedItems.slice(mid),
    }
  }, [sortedItems])

  const periodLabel = monthKey === 'all' ? 'Gesamtes Geschäftsjahr 2026' : formatMonthKey(monthKey)

  const depotLabel =
    driverName === 'Mensuri'
      ? '1 (Depo Mensuri)'
      : driverName === 'Qerimi'
      ? '2 (Depo Qerimi)'
      : driverName === 'Miloti'
      ? '3 (Depo Miloti)'
      : 'Hauptlager (M-ONE)'

  const driverSeries =
    driverName === 'Mensuri'
      ? 'Kd.-Nr. 2xxxx'
      : driverName === 'Qerimi'
      ? 'Kd.-Nr. 1xxxx'
      : driverName === 'Miloti'
      ? 'Kd.-Nr. 3xxxx'
      : 'B2B / Zentrale'

  const renderTableHeader = () => (
    <thead className="bg-surface-800 print:bg-gray-100 text-surface-300 print:text-gray-900 uppercase text-[9.5px] print:text-[8.5px] font-bold tracking-wider select-none border-b border-surface-700 print:border-gray-400">
      <tr>
        <th
          onClick={() => handleSort('sku')}
          className="py-1 px-1.5 cursor-pointer hover:bg-surface-700 transition-colors w-[18%]"
        >
          <div className="flex items-center gap-0.5">
            <span>SKU</span>
            {sortKey === 'sku' && (
              sortAsc ? <ArrowUp className="w-2.5 h-2.5 text-brand-400" /> : <ArrowDown className="w-2.5 h-2.5 text-brand-400" />
            )}
          </div>
        </th>
        <th
          onClick={() => handleSort('name')}
          className="py-1 px-1.5 cursor-pointer hover:bg-surface-700 transition-colors w-[42%]"
        >
          <div className="flex items-center gap-0.5">
            <span>Artikelbezeichnung</span>
            {sortKey === 'name' && (
              sortAsc ? <ArrowUp className="w-2.5 h-2.5 text-brand-400" /> : <ArrowDown className="w-2.5 h-2.5 text-brand-400" />
            )}
          </div>
        </th>
        <th
          onClick={() => handleSort('qty')}
          className="py-1 px-1 text-right cursor-pointer hover:bg-surface-700 transition-colors w-[13%]"
        >
          <div className="flex items-center justify-end gap-0.5">
            <span>Menge</span>
            {sortKey === 'qty' && (
              sortAsc ? <ArrowUp className="w-2.5 h-2.5 text-brand-400" /> : <ArrowDown className="w-2.5 h-2.5 text-brand-400" />
            )}
          </div>
        </th>
        <th
          onClick={() => handleSort('rate')}
          className="py-1 px-1 text-right cursor-pointer hover:bg-surface-700 transition-colors w-[12%]"
        >
          <div className="flex items-center justify-end gap-0.5">
            <span>Satz</span>
            {sortKey === 'rate' && (
              sortAsc ? <ArrowUp className="w-2.5 h-2.5 text-brand-400" /> : <ArrowDown className="w-2.5 h-2.5 text-brand-400" />
            )}
          </div>
        </th>
        <th
          onClick={() => handleSort('commission')}
          className="py-1 px-1.5 text-right font-bold cursor-pointer hover:bg-surface-700 transition-colors w-[15%]"
        >
          <div className="flex items-center justify-end gap-0.5">
            <span>Gesamt</span>
            {sortKey === 'commission' && (
              sortAsc ? <ArrowUp className="w-2.5 h-2.5 text-brand-400" /> : <ArrowDown className="w-2.5 h-2.5 text-brand-400" />
            )}
          </div>
        </th>
      </tr>
    </thead>
  )

  const renderTableRow = (it: typeof sortedItems[0], idx: number) => (
    <tr
      key={it.sku}
      className={`hover:bg-surface-800/40 print:hover:bg-transparent ${
        idx % 2 === 1 ? 'bg-surface-950/30 print:bg-gray-50' : 'bg-transparent'
      }`}
    >
      <td className="py-0.5 px-1.5 font-mono font-bold text-brand-300 print:text-black text-[10.5px] print:text-[9.5px] whitespace-nowrap">
        {it.sku}
      </td>
      <td
        className="py-0.5 px-1.5 text-surface-200 print:text-black font-medium text-[10.5px] print:text-[9.5px] truncate max-w-[140px] print:max-w-[170px]"
        title={it.name}
      >
        {it.name}
      </td>
      <td className="py-0.5 px-1 text-right font-medium text-surface-100 print:text-black text-[10.5px] print:text-[9.5px] whitespace-nowrap">
        {formatNumber(it.qty)}
      </td>
      <td className="py-0.5 px-1 text-right font-mono text-surface-400 print:text-gray-700 text-[10px] print:text-[9px] whitespace-nowrap">
        {it.rate.toFixed(2)} €
      </td>
      <td className="py-0.5 px-1.5 text-right font-mono font-bold text-emerald-400 print:text-black text-[10.5px] print:text-[9.5px] whitespace-nowrap">
        {formatCurrency(it.commission)}
      </td>
    </tr>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 print:p-0 print:bg-white print:static print:inset-auto">
      
      {/* Print styles injected for 100% 1-page A4 print fit */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 6mm 8mm 6mm 8mm;
          }
          html, body {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print, header, nav, aside {
            display: none !important;
          }
          .print-modal-container {
            position: static !important;
            max-width: 100% !important;
            max-height: none !important;
            width: 100% !important;
            overflow: visible !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: #ffffff !important;
          }
        }
      `}</style>

      <div className="print-modal-container bg-surface-900 border border-surface-700/80 rounded-2xl w-full max-w-5xl max-h-[95vh] flex flex-col overflow-hidden shadow-2xl print:border-none print:shadow-none print:bg-white print:text-black">
        
        {/* Modal Top Control Bar (Hidden on Print) */}
        <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-surface-700/80 shrink-0 print:hidden bg-surface-950/80">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-900/60 border border-brand-500/30 flex items-center justify-center text-brand-400">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-surface-50 flex items-center gap-2">
                Lohnabrechnung & Provisionsbeleg
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-semibold">
                  {sortedItems.length} Positionen (1-Seiten-Kompaktansicht)
                </span>
              </h2>
              <p className="text-[11px] text-surface-400">
                Fahrer: <strong className="text-surface-200">{driverName}</strong> · {periodLabel}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-surface-800 p-0.5 rounded-lg border border-surface-700 text-xs">
              <button
                type="button"
                onClick={() => setLayoutMode('compact-2col')}
                className={`px-2 py-1 rounded flex items-center gap-1 font-medium transition-all ${
                  layoutMode === 'compact-2col'
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-surface-400 hover:text-surface-200'
                }`}
                title="Kompakte 2-Spalten-Ansicht (Passt auf 1 Seite)"
              >
                <Columns className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">2 Spalten (1 Seite)</span>
              </button>
              <button
                type="button"
                onClick={() => setLayoutMode('single-col')}
                className={`px-2 py-1 rounded flex items-center gap-1 font-medium transition-all ${
                  layoutMode === 'single-col'
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-surface-400 hover:text-surface-200'
                }`}
                title="1-Spaltige Standardansicht"
              >
                <LayoutList className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">1 Spalte</span>
              </button>
            </div>

            <button
              onClick={handlePrint}
              className="btn-primary py-1.5 px-3 text-xs font-semibold flex items-center gap-1.5 shadow-glow"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Drucken (A4)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-surface-400 hover:text-surface-100 hover:bg-surface-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Document Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 print:p-0 print:overflow-visible space-y-2.5 print:space-y-2 text-surface-100 print:text-black">
          
          {/* Header */}
          <div className="flex justify-between items-start border-b border-surface-700/60 pb-2 print:border-gray-400 print:pb-1.5">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl print:text-lg font-black text-white print:text-black tracking-tight">
                  M ONE SH.P.K.
                </h1>
                <span className="text-[10px] print:text-[9px] px-1.5 py-0.5 rounded bg-surface-800 text-surface-300 print:bg-gray-200 print:text-gray-800 font-semibold uppercase">
                  Warenwirtschaft & Großhandel
                </span>
              </div>
              <p className="text-[11px] print:text-[9.5px] text-surface-400 print:text-gray-600 font-medium">
                Fahrzeugdepot {depotLabel} · Lohn- & Provisionsabrechnung
              </p>
            </div>
            
            <div className="text-right">
              <span className="inline-block px-2 py-0.5 bg-brand-900/60 text-brand-300 border border-brand-500/40 rounded text-[10.5px] print:text-[9.5px] font-bold uppercase tracking-wider print:bg-gray-100 print:text-black print:border-gray-500">
                Lohnabrechnung
              </span>
              <p className="text-[11px] print:text-[9.5px] text-surface-300 print:text-gray-700 mt-0.5">
                Abrechnungszeitraum: <strong className="text-white print:text-black">{periodLabel}</strong>
              </p>
              <p className="text-[10px] print:text-[8.5px] text-surface-500 print:text-gray-500">
                Erstellt am: {new Date().toLocaleDateString('de-DE')}
              </p>
            </div>
          </div>

          {/* 4 Compact KPI Cards */}
          <div className="grid grid-cols-4 gap-2 print:gap-1.5">
            <div className="p-2 rounded-lg bg-surface-800/70 border border-surface-700/60 print:bg-gray-50 print:border-gray-300">
              <p className="text-[10px] print:text-[8.5px] text-surface-400 print:text-gray-600 font-medium uppercase">Mitarbeiter / Fahrer</p>
              <p className="text-sm print:text-xs font-bold text-white print:text-black mt-0.5 flex items-center gap-1">
                <User className="w-3 h-3 text-brand-400 print:hidden" />
                {driverName}
              </p>
              <p className="text-[9.5px] print:text-[8px] text-surface-400 print:text-gray-600">{driverSeries}</p>
            </div>

            <div className="p-2 rounded-lg bg-surface-800/70 border border-surface-700/60 print:bg-gray-50 print:border-gray-300">
              <p className="text-[10px] print:text-[8.5px] text-surface-400 print:text-gray-600 font-medium uppercase">Verkaufte Stückzahl</p>
              <p className="text-sm print:text-xs font-bold text-white print:text-black mt-0.5">
                {formatNumber(totalPieces)} Stk.
              </p>
              <p className="text-[9.5px] print:text-[8px] text-surface-400 print:text-gray-600">in {formatNumber(totalOrders)} Fakturen</p>
            </div>

            <div className="p-2 rounded-lg bg-surface-800/70 border border-surface-700/60 print:bg-gray-50 print:border-gray-300">
              <p className="text-[10px] print:text-[8.5px] text-surface-400 print:text-gray-600 font-medium uppercase">Verkaufsvolumen Brutto</p>
              <p className="text-sm print:text-xs font-bold text-white print:text-black mt-0.5">
                {formatCurrency(totalSalesVolume)}
              </p>
              <p className="text-[9.5px] print:text-[8px] text-surface-400 print:text-gray-600">Gesamteinnahmen</p>
            </div>

            <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/40 print:bg-gray-100 print:border-gray-500">
              <p className="text-[10px] print:text-[8.5px] text-emerald-300 print:text-black font-bold uppercase">Auszahlungsbetrag</p>
              <p className="text-base print:text-sm font-black text-emerald-400 print:text-black mt-0.5">
                {formatCurrency(totalCommission)}
              </p>
              <p className="text-[9.5px] print:text-[8px] text-emerald-300/80 print:text-gray-600 font-semibold">Netto Stück-Provision</p>
            </div>
          </div>

          {/* Table Section */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs print:text-[10px] font-bold text-surface-200 print:text-black uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-brand-400 print:hidden" />
                Provisionsaufschlüsselung nach Artikeln ({sortedItems.length} Positionen)
              </h3>
              <span className="text-[10px] text-surface-500 print:hidden">
                Kompakte 2-Spalten-Tabelle für vollständigen 1-Seiten-Druck
              </span>
            </div>

            {/* DUAL-COLUMN LAYOUT (Default & Print Mode) */}
            {layoutMode === 'compact-2col' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-2.5 print:gap-2">
                
                {/* Column 1 Table (Items 1..N/2) */}
                <div className="rounded-lg border border-surface-700/60 print:border-gray-400 overflow-hidden">
                  <table className="w-full text-left">
                    {renderTableHeader()}
                    <tbody className="divide-y divide-surface-700/30 print:divide-gray-200">
                      {leftItems.map((it, idx) => renderTableRow(it, idx))}
                      {leftItems.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-4 text-center text-surface-500 print:text-gray-500 text-xs">
                            Keine Daten vorhanden.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Column 2 Table (Items N/2..N) */}
                <div className="rounded-lg border border-surface-700/60 print:border-gray-400 overflow-hidden">
                  <table className="w-full text-left">
                    {renderTableHeader()}
                    <tbody className="divide-y divide-surface-700/30 print:divide-gray-200">
                      {rightItems.map((it, idx) => renderTableRow(it, idx))}
                      {rightItems.length === 0 && leftItems.length > 0 && (
                        <tr>
                          <td colSpan={5} className="py-2 text-center text-surface-500 print:text-gray-500 text-[10px]">
                            — Keine weiteren Positionen —
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

              </div>
            ) : (
              /* SINGLE COLUMN LAYOUT */
              <div className="rounded-lg border border-surface-700/60 print:border-gray-400 overflow-hidden">
                <table className="w-full text-left">
                  {renderTableHeader()}
                  <tbody className="divide-y divide-surface-700/30 print:divide-gray-200">
                    {sortedItems.map((it, idx) => renderTableRow(it, idx))}
                    {sortedItems.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-4 text-center text-surface-500 print:text-gray-500 text-xs">
                          Keine Provisionsdaten vorhanden.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Bottom Summary Bar */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-surface-800/90 print:bg-gray-100 border border-surface-700 print:border-gray-400 text-xs print:text-[10px]">
              <div className="flex items-center gap-3">
                <span className="font-bold uppercase text-surface-300 print:text-gray-800">
                  Gesamtsumme ({sortedItems.length} Artikel)
                </span>
                <span className="text-surface-400 print:text-gray-600 font-medium">
                  Menge: <strong className="text-surface-100 print:text-black">{formatNumber(totalPieces)} Stk.</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-surface-400 print:text-gray-600">Netto-Provision:</span>
                <span className="font-mono font-black text-sm print:text-xs text-emerald-400 print:text-black">
                  {formatCurrency(totalCommission)}
                </span>
              </div>
            </div>
          </div>

          {/* Compact Signatures Section */}
          <div className="grid grid-cols-2 gap-8 pt-3 pb-1 border-t border-surface-700/50 print:border-gray-400 print:pt-2">
            <div className="space-y-6 print:space-y-5">
              <p className="text-[10.5px] print:text-[9px] text-surface-400 print:text-gray-600">
                Abrechnung geprüft & freigegeben durch Geschäftsleitung:
              </p>
              <div className="border-t border-dashed border-surface-600 print:border-gray-500 pt-1">
                <p className="text-[10px] print:text-[8.5px] font-semibold text-surface-300 print:text-black">
                  Datum, Unterschrift Verwaltung / Büro (M-ONE)
                </p>
              </div>
            </div>

            <div className="space-y-6 print:space-y-5">
              <p className="text-[10.5px] print:text-[9px] text-surface-400 print:text-gray-600">
                Betrag dankend erhalten / Empfangsbestätigung:
              </p>
              <div className="border-t border-dashed border-surface-600 print:border-gray-500 pt-1">
                <p className="text-[10px] print:text-[8.5px] font-semibold text-surface-300 print:text-black">
                  Datum, Unterschrift Fahrer ({driverName})
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

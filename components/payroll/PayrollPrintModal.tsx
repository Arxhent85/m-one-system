'use client'

import { useState, useMemo } from 'react'
import { X, Printer, User, Calendar, Package, ArrowUp, ArrowDown, Columns, LayoutList, CheckCircle2 } from 'lucide-react'
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

  // Split into 2 parallel columns for compact 1-page printing
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
      : 'Hauptlager (M-ONE)'

  const driverSeries =
    driverName === 'Mensuri'
      ? 'Kd.-Nr. 2xxxx'
      : driverName === 'Qerimi'
      ? 'Kd.-Nr. 1xxxx'
      : 'B2B / Zentrale'

  const renderTableHeader = () => (
    <thead className="bg-surface-800 text-surface-300 uppercase text-[9px] font-bold tracking-wider select-none border-b border-surface-700">
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
            <span>Artikel</span>
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
      className={`hover:bg-surface-800/40 ${
        idx % 2 === 1 ? 'bg-surface-950/30' : 'bg-transparent'
      }`}
    >
      <td className="py-0.5 px-1.5 font-mono font-bold text-brand-300 text-[10px] whitespace-nowrap">
        {it.sku}
      </td>
      <td
        className="py-0.5 px-1.5 text-surface-200 font-medium text-[10px] truncate max-w-[135px]"
        title={it.name}
      >
        {it.name}
      </td>
      <td className="py-0.5 px-1 text-right font-medium text-surface-100 text-[10px] whitespace-nowrap">
        {formatNumber(it.qty)}
      </td>
      <td className="py-0.5 px-1 text-right font-mono text-surface-400 text-[9.5px] whitespace-nowrap">
        {it.rate.toFixed(2)} €
      </td>
      <td className="py-0.5 px-1.5 text-right font-mono font-bold text-emerald-400 text-[10px] whitespace-nowrap">
        {formatCurrency(it.commission)}
      </td>
    </tr>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 print:p-0 print:bg-white print:static print:inset-auto print:block">
      
      {/* Universal Print Stylesheet to guarantee 100% 1-page A4 paper fit */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: 6mm 7mm 6mm 7mm;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html, body {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
          }
          /* Hide non-print UI */
          .print-hide,
          header,
          nav,
          aside {
            display: none !important;
          }
          /* Print document container */
          .payroll-print-wrapper {
            position: static !important;
            width: 100% !important;
            max-width: 100% !important;
            max-height: none !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            background: #ffffff !important;
            color: #000000 !important;
            overflow: visible !important;
          }
          /* Force Dual-Column Table Grid in Print */
          .print-dual-grid {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 8px !important;
            width: 100% !important;
          }
          .print-table {
            width: 100% !important;
            border-collapse: collapse !important;
            font-size: 8pt !important;
            line-height: 1.15 !important;
          }
          .print-table th {
            background-color: #f1f5f9 !important;
            color: #0f172a !important;
            font-weight: 700 !important;
            padding: 2.5px 3.5px !important;
            border: 1px solid #94a3b8 !important;
            font-size: 7.5pt !important;
            text-transform: uppercase !important;
          }
          .print-table td {
            padding: 1.5px 3.5px !important;
            border: 1px solid #cbd5e1 !important;
            color: #0f172a !important;
            font-size: 8pt !important;
          }
          .print-table tr:nth-child(even) td {
            background-color: #f8fafc !important;
          }
          /* KPI Cards in Print */
          .print-kpi-grid {
            display: grid !important;
            grid-template-columns: repeat(4, 1fr) !important;
            gap: 6px !important;
            margin-bottom: 6px !important;
          }
          .print-kpi-card {
            border: 1px solid #cbd5e1 !important;
            background: #f8fafc !important;
            padding: 4px 6px !important;
            border-radius: 4px !important;
            color: #0f172a !important;
          }
          .print-kpi-card-highlight {
            border: 1.5px solid #059669 !important;
            background: #f0fdf4 !important;
            padding: 4px 6px !important;
            border-radius: 4px !important;
            color: #064e3b !important;
          }
          .print-header {
            display: flex !important;
            justify-content: space-between !important;
            align-items: flex-start !important;
            border-bottom: 1.5px solid #0f172a !important;
            padding-bottom: 4px !important;
            margin-bottom: 6px !important;
          }
          .print-signatures {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 20px !important;
            margin-top: 8px !important;
            padding-top: 6px !important;
            border-top: 1px solid #cbd5e1 !important;
          }
          .print-summary-bar {
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            padding: 3px 6px !important;
            background-color: #f1f5f9 !important;
            border: 1px solid #94a3b8 !important;
            border-radius: 4px !important;
            margin-top: 5px !important;
            font-size: 8pt !important;
            font-weight: bold !important;
            color: #0f172a !important;
          }
        }
      ` }} />

      <div className="payroll-print-wrapper bg-surface-900 border border-surface-700/80 rounded-2xl w-full max-w-5xl max-h-[95vh] flex flex-col overflow-hidden shadow-2xl">
        
        {/* Modal Top Control Bar (Hidden on Print) */}
        <div className="print-hide flex items-center justify-between p-3.5 sm:p-4 border-b border-surface-700/80 shrink-0 bg-surface-950/90">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-900/60 border border-brand-500/30 flex items-center justify-center text-brand-400">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-surface-50 flex items-center gap-2">
                Lohnabrechnung & Provisionsbeleg
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-semibold">
                  {sortedItems.length} Positionen (1-Seiten-Kompaktdruck)
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
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2.5 text-surface-100 print:p-0 print:overflow-visible print:space-y-0">
          
          {/* Header */}
          <div className="print-header flex justify-between items-start border-b border-surface-700/60 pb-2">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-white tracking-tight" style={{ color: '#000000' }}>
                  M ONE SH.P.K.
                </h1>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-800 text-surface-300 font-semibold uppercase">
                  Warenwirtschaft & Großhandel
                </span>
              </div>
              <p className="text-[11px] text-surface-400 font-medium" style={{ color: '#475569' }}>
                Fahrzeugdepot {depotLabel} · Lohn- & Provisionsabrechnung
              </p>
            </div>
            
            <div className="text-right">
              <span className="inline-block px-2 py-0.5 bg-brand-900/60 text-brand-300 border border-brand-500/40 rounded text-[10px] font-bold uppercase tracking-wider">
                Lohnabrechnung
              </span>
              <p className="text-[11px] text-surface-300 mt-0.5" style={{ color: '#1e293b' }}>
                Abrechnungszeitraum: <strong style={{ color: '#000000' }}>{periodLabel}</strong>
              </p>
              <p className="text-[10px] text-surface-500" style={{ color: '#64748b' }}>
                Erstellt am: {new Date().toLocaleDateString('de-DE')}
              </p>
            </div>
          </div>

          {/* 4 Compact KPI Cards */}
          <div className="print-kpi-grid grid grid-cols-4 gap-2">
            <div className="print-kpi-card p-2 rounded-lg bg-surface-800/70 border border-surface-700/60">
              <p className="text-[9.5px] text-surface-400 font-medium uppercase" style={{ color: '#64748b' }}>Mitarbeiter / Fahrer</p>
              <p className="text-sm font-bold text-white mt-0.5 flex items-center gap-1" style={{ color: '#000000' }}>
                <User className="w-3 h-3 text-brand-400 print-hide" />
                {driverName}
              </p>
              <p className="text-[9px] text-surface-400" style={{ color: '#64748b' }}>{driverSeries}</p>
            </div>

            <div className="print-kpi-card p-2 rounded-lg bg-surface-800/70 border border-surface-700/60">
              <p className="text-[9.5px] text-surface-400 font-medium uppercase" style={{ color: '#64748b' }}>Verkaufte Stückzahl</p>
              <p className="text-sm font-bold text-white mt-0.5" style={{ color: '#000000' }}>
                {formatNumber(totalPieces)} Stk.
              </p>
              <p className="text-[9px] text-surface-400" style={{ color: '#64748b' }}>in {formatNumber(totalOrders)} Fakturen</p>
            </div>

            <div className="print-kpi-card p-2 rounded-lg bg-surface-800/70 border border-surface-700/60">
              <p className="text-[9.5px] text-surface-400 font-medium uppercase" style={{ color: '#64748b' }}>Verkaufsvolumen Brutto</p>
              <p className="text-sm font-bold text-white mt-0.5" style={{ color: '#000000' }}>
                {formatCurrency(totalSalesVolume)}
              </p>
              <p className="text-[9px] text-surface-400" style={{ color: '#64748b' }}>Gesamteinnahmen</p>
            </div>

            <div className="print-kpi-card-highlight p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/40">
              <p className="text-[9.5px] text-emerald-300 font-bold uppercase" style={{ color: '#065f46' }}>Auszahlungsbetrag</p>
              <p className="text-base font-black text-emerald-400 mt-0.5" style={{ color: '#047857' }}>
                {formatCurrency(totalCommission)}
              </p>
              <p className="text-[9px] text-emerald-300/80 font-semibold" style={{ color: '#065f46' }}>Netto Stück-Provision</p>
            </div>
          </div>

          {/* Table Section */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-surface-200 uppercase tracking-wider flex items-center gap-1.5" style={{ color: '#000000' }}>
                <Package className="w-3.5 h-3.5 text-brand-400 print-hide" />
                Provisionsaufschlüsselung nach Artikeln ({sortedItems.length} Positionen)
              </h3>
              <span className="text-[10px] text-surface-500 print-hide">
                Kompakte 2-Spalten-Tabelle für vollständigen 1-Seiten-Druck
              </span>
            </div>

            {/* DUAL-COLUMN LAYOUT (Default & Forced in Print Mode) */}
            {layoutMode === 'compact-2col' ? (
              <div className="print-dual-grid grid grid-cols-1 md:grid-cols-2 gap-2.5">
                
                {/* Column 1 Table (Items 1..N/2) */}
                <div className="rounded-lg border border-surface-700/60 overflow-hidden">
                  <table className="print-table w-full text-left">
                    {renderTableHeader()}
                    <tbody className="divide-y divide-surface-700/30">
                      {leftItems.map((it, idx) => renderTableRow(it, idx))}
                      {leftItems.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-4 text-center text-surface-500 text-xs">
                            Keine Daten vorhanden.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Column 2 Table (Items N/2..N) */}
                <div className="rounded-lg border border-surface-700/60 overflow-hidden">
                  <table className="print-table w-full text-left">
                    {renderTableHeader()}
                    <tbody className="divide-y divide-surface-700/30">
                      {rightItems.map((it, idx) => renderTableRow(it, idx))}
                      {rightItems.length === 0 && leftItems.length > 0 && (
                        <tr>
                          <td colSpan={5} className="py-2 text-center text-surface-500 text-[10px]">
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
              <div className="rounded-lg border border-surface-700/60 overflow-hidden">
                <table className="print-table w-full text-left">
                  {renderTableHeader()}
                  <tbody className="divide-y divide-surface-700/30">
                    {sortedItems.map((it, idx) => renderTableRow(it, idx))}
                    {sortedItems.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-4 text-center text-surface-500 text-xs">
                          Keine Provisionsdaten vorhanden.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Bottom Summary Bar */}
            <div className="print-summary-bar flex items-center justify-between p-2 rounded-lg bg-surface-800/90 border border-surface-700 text-xs">
              <div className="flex items-center gap-3">
                <span className="font-bold uppercase text-surface-300" style={{ color: '#000000' }}>
                  Gesamtsumme ({sortedItems.length} Artikel)
                </span>
                <span className="text-surface-400 font-medium" style={{ color: '#334155' }}>
                  Menge: <strong style={{ color: '#000000' }}>{formatNumber(totalPieces)} Stk.</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-surface-400" style={{ color: '#334155' }}>Netto-Provision:</span>
                <span className="font-mono font-black text-sm text-emerald-400" style={{ color: '#047857' }}>
                  {formatCurrency(totalCommission)}
                </span>
              </div>
            </div>
          </div>

          {/* Compact Signatures Section */}
          <div className="print-signatures grid grid-cols-2 gap-8 pt-2.5 pb-1 border-t border-surface-700/50">
            <div className="space-y-4">
              <p className="text-[10px] text-surface-400" style={{ color: '#475569' }}>
                Abrechnung geprüft & freigegeben durch Geschäftsleitung:
              </p>
              <div className="border-t border-dashed border-surface-600 pt-1" style={{ borderColor: '#94a3b8' }}>
                <p className="text-[9.5px] font-semibold text-surface-300" style={{ color: '#000000' }}>
                  Datum, Unterschrift Verwaltung / Büro (M-ONE)
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-[10px] text-surface-400" style={{ color: '#475569' }}>
                Betrag dankend erhalten / Empfangsbestätigung:
              </p>
              <div className="border-t border-dashed border-surface-600 pt-1" style={{ borderColor: '#94a3b8' }}>
                <p className="text-[9.5px] font-semibold text-surface-300" style={{ color: '#000000' }}>
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

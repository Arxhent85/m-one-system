'use client'

import { useState, useMemo } from 'react'
import { X, Printer, User, Package, ArrowUp, ArrowDown, Columns, LayoutList, CheckCircle2, ShieldCheck, Wallet } from 'lucide-react'
import { formatCurrency, formatNumber } from '@/lib/utils/currency'
import { formatMonthKey, FIXED_DRIVER_SALARY } from '@/lib/commission'

interface PayrollPrintModalProps {
  driverName: string
  monthKey: string
  totalCommission: number
  fixedSalary?: number
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
  fixedSalary = FIXED_DRIVER_SALARY,
  totalPieces,
  totalSalesVolume,
  totalOrders,
  itemBreakdown,
  onClose,
}: PayrollPrintModalProps) {
  const [sortKey, setSortKey] = useState<'sku' | 'name' | 'qty' | 'rate' | 'commission'>('sku')
  const [sortAsc, setSortAsc] = useState<boolean>(true)
  const [layoutMode, setLayoutMode] = useState<'compact-2col' | 'single-col'>('compact-2col')

  // Total Salary calculation: Provision + Fixlohn
  const effectiveFixedSalary = monthKey === 'all' ? fixedSalary * 8 : fixedSalary
  const totalPayable = Math.round((totalCommission + effectiveFixedSalary) * 100) / 100

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
    <thead className="bg-slate-100 print:bg-slate-100 text-slate-800 uppercase text-[9px] print:text-[8pt] font-bold tracking-wider select-none border-b border-slate-300">
      <tr>
        <th
          onClick={() => handleSort('sku')}
          className="py-1 px-1.5 cursor-pointer hover:bg-slate-200 transition-colors w-[18%]"
        >
          <div className="flex items-center gap-0.5">
            <span>SKU</span>
            {sortKey === 'sku' && (
              sortAsc ? <ArrowUp className="w-2.5 h-2.5 text-blue-600" /> : <ArrowDown className="w-2.5 h-2.5 text-blue-600" />
            )}
          </div>
        </th>
        <th
          onClick={() => handleSort('name')}
          className="py-1 px-1.5 cursor-pointer hover:bg-slate-200 transition-colors w-[42%]"
        >
          <div className="flex items-center gap-0.5">
            <span>Artikel</span>
            {sortKey === 'name' && (
              sortAsc ? <ArrowUp className="w-2.5 h-2.5 text-blue-600" /> : <ArrowDown className="w-2.5 h-2.5 text-blue-600" />
            )}
          </div>
        </th>
        <th
          onClick={() => handleSort('qty')}
          className="py-1 px-1 text-right cursor-pointer hover:bg-slate-200 transition-colors w-[13%]"
        >
          <div className="flex items-center justify-end gap-0.5">
            <span>Menge</span>
            {sortKey === 'qty' && (
              sortAsc ? <ArrowUp className="w-2.5 h-2.5 text-blue-600" /> : <ArrowDown className="w-2.5 h-2.5 text-blue-600" />
            )}
          </div>
        </th>
        <th
          onClick={() => handleSort('rate')}
          className="py-1 px-1 text-right cursor-pointer hover:bg-slate-200 transition-colors w-[12%]"
        >
          <div className="flex items-center justify-end gap-0.5">
            <span>Satz</span>
            {sortKey === 'rate' && (
              sortAsc ? <ArrowUp className="w-2.5 h-2.5 text-blue-600" /> : <ArrowDown className="w-2.5 h-2.5 text-blue-600" />
            )}
          </div>
        </th>
        <th
          onClick={() => handleSort('commission')}
          className="py-1 px-1.5 text-right font-bold cursor-pointer hover:bg-slate-200 transition-colors w-[15%]"
        >
          <div className="flex items-center justify-end gap-0.5">
            <span>Provision</span>
            {sortKey === 'commission' && (
              sortAsc ? <ArrowUp className="w-2.5 h-2.5 text-blue-600" /> : <ArrowDown className="w-2.5 h-2.5 text-blue-600" />
            )}
          </div>
        </th>
      </tr>
    </thead>
  )

  const renderTableRow = (it: typeof sortedItems[0], idx: number) => (
    <tr
      key={it.sku}
      className={`hover:bg-slate-100 ${
        idx % 2 === 1 ? 'bg-slate-50/80 print:bg-slate-50/80' : 'bg-white print:bg-white'
      }`}
    >
      <td className="py-0.5 px-1.5 font-mono font-bold text-slate-900 text-[10px] print:text-[8pt] whitespace-nowrap">
        {it.sku}
      </td>
      <td
        className="py-0.5 px-1.5 text-slate-800 font-medium text-[10px] print:text-[8pt] truncate max-w-[135px] print:max-w-[170px]"
        title={it.name}
      >
        {it.name}
      </td>
      <td className="py-0.5 px-1 text-right font-semibold text-slate-900 text-[10px] print:text-[8pt] whitespace-nowrap">
        {formatNumber(it.qty)}
      </td>
      <td className="py-0.5 px-1 text-right font-mono text-slate-600 text-[9.5px] print:text-[7.5pt] whitespace-nowrap">
        {it.rate.toFixed(2)} €
      </td>
      <td className="py-0.5 px-1.5 text-right font-mono font-bold text-emerald-700 print:text-black text-[10px] print:text-[8pt] whitespace-nowrap">
        {formatCurrency(it.commission)}
      </td>
    </tr>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 print:p-0 print:bg-white print:static print:inset-auto print:block">
      
      {/* Universal 100% White & Black Print Stylesheet */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: 6mm 8mm 6mm 8mm;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html, body {
            background-color: #ffffff !important;
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
          }
          /* Hide screen UI elements */
          .print-hide,
          header,
          nav,
          aside,
          button {
            display: none !important;
          }
          /* Dedicated print container: pure white, borderless, zero ink waste */
          .payroll-sheet {
            position: static !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            background-color: #ffffff !important;
            background: #ffffff !important;
            color: #000000 !important;
            overflow: visible !important;
          }
          .print-dual-grid {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 8px !important;
            width: 100% !important;
            page-break-inside: auto !important;
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
        }
      ` }} />

      {/* Screen Modal Container with White Document Body */}
      <div className="payroll-sheet bg-white text-slate-900 border border-slate-300 rounded-2xl w-full max-w-5xl max-h-[96vh] flex flex-col overflow-hidden shadow-2xl print:border-none print:shadow-none print:max-h-none print:rounded-none">
        
        {/* Top Control Toolbar (Hidden on Print) */}
        <div className="print-hide flex items-center justify-between p-3 sm:p-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 border border-blue-300 flex items-center justify-center text-blue-700">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                Offizielle Lohnabrechnung
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold">
                  {sortedItems.length} Positionen · 1-Seiten-Kompaktdruck
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Fahrer: <strong className="text-slate-900">{driverName}</strong> ({depotLabel}) · {periodLabel}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-white p-0.5 rounded-lg border border-slate-300 text-xs">
              <button
                type="button"
                onClick={() => setLayoutMode('compact-2col')}
                className={`px-2 py-1 rounded flex items-center gap-1 font-medium transition-all ${
                  layoutMode === 'compact-2col'
                    ? 'bg-blue-600 text-white shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
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
                    ? 'bg-blue-600 text-white shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="1-Spaltige Standardansicht"
              >
                <LayoutList className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">1 Spalte</span>
              </button>
            </div>

            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Drucken (A4) / Als PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Body (Pure White Background, Crisp Black Ink) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2.5 print:p-0 print:overflow-visible print:space-y-1.5 bg-white text-slate-900">
          
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-2">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  M ONE SH.P.K.
                </h1>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-300 font-bold uppercase">
                  Warenwirtschaft & Großhandel
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium">
                Fahrzeugdepot {depotLabel} · Provisions- & Gehaltsabrechnung
              </p>
            </div>
            
            <div className="text-right">
              <span className="inline-block px-2.5 py-0.5 bg-slate-900 text-white rounded text-[10px] font-black uppercase tracking-wider print:bg-slate-100 print:text-black print:border print:border-slate-800">
                LOHNABRECHNUNG
              </span>
              <p className="text-xs text-slate-700 mt-0.5">
                Abrechnungsmonat: <strong className="text-slate-900">{periodLabel}</strong>
              </p>
              <p className="text-[10px] text-slate-500">
                Druckdatum: {new Date().toLocaleDateString('de-DE')}
              </p>
            </div>
          </div>

          {/* 4 Compact Overview Metric Cards */}
          <div className="grid grid-cols-4 gap-2">
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-300">
              <p className="text-[9.5px] text-slate-500 font-bold uppercase">Mitarbeiter / Fahrer</p>
              <p className="text-sm font-black text-slate-900 mt-0.5 flex items-center gap-1">
                <User className="w-3 h-3 text-blue-600 print-hide" />
                {driverName}
              </p>
              <p className="text-[9px] text-slate-600">{driverSeries}</p>
            </div>

            <div className="p-2 rounded-lg bg-slate-50 border border-slate-300">
              <p className="text-[9.5px] text-slate-500 font-bold uppercase">Verkaufte Stückzahl</p>
              <p className="text-sm font-black text-slate-900 mt-0.5">
                {formatNumber(totalPieces)} Stk.
              </p>
              <p className="text-[9px] text-slate-600">in {formatNumber(totalOrders)} Fakturen</p>
            </div>

            <div className="p-2 rounded-lg bg-slate-50 border border-slate-300">
              <p className="text-[9.5px] text-slate-500 font-bold uppercase">Verkaufsvolumen (Brutto)</p>
              <p className="text-sm font-black text-slate-900 mt-0.5">
                {formatCurrency(totalSalesVolume)}
              </p>
              <p className="text-[9px] text-slate-600">Fakturiert</p>
            </div>

            <div className="p-2 rounded-lg bg-emerald-50 border-2 border-emerald-600 print:bg-slate-100 print:border-slate-800">
              <p className="text-[9.5px] text-emerald-900 print:text-black font-black uppercase">Totaler Auszahlungslohn</p>
              <p className="text-base font-black text-emerald-700 print:text-black mt-0.5">
                {formatCurrency(totalPayable)}
              </p>
              <p className="text-[8.5px] text-emerald-800 print:text-slate-700 font-bold">
                Prov. {formatCurrency(totalCommission)} + Fix {formatCurrency(effectiveFixedSalary)}
              </p>
            </div>
          </div>

          {/* Article Table Section */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-blue-600 print-hide" />
                Provisionsaufschlüsselung nach Artikeln ({sortedItems.length} Positionen)
              </h3>
              <span className="text-[10px] text-slate-500 print-hide">
                Kompakte 2-Spalten-Tabelle für vollständige Übersicht
              </span>
            </div>

            {/* DUAL-COLUMN LAYOUT (Default & Forced on Print) */}
            {layoutMode === 'compact-2col' ? (
              <div className="print-dual-grid grid grid-cols-1 md:grid-cols-2 gap-2.5">
                
                {/* Column 1 Table (Items 1..N/2) */}
                <div className="rounded-lg border border-slate-300 overflow-hidden">
                  <table className="print-table w-full text-left">
                    {renderTableHeader()}
                    <tbody className="divide-y divide-slate-200">
                      {leftItems.map((it, idx) => renderTableRow(it, idx))}
                      {leftItems.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-4 text-center text-slate-500 text-xs">
                            Keine Daten vorhanden.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Column 2 Table (Items N/2..N) */}
                <div className="rounded-lg border border-slate-300 overflow-hidden">
                  <table className="print-table w-full text-left">
                    {renderTableHeader()}
                    <tbody className="divide-y divide-slate-200">
                      {rightItems.map((it, idx) => renderTableRow(it, idx))}
                      {rightItems.length === 0 && leftItems.length > 0 && (
                        <tr>
                          <td colSpan={5} className="py-2 text-center text-slate-500 text-[10px]">
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
              <div className="rounded-lg border border-slate-300 overflow-hidden">
                <table className="print-table w-full text-left">
                  {renderTableHeader()}
                  <tbody className="divide-y divide-slate-200">
                    {sortedItems.map((it, idx) => renderTableRow(it, idx))}
                    {sortedItems.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-4 text-center text-slate-500 text-xs">
                          Keine Provisionsdaten vorhanden.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Financial Breakdown & Total Calculation Box (Glasklare Buchhaltungsaufstellung) */}
            <div className="p-2.5 rounded-lg bg-slate-50 border-2 border-slate-300 text-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <p className="font-bold text-slate-900 uppercase text-[10px]">
                  Verkaufsleistung ({sortedItems.length} Artikelpositionen)
                </p>
                <div className="flex items-center gap-3 text-slate-700 text-[11px]">
                  <span>Gesamtstückzahl: <strong className="text-slate-900">{formatNumber(totalPieces)} Stk.</strong></span>
                  <span>·</span>
                  <span>Bruttoumsatz: <strong className="text-slate-900">{formatCurrency(totalSalesVolume)}</strong></span>
                </div>
              </div>

              {/* Exact Formula Box: Provision + Fixlohn = Totaler Lohn */}
              <div className="flex items-center gap-3 bg-white p-1.5 px-3 rounded-lg border border-slate-300 self-stretch md:self-auto justify-between md:justify-end">
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block">1. Stück-Provision:</span>
                  <span className="font-mono font-bold text-slate-900">{formatCurrency(totalCommission)}</span>
                </div>
                <span className="text-slate-400 font-bold text-sm">+</span>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block">2. Fixlohn Basis:</span>
                  <span className="font-mono font-bold text-slate-900">{formatCurrency(effectiveFixedSalary)}</span>
                </div>
                <span className="text-slate-400 font-bold text-sm">=</span>
                <div className="text-right pl-2 border-l border-slate-300">
                  <span className="text-[10px] font-black text-emerald-800 print:text-black uppercase block">TOTALER LOHN:</span>
                  <span className="font-mono font-black text-base text-emerald-700 print:text-black">
                    {formatCurrency(totalPayable)}
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Signatures Section */}
          <div className="grid grid-cols-2 gap-8 pt-2 pb-1 border-t border-slate-300">
            <div className="space-y-3">
              <p className="text-[10px] text-slate-600">
                Abrechnung geprüft & genehmigt durch Geschäftsleitung:
              </p>
              <div className="border-t border-dashed border-slate-400 pt-1">
                <p className="text-[9.5px] font-bold text-slate-900">
                  Datum, Unterschrift Verwaltung / Büro (M-ONE)
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] text-slate-600">
                Lohnbetrag dankend erhalten / Empfangsbestätigung:
              </p>
              <div className="border-t border-dashed border-slate-400 pt-1">
                <p className="text-[9.5px] font-bold text-slate-900">
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

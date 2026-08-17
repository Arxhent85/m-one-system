'use client'

import { useMemo } from 'react'
import { User, Package, ArrowUp } from 'lucide-react'
import { formatCurrency, formatNumber } from '@/lib/utils/currency'
import { formatMonthKey, FIXED_DRIVER_SALARY, calculateOrderCommission, getDriverForSale } from '@/lib/commission'

interface PrintablePayrollSlipProps {
  driverName: 'Mensuri' | 'Qerimi'
  monthKey: string
  salesList: any[]
}

export default function PrintablePayrollSlip({
  driverName,
  monthKey,
  salesList,
}: PrintablePayrollSlipProps) {
  // Aggregate sales for this driver & month
  const {
    totalCommission,
    totalPieces,
    totalSalesVolume,
    totalOrders,
    sortedItems,
    leftItems,
    rightItems,
    effectiveFixedSalary,
    totalPayable,
  } = useMemo(() => {
    const targetSales = salesList.filter((s) => {
      const d = s.created_at || s.date || '2026-01-01'
      const m = d.slice(0, 7)
      if (monthKey !== 'all' && m !== monthKey) return false
      return getDriverForSale(s) === driverName
    })

    let totalComm = 0
    let totalP = 0
    let totalVol = 0
    const itemMap: Record<string, { sku: string; name: string; qty: number; rate: number; commission: number }> = {}

    targetSales.forEach((s) => {
      const { totalCommission: c, totalPieces: p, itemsCommission } = calculateOrderCommission(s)
      totalComm += c
      totalP += p
      totalVol += Number(s.total_amount || 0)

      itemsCommission.forEach((it) => {
        if (!itemMap[it.sku]) {
          itemMap[it.sku] = { ...it, qty: 0, commission: 0 }
        }
        itemMap[it.sku].qty += it.qty
        itemMap[it.sku].commission += it.commission
      })
    })

    const items = Object.values(itemMap).sort((a, b) =>
      a.sku.localeCompare(b.sku, undefined, { numeric: true })
    )

    const mid = Math.ceil(items.length / 2)
    const left = items.slice(0, mid)
    const right = items.slice(mid)

    const fixSalary = monthKey === 'all' ? FIXED_DRIVER_SALARY * 8 : FIXED_DRIVER_SALARY
    const payable = Math.round((totalComm + fixSalary) * 100) / 100

    return {
      totalCommission: Math.round(totalComm * 100) / 100,
      totalPieces: totalP,
      totalSalesVolume: Math.round(totalVol * 100) / 100,
      totalOrders: targetSales.length,
      sortedItems: items,
      leftItems: left,
      rightItems: right,
      effectiveFixedSalary: fixSalary,
      totalPayable: payable,
    }
  }, [driverName, monthKey, salesList])

  const periodLabel = monthKey === 'all' ? 'Gesamtes Geschäftsjahr 2026' : formatMonthKey(monthKey)
  const depotLabel = driverName === 'Mensuri' ? '1 (Depo Mensuri)' : '2 (Depo Qerimi)'
  const driverSeries = driverName === 'Mensuri' ? 'Kd.-Nr. 2xxxx' : 'Kd.-Nr. 1xxxx'

  const renderTableHeader = () => (
    <thead className="bg-slate-100 text-slate-900 uppercase text-[8pt] font-bold tracking-wider select-none border-b border-slate-300">
      <tr>
        <th className="py-1 px-1.5 text-left w-[16%]">
          <div className="flex items-center gap-0.5">
            <span>SKU</span>
            <ArrowUp className="w-2.5 h-2.5 text-blue-600" />
          </div>
        </th>
        <th className="py-1 px-1.5 text-left w-[42%]">ARTIKEL</th>
        <th className="py-1 px-1 text-right w-[14%]">MENGE</th>
        <th className="py-1 px-1 text-right w-[12%]">SATZ</th>
        <th className="py-1 px-1.5 text-right w-[16%]">PROVISION</th>
      </tr>
    </thead>
  )

  const renderTableRow = (it: typeof sortedItems[0], idx: number) => (
    <tr
      key={it.sku}
      className={`border-b border-slate-200/80 ${
        idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'
      }`}
    >
      <td className="py-0.5 px-1.5 font-mono font-bold text-slate-900 text-[8pt] whitespace-nowrap">
        {it.sku}
      </td>
      <td
        className="py-0.5 px-1.5 text-slate-800 font-medium text-[8pt] truncate max-w-[170px]"
        title={it.name}
      >
        {it.name}
      </td>
      <td className="py-0.5 px-1 text-right font-semibold text-slate-900 text-[8pt] whitespace-nowrap">
        {formatNumber(it.qty)}
      </td>
      <td className="py-0.5 px-1 text-right font-mono text-slate-600 text-[7.5pt] whitespace-nowrap">
        {it.rate.toFixed(2)} €
      </td>
      <td className="py-0.5 px-1.5 text-right font-mono font-bold text-emerald-700 print:text-black text-[8pt] whitespace-nowrap">
        {formatCurrency(it.commission)}
      </td>
    </tr>
  )

  return (
    <div className="payroll-print-document bg-white text-slate-900 w-full p-4 sm:p-5 space-y-2.5 print:p-0 print:space-y-2 border-none">
      
      {/* 1. Header with exact branding from screenshot */}
      <div className="flex justify-between items-start border-b-2 border-slate-900 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              M ONE SH.P.K.
            </h1>
            <span className="text-[9.5px] px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-300 font-bold uppercase">
              WARENWIRTSCHAFT & GROSSHANDEL
            </span>
          </div>
          <p className="text-[10.5px] text-slate-600 font-medium mt-0.5">
            Fahrzeugdepot {depotLabel} · Provisions- & Gehaltsabrechnung
          </p>
        </div>

        <div className="text-right">
          <span className="inline-block px-3 py-0.5 bg-slate-900 text-white rounded text-[9.5px] font-black uppercase tracking-wider print:bg-slate-100 print:text-black print:border print:border-slate-800">
            LOHNABRECHNUNG
          </span>
          <p className="text-[11px] text-slate-800 font-medium mt-1">
            Abrechnungsmonat: <strong className="text-slate-900">{periodLabel}</strong>
          </p>
          <p className="text-[10px] text-slate-500">
            Druckdatum: {new Date().toLocaleDateString('de-DE')}
          </p>
        </div>
      </div>

      {/* 2. 4 Metric Overview Boxes */}
      <div className="grid grid-cols-4 gap-2.5">
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
          <p className="text-[9px] text-slate-500 font-bold uppercase">MITARBEITER / FAHRER</p>
          <p className="text-sm font-black text-slate-900 mt-0.5 flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-blue-600 print-hide" />
            {driverName}
          </p>
          <p className="text-[9px] text-slate-500 font-mono">{driverSeries}</p>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
          <p className="text-[9px] text-slate-500 font-bold uppercase">VERKAUFTE STÜCKZAHL</p>
          <p className="text-sm font-black text-slate-900 mt-0.5">
            {formatNumber(totalPieces)} Stk.
          </p>
          <p className="text-[9px] text-slate-500">in {formatNumber(totalOrders)} Fakturen</p>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
          <p className="text-[9px] text-slate-500 font-bold uppercase">VERKAUFSVOLUMEN (BRUTTO)</p>
          <p className="text-sm font-black text-slate-900 mt-0.5">
            {formatCurrency(totalSalesVolume)}
          </p>
          <p className="text-[9px] text-slate-500">Fakturiert</p>
        </div>

        <div className="p-2.5 rounded-xl bg-emerald-50 border-2 border-emerald-600 print:bg-slate-100 print:border-slate-800">
          <p className="text-[9px] text-emerald-900 print:text-black font-black uppercase">TOTALER AUSZAHLUNGSLOHN</p>
          <p className="text-base font-black text-emerald-700 print:text-black mt-0.5">
            {formatCurrency(totalPayable)}
          </p>
          <p className="text-[8.5px] text-emerald-800 print:text-slate-700 font-bold">
            Prov. {formatCurrency(totalCommission)} + Fix {formatCurrency(effectiveFixedSalary)}
          </p>
        </div>
      </div>

      {/* 3. Section Title */}
      <div className="flex items-center justify-between pt-0.5">
        <h2 className="text-[10px] font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
          <Package className="w-3.5 h-3.5 text-blue-600 print-hide" />
          PROVISIONSAUFSCHLÜSSELUNG NACH ARTIKELN ({sortedItems.length} POSITIONEN)
        </h2>
        <span className="text-[9px] text-slate-500 print-hide">
          Kompakte 2-Spalten-Tabelle für vollständige Übersicht
        </span>
      </div>

      {/* 4. Product Breakdown Table (2 Columns Side-by-Side: 100% of all sold items) */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Column 1 Table (Items 1..N/2) */}
        <div className="rounded-lg border border-slate-300 overflow-hidden">
          <table className="w-full text-left border-collapse text-[8pt]">
            {renderTableHeader()}
            <tbody>
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
          <table className="w-full text-left border-collapse text-[8pt]">
            {renderTableHeader()}
            <tbody>
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

      {/* 5. Financial Calculation Box: Provision + Fixlohn = Totaler Lohn */}
      <div className="p-2.5 rounded-xl bg-slate-50 border-2 border-slate-300 text-xs flex items-center justify-between mt-2">
        <div className="space-y-0.5">
          <p className="font-bold text-slate-900 uppercase text-[9.5px]">
            VERKAUFSLEISTUNG ({sortedItems.length} ARTIKELPOSITIONEN)
          </p>
          <div className="flex items-center gap-3 text-slate-700 text-[10.5px]">
            <span>Gesamtstückzahl: <strong className="text-slate-900">{formatNumber(totalPieces)} Stk.</strong></span>
            <span>·</span>
            <span>Bruttoumsatz: <strong className="text-slate-900">{formatCurrency(totalSalesVolume)}</strong></span>
          </div>
        </div>

        {/* Formula Box */}
        <div className="flex items-center gap-3 bg-white p-1.5 px-3 rounded-lg border border-slate-300">
          <div className="text-right">
            <span className="text-[9.5px] text-slate-500 block">1. Stück-Provision:</span>
            <span className="font-mono font-bold text-slate-900">{formatCurrency(totalCommission)}</span>
          </div>
          <span className="text-slate-400 font-bold text-sm">+</span>
          <div className="text-right">
            <span className="text-[9.5px] text-slate-500 block">2. Fixlohn Basis:</span>
            <span className="font-mono font-bold text-slate-900">{formatCurrency(effectiveFixedSalary)}</span>
          </div>
          <span className="text-slate-400 font-bold text-sm">=</span>
          <div className="text-right pl-2.5 border-l border-slate-300">
            <span className="text-[9.5px] font-black text-emerald-800 print:text-black uppercase block">TOTALER LOHN:</span>
            <span className="font-mono font-black text-base text-emerald-700 print:text-black">
              {formatCurrency(totalPayable)}
            </span>
          </div>
        </div>
      </div>

      {/* 6. Official Signatures */}
      <div className="grid grid-cols-2 gap-8 pt-3 pb-1 border-t border-slate-300 mt-2">
        <div className="space-y-4">
          <p className="text-[10px] text-slate-600">
            Abrechnung geprüft & genehmigt durch Geschäftsleitung:
          </p>
          <div className="border-t border-dashed border-slate-400 pt-1">
            <p className="text-[9.5px] font-bold text-slate-900">
              Datum, Unterschrift Verwaltung / Büro (M-ONE)
            </p>
          </div>
        </div>

        <div className="space-y-4">
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
  )
}

'use client'

import { X, Printer, CheckCircle2, User, Calendar, Package, DollarSign } from 'lucide-react'
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
  function handlePrint() {
    window.print()
  }

  const periodLabel = monthKey === 'all' ? 'Gesamtes Geschäftsjahr 2026' : formatMonthKey(monthKey)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface-900 border border-surface-700/80 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        
        {/* Modal Header (Hidden on Print) */}
        <div className="flex items-center justify-between p-5 border-b border-surface-700/80 shrink-0 print:hidden bg-surface-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-900/60 border border-brand-500/30 flex items-center justify-center text-brand-400">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-surface-50">Lohnabrechnung & Provisionsbeleg</h2>
              <p className="text-xs text-surface-400">Druckansicht für Fahrer {driverName} · {periodLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="btn-primary py-2 px-4 text-xs font-semibold flex items-center gap-2 shadow-glow"
            >
              <Printer className="w-4 h-4" />
              Drucken / Als PDF speichern
            </button>
            <button
              onClick={onClose}
              className="btn-icon text-surface-400 hover:text-surface-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 print:p-0 print:bg-white print:text-black print:overflow-visible text-surface-100">
          
          {/* Company & Document Header */}
          <div className="flex justify-between items-start border-b border-surface-700/50 pb-6 print:border-gray-300">
            <div>
              <h1 className="text-2xl font-black text-white print:text-black tracking-tight">M ONE SH.P.K.</h1>
              <p className="text-xs text-surface-400 print:text-gray-600 font-medium">
                Warenwirtschaft & Großhandel · Lohnabrechnung Fahrer
              </p>
              <p className="text-xs text-surface-500 print:text-gray-500 mt-1">
                Fahrzeugdepot {driverName === 'Mensuri' ? '1 (Depo Mensuri)' : '2 (Depo Qerimi)'}
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-brand-900/40 text-brand-400 border border-brand-500/30 rounded-lg text-xs font-bold uppercase tracking-wider print:bg-gray-100 print:text-black print:border-gray-400">
                Lohnabrechnung
              </span>
              <p className="text-xs text-surface-400 print:text-gray-600 mt-2">
                Abrechnungszeitraum: <strong className="text-white print:text-black">{periodLabel}</strong>
              </p>
              <p className="text-[11px] text-surface-500 print:text-gray-500">
                Erstellt am: {new Date().toLocaleDateString('de-DE')}
              </p>
            </div>
          </div>

          {/* Driver & Key Metrics Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 print:grid-cols-4">
            <div className="p-4 rounded-xl bg-surface-800/60 border border-surface-700/50 print:bg-gray-50 print:border-gray-300">
              <p className="text-xs text-surface-400 print:text-gray-500 font-medium">Mitarbeiter / Fahrer</p>
              <p className="text-lg font-bold text-white print:text-black mt-1 flex items-center gap-1.5">
                <User className="w-4 h-4 text-brand-400 print:hidden" />
                {driverName}
              </p>
              <p className="text-[11px] text-surface-400 print:text-gray-600">
                {driverName === 'Mensuri' ? 'Kd.-Nr. 2xxxx' : 'Kd.-Nr. 1xxxx'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-surface-800/60 border border-surface-700/50 print:bg-gray-50 print:border-gray-300">
              <p className="text-xs text-surface-400 print:text-gray-500 font-medium">Verkaufte Stückzahl</p>
              <p className="text-lg font-bold text-white print:text-black mt-1">
                {formatNumber(totalPieces)} Stk.
              </p>
              <p className="text-[11px] text-surface-400 print:text-gray-600">
                in {formatNumber(totalOrders)} Fakturen
              </p>
            </div>

            <div className="p-4 rounded-xl bg-surface-800/60 border border-surface-700/50 print:bg-gray-50 print:border-gray-300">
              <p className="text-xs text-surface-400 print:text-gray-500 font-medium">Verkaufsvolumen Brutto</p>
              <p className="text-lg font-bold text-white print:text-black mt-1">
                {formatCurrency(totalSalesVolume)}
              </p>
              <p className="text-[11px] text-surface-400 print:text-gray-600">Gesamteinnahmen</p>
            </div>

            <div className="p-4 rounded-xl bg-brand-950/40 border border-brand-500/40 print:bg-gray-100 print:border-gray-400">
              <p className="text-xs text-brand-300 print:text-black font-bold uppercase tracking-wider">Auszahlungsbetrag</p>
              <p className="text-xl font-black text-brand-400 print:text-black mt-1">
                {formatCurrency(totalCommission)}
              </p>
              <p className="text-[11px] text-brand-300/80 print:text-gray-600">Netto Stück-Provision</p>
            </div>
          </div>

          {/* Article Commission Breakdown Table */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-surface-200 print:text-black uppercase tracking-wider flex items-center gap-2">
              <Package className="w-4 h-4 text-brand-400 print:hidden" />
              Provisionsaufschlüsselung nach Artikeln (gemäß Provisionsmatrix)
            </h3>
            
            <div className="overflow-x-auto rounded-xl border border-surface-700/50 print:border-gray-300">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-800/80 print:bg-gray-200 text-surface-300 print:text-gray-800 uppercase text-[10px] font-semibold tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Art. Nr. (SKU)</th>
                    <th className="py-2.5 px-3">Artikelbezeichnung</th>
                    <th className="py-2.5 px-3 text-right">Menge (Stk)</th>
                    <th className="py-2.5 px-3 text-right">Provision / Stk</th>
                    <th className="py-2.5 px-3 text-right font-bold">Verdienst</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-700/40 print:divide-gray-200">
                  {itemBreakdown.map((it) => (
                    <tr key={it.sku} className="hover:bg-surface-800/30 print:hover:bg-transparent">
                      <td className="py-2 px-3 font-mono font-medium text-brand-300 print:text-black">{it.sku}</td>
                      <td className="py-2 px-3 text-surface-200 print:text-black font-medium">{it.name}</td>
                      <td className="py-2 px-3 text-right font-medium text-surface-100 print:text-black">{formatNumber(it.qty)}</td>
                      <td className="py-2 px-3 text-right font-mono text-surface-400 print:text-gray-700">{it.rate.toFixed(2)} €</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-emerald-400 print:text-black">
                        {formatCurrency(it.commission)}
                      </td>
                    </tr>
                  ))}
                  {itemBreakdown.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-surface-500 print:text-gray-500">
                        Keine Provisionsdaten für diesen Zeitraum vorhanden.
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-surface-800/90 print:bg-gray-100 border-t-2 border-surface-600 print:border-gray-400 font-bold text-surface-100 print:text-black">
                  <tr>
                    <td colSpan={2} className="py-3 px-3 uppercase">Gesamtsumme</td>
                    <td className="py-3 px-3 text-right">{formatNumber(totalPieces)} Stk</td>
                    <td className="py-3 px-3 text-right text-surface-400 print:text-gray-600">—</td>
                    <td className="py-3 px-3 text-right text-base text-brand-400 print:text-black font-mono">
                      {formatCurrency(totalCommission)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Signatures Section */}
          <div className="grid grid-cols-2 gap-8 pt-8 border-t border-surface-700/50 print:border-gray-300 print:pt-12">
            <div className="space-y-12">
              <p className="text-xs text-surface-400 print:text-gray-600">
                Abrechnung geprüft & freigegeben durch Geschäftsleitung:
              </p>
              <div className="border-t border-dashed border-surface-600 print:border-gray-400 pt-2">
                <p className="text-xs font-semibold text-surface-300 print:text-black">Datum, Unterschrift Verwaltung / Büro</p>
              </div>
            </div>

            <div className="space-y-12">
              <p className="text-xs text-surface-400 print:text-gray-600">
                Betrag erhalten / Empfangsbestätigung Fahrer:
              </p>
              <div className="border-t border-dashed border-surface-600 print:border-gray-400 pt-2">
                <p className="text-xs font-semibold text-surface-300 print:text-black">Datum, Unterschrift {driverName}</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

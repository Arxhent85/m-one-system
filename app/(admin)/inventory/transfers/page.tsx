import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeftRight, Check, Warehouse, Truck, Zap } from 'lucide-react'
import { formatRelative } from '@/lib/utils/dates'
import QuickTransferForm from '@/components/inventory/TransferForm'

export const metadata: Metadata = { title: 'Schnell-Umlagerung | M ONE ERP' }

export default async function TransfersPage() {
  const supabase = await createClient()

  const { data: dbTransfers } = await supabase
    .from('stock_transfers')
    .select('*, stock_transfer_items(count)')
    .order('created_at', { ascending: false })
    .limit(20)

  const sampleTransfers = [
    {
      id: 'tr-1',
      transfer_number: 'TR-2026-0001',
      from_location: 'Hauptlager Depot (M-ONE)',
      to_location: 'Fahrzeug 1 (Depo Mensuri)',
      status: 'confirmed',
      items_count: 8,
      notes: 'Morgen-Beladung Tour Nord',
      created_at: new Date(Date.now() - 1000 * 3600 * 4).toISOString(),
    },
    {
      id: 'tr-2',
      transfer_number: 'TR-2026-0002',
      from_location: 'Hauptlager Depot (M-ONE)',
      to_location: 'Fahrzeug 2 (Depo Qerimi)',
      status: 'confirmed',
      items_count: 8,
      notes: 'Morgen-Beladung Tour Süd',
      created_at: new Date(Date.now() - 1000 * 3600 * 5).toISOString(),
    },
  ]

  const transfers = (dbTransfers && dbTransfers.length > 0) ? dbTransfers : sampleTransfers

  return (
    <div className="space-y-6 animate-in max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-surface-50 flex items-center gap-2">
          <Zap className="w-6 h-6 text-brand-400" />
          Schnell-Umlagerung
        </h1>
        <p className="text-surface-400 text-sm mt-1">
          Fahrzeug beladen in Sekunden — tippe SKU, drücke <kbd className="bg-surface-800 text-surface-300 text-xs px-1.5 py-0.5 rounded border border-surface-700">Enter</kbd>, gib Menge ein, <kbd className="bg-surface-800 text-surface-300 text-xs px-1.5 py-0.5 rounded border border-surface-700">Enter</kbd> → fertig
        </p>
      </div>

      {/* Schnell-Eingabe */}
      <QuickTransferForm />

      {/* Letzte Umlagerungen */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-surface-700/50 flex items-center justify-between">
          <h2 className="font-semibold text-surface-100 flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4 text-brand-400" />
            Letzte Umlagerungen
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
              {transfers.map((t: any) => (
                <tr key={t.id}>
                  <td>
                    <span className="font-mono text-xs font-semibold text-brand-400">
                      {t.transfer_number}
                    </span>
                  </td>
                  <td>
                    <span className="text-surface-200 text-sm flex items-center gap-1.5">
                      <Warehouse className="w-3.5 h-3.5 text-brand-400" />
                      {t.from_location ?? 'Hauptlager Depot'}
                    </span>
                  </td>
                  <td>
                    <span className="text-surface-200 text-sm flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-success-500" />
                      {t.to_location ?? 'Fahrzeug 1'}
                    </span>
                  </td>
                  <td>
                    <span className="text-xs text-surface-300 font-mono">
                      {t.items_count ?? (t.stock_transfer_items?.[0]?.count ?? '?')} Pos.
                    </span>
                  </td>
                  <td>
                    <span className="text-xs text-surface-400">{t.notes ?? 'Fahrzeugbeladung'}</span>
                  </td>
                  <td>
                    <span className="text-xs text-surface-400">{formatRelative(t.created_at)}</span>
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

import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Package, Plus, Search } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/currency'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Produkte | M ONE ERP' }

interface SearchParams {
  search?: string
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params   = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('products')
    .select('id, sku, name, unit, purchase_price, selling_price, is_active')
    .eq('is_active', true)
    .order('sku', { ascending: true })

  if (params.search) {
    query = query.or(`name.ilike.%${params.search}%,sku.ilike.%${params.search}%`)
  }

  const { data: products, error } = await query

  const safeProducts = products ?? []

  return (
    <div className="space-y-6 animate-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-50 flex items-center gap-2">
            <Package className="w-6 h-6 text-brand-400" />
            Produktkatalog
          </h1>
          <p className="text-surface-400 text-sm mt-1">
            {safeProducts.length} aktive Artikel · sortiert nach Artikelnummer
          </p>
        </div>
        <Link href="/products/new" className="btn-primary">
          <Plus className="w-4 h-4" />
          Neues Produkt
        </Link>
      </div>

      {/* Suchleiste */}
      <div className="glass-card p-4">
        <form className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500 pointer-events-none" />
            <input
              name="search"
              type="search"
              defaultValue={params.search}
              placeholder="Artikelnummer oder Name suchen…"
              className="input pl-9 py-2 w-full"
            />
          </div>
          <button type="submit" className="btn-secondary py-2 px-4">
            Suchen
          </button>
          {params.search && (
            <Link href="/products" className="btn-ghost py-2 px-3 text-sm">
              ✕ Filter löschen
            </Link>
          )}
        </form>
      </div>

      {/* Produkttabelle */}
      {error && (
        <div className="glass-card p-4 border-danger-500/30 text-danger-400 text-sm">
          Datenbankfehler: {error.message}
        </div>
      )}

      {safeProducts.length === 0 ? (
        <div className="glass-card p-12 text-center text-surface-400">
          <Package className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">Keine Produkte gefunden</p>
          <p className="text-sm mt-1">Bitte importiere zuerst den Produktkatalog.</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-700/50 bg-surface-900/60">
                  <th className="text-left px-4 py-3 text-surface-400 font-semibold text-xs uppercase tracking-wider">
                    Nr.
                  </th>
                  <th className="text-left px-4 py-3 text-surface-400 font-semibold text-xs uppercase tracking-wider w-28">
                    Art.-Nr.
                  </th>
                  <th className="text-left px-4 py-3 text-surface-400 font-semibold text-xs uppercase tracking-wider">
                    Bezeichnung
                  </th>
                  <th className="text-left px-4 py-3 text-surface-400 font-semibold text-xs uppercase tracking-wider w-16">
                    Einheit
                  </th>
                  <th className="text-right px-4 py-3 text-surface-400 font-semibold text-xs uppercase tracking-wider w-28">
                    EK-Preis
                  </th>
                  <th className="text-right px-4 py-3 text-surface-400 font-semibold text-xs uppercase tracking-wider w-28">
                    VK-Preis
                  </th>
                  <th className="text-right px-4 py-3 text-surface-400 font-semibold text-xs uppercase tracking-wider w-20">
                    Marge
                  </th>
                </tr>
              </thead>
              <tbody>
                {safeProducts.map((product: any, idx: number) => {
                  const margin = product.selling_price > 0
                    ? ((product.selling_price - product.purchase_price) / product.selling_price) * 100
                    : 0
                  const rowBg = idx % 2 === 0 ? '' : 'bg-surface-900/20'

                  return (
                    <tr
                      key={product.id}
                      className={`border-b border-surface-800/40 hover:bg-brand-900/20 transition-colors ${rowBg}`}
                    >
                      {/* Laufende Nr. */}
                      <td className="px-4 py-3 text-surface-600 text-xs tabular-nums w-10">
                        {idx + 1}
                      </td>

                      {/* Artikelnummer */}
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm font-semibold text-brand-400 tracking-wide">
                          {product.sku}
                        </span>
                      </td>

                      {/* Bezeichnung */}
                      <td className="px-4 py-3">
                        <span className="font-medium text-surface-100">
                          {product.name}
                        </span>
                      </td>

                      {/* Einheit */}
                      <td className="px-4 py-3">
                        <span className="text-surface-400 text-xs bg-surface-800 px-2 py-0.5 rounded">
                          {product.unit}
                        </span>
                      </td>

                      {/* EK-Preis */}
                      <td className="px-4 py-3 text-right tabular-nums text-surface-400">
                        {product.purchase_price > 0 ? formatCurrency(product.purchase_price) : '—'}
                      </td>

                      {/* VK-Preis */}
                      <td className="px-4 py-3 text-right tabular-nums font-semibold text-surface-100">
                        {product.selling_price > 0 ? formatCurrency(product.selling_price) : '—'}
                      </td>

                      {/* Marge */}
                      <td className="px-4 py-3 text-right">
                        {product.selling_price > 0 ? (
                          <span className={`text-xs font-semibold tabular-nums px-2 py-0.5 rounded-full ${
                            margin >= 40 ? 'bg-success-900/40 text-success-400' :
                            margin >= 20 ? 'bg-warning-900/40 text-warning-400' :
                            'bg-danger-900/40 text-danger-400'
                          }`}>
                            {margin.toFixed(0)}%
                          </span>
                        ) : (
                          <span className="text-surface-600 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-surface-800/50 flex items-center justify-between bg-surface-900/30">
            <p className="text-xs text-surface-500">
              Gesamt: <strong className="text-surface-300">{safeProducts.length} Artikel</strong>
            </p>
            <p className="text-xs text-surface-500">
              Sortiert nach Artikelnummer (aufsteigend)
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

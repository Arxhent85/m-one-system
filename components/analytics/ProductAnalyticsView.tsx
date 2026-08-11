'use client'

import { useState, useEffect, useMemo } from 'react'
import { Package, Search, MapPin, Users, TrendingUp, Eye } from 'lucide-react'
import { formatCurrency, formatNumber } from '@/lib/utils/currency'
import { getSalesHistory, INITIAL_DEPO_PRODUCTS } from '@/lib/stockStore'
import ProductDetailModal from './ProductDetailModal'

import MOCK_2026_SALES from '@/lib/mock2026Sales.json'

export default function ProductAnalyticsView() {
  const [salesList, setSalesList] = useState<any[]>(MOCK_2026_SALES)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null)

  useEffect(() => {
    function loadData() {
      const local = getSalesHistory()
      const base = local && local.length > 0 ? local : MOCK_2026_SALES

      fetch('/api/sales/record')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.sales) && data.sales.length > 0) {
            const combined = [...data.sales]
            base.forEach((l: any) => {
              if (!combined.some((c) => c.id === l.id || c.order_number === l.order_number)) {
                combined.push(l)
              }
            })
            setSalesList(combined)
          } else {
            setSalesList(base)
          }
        })
        .catch(() => setSalesList(base))
    }

    loadData()
    const interval = setInterval(loadData, 3000)
    window.addEventListener('focus', loadData)
    window.addEventListener('m_one_sale_recorded', loadData)
    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', loadData)
      window.removeEventListener('m_one_sale_recorded', loadData)
    }
  }, [])

  // Product sales analysis
  const productStats = useMemo(() => {
    const map: Record<string, {
      sku: string
      name: string
      purchase_price: number
      selling_price: number
      stock: number
      qtySold: number
      revenue: number
      ordersCount: number
      topCustomer: string
      topCity: string
    }> = {}

    // Initialize all 42 depo products
    INITIAL_DEPO_PRODUCTS.forEach((p) => {
      map[p.sku] = {
        sku: p.sku,
        name: p.name,
        purchase_price: p.price * 0.65, // ~35% margin
        selling_price: p.price,
        stock: p.stock,
        qtySold: 0,
        revenue: 0,
        ordersCount: 0,
        topCustomer: '—',
        topCity: '—',
      }
    })

    // Aggregate sales
    const custMap: Record<string, Record<string, number>> = {}
    const cityMap: Record<string, Record<string, number>> = {}

    salesList.forEach((s) => {
      (s.items || []).forEach((i: any) => {
        const sku = i.sku
        if (sku && map[sku]) {
          const qty = i.qty || 1
          const lineTotal = i.total || qty * (i.unit_price || map[sku].selling_price)

          map[sku].qtySold += qty
          map[sku].revenue += lineTotal
          map[sku].ordersCount += 1

          const cust = s.customer_name || s.customer_number || 'Laufkunde'
          if (!custMap[sku]) custMap[sku] = {}
          custMap[sku][cust] = (custMap[sku][cust] || 0) + qty

          const city = s.city || 'Unbekannt'
          if (!cityMap[sku]) cityMap[sku] = {}
          cityMap[sku][city] = (cityMap[sku][city] || 0) + qty
        }
      })
    })

    // Determine top customer and top city for each product
    Object.keys(map).forEach((sku) => {
      if (custMap[sku]) {
        const topC = Object.entries(custMap[sku]).sort((a, b) => b[1] - a[1])[0]
        if (topC) map[sku].topCustomer = `${topC[0]} (${topC[1]} Stk.)`
      }
      if (cityMap[sku]) {
        const topCi = Object.entries(cityMap[sku]).sort((a, b) => b[1] - a[1])[0]
        if (topCi && topCi[0] !== 'Unbekannt') map[sku].topCity = `${topCi[0]} (${topCi[1]} Stk.)`
      }
    })

    return Object.values(map)
  }, [salesList])

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return productStats
    const q = searchQuery.toLowerCase()
    return productStats.filter(
      (p) => p.sku.toLowerCase().includes(q) || p.name.toLowerCase().includes(q)
    )
  }, [productStats, searchQuery])

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-50 flex items-center gap-2">
            <Package className="w-6 h-6 text-brand-400" />
            Produkt-Analysen & Abnehmer-Intelligenz
          </h1>
          <p className="text-surface-400 text-sm mt-1">
            Klicke auf ein Produkt, um Abnehmer, meistverkaufte Städte & Kaufhistorie zu sehen.
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Art.-Nr. oder Name suchen..."
            className="input pl-9 py-2 text-xs bg-surface-900 border-surface-700 w-full"
          />
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden border border-surface-700/50 shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-surface-800/80 bg-surface-950/60 text-surface-400 font-semibold text-xs uppercase tracking-wider">
                <th className="px-4 py-3 w-10">#</th>
                <th className="px-4 py-3 w-28">Art.-Nr.</th>
                <th className="px-4 py-3">Produktbezeichnung</th>
                <th className="px-4 py-3 text-right">Verkaufte Menge</th>
                <th className="px-4 py-3 text-right">Umsatz 2026</th>
                <th className="px-4 py-3 text-right">VK-Preis</th>
                <th className="px-4 py-3 text-right">Lagerbestand</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-800/40">
              {filteredProducts.map((p, idx) => {
                const hasSales = p.revenue > 0
                return (
                  <tr
                    key={p.sku}
                    onClick={() => setSelectedProduct(p)}
                    className="hover:bg-brand-900/30 cursor-pointer transition-colors group"
                  >
                    <td className="px-4 py-3 text-xs text-surface-500 font-mono">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-bold text-brand-400 bg-brand-950/60 px-2 py-0.5 rounded border border-brand-800/40 group-hover:border-brand-500/80">
                        {p.sku}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-surface-100 group-hover:text-brand-300 flex items-center gap-2">
                      {p.name}
                      <Eye className="w-3.5 h-3.5 text-surface-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-bold text-surface-100">
                      {p.qtySold > 0 ? (
                        <span className="text-brand-400 font-mono">{p.qtySold} Stk.</span>
                      ) : (
                        <span className="text-surface-600">0 Stk.</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-bold">
                      {hasSales ? (
                        <span className="text-emerald-400 font-black">{formatCurrency(p.revenue)}</span>
                      ) : (
                        <span className="text-surface-600 text-xs">0,00 €</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-surface-200 tabular-nums">
                      {formatCurrency(p.selling_price)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-surface-300 tabular-nums">
                      {formatNumber(p.stock)} Stk.
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          sales={salesList}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  )
}

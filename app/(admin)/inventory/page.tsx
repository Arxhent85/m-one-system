import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Warehouse, ArrowRightLeft } from 'lucide-react'
import Link from 'next/link'
import InventoryView from '@/components/inventory/InventoryView'
import { MOCK_LOCATIONS, MOCK_PRODUCTS } from '@/lib/mockData'

export const metadata: Metadata = { title: 'Bestandsübersicht | M ONE ERP' }

export default async function InventoryPage() {
  const supabase = await createClient()

  const { data: dbLocations } = await supabase
    .from('locations')
    .select(`
      id, name, type, description,
      stock_items(
        quantity, min_stock,
        products(id, sku, name, unit, selling_price, purchase_price)
      )
    `)
    .order('name')

  // Fallback to mock data if empty
  const rawLocations = (dbLocations && dbLocations.length > 0)
    ? dbLocations
    : MOCK_LOCATIONS.map((loc, idx) => ({
        ...loc,
        stock_items: MOCK_PRODUCTS.map((p) => ({
          quantity: (idx + 1) * 20,
          min_stock: p.min_stock,
          products: p,
        })),
      }))

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-50 flex items-center gap-2">
            <Warehouse className="w-6 h-6 text-brand-400" />
            Bestandsübersicht
          </h1>
          <p className="text-surface-400 text-sm mt-1">
            Live-Bestände aller Standorte & Fahrzeuge im Überblick
          </p>
        </div>
        <Link href="/inventory/transfers" className="btn-primary">
          <ArrowRightLeft className="w-4 h-4" />
          Umlagerung
        </Link>
      </div>

      {/* Interactive Inventory View */}
      <InventoryView locations={rawLocations} />
    </div>
  )
}

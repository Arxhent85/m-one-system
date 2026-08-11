import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Truck } from 'lucide-react'
import VehicleStockView from '@/components/inventory/VehicleStockView'
import { MOCK_LOCATIONS, MOCK_PRODUCTS } from '@/lib/mockData'

export const metadata: Metadata = { title: 'Fahrzeug-Bestände | M ONE ERP' }

export default async function AnalyticsVehiclesPage() {
  const supabase = await createClient()

  const { data: dbLocations } = await supabase
    .from('locations')
    .select(`
      id, name, type,
      stock_items(
        quantity, min_stock,
        products(id, sku, name, unit, selling_price, purchase_price)
      )
    `)
    .order('name')

  // Fallback to MOCK if database returns empty
  const rawLocations = (dbLocations && dbLocations.length > 0)
    ? dbLocations
    : MOCK_LOCATIONS.map((loc, idx) => ({
        ...loc,
        stock_items: MOCK_PRODUCTS.map((p) => ({
          quantity: (idx + 1) * 12,
          min_stock: p.min_stock,
          products: p,
        })),
      }))

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-2xl font-bold text-surface-50 flex items-center gap-2">
          <Truck className="w-6 h-6 text-brand-400" />
          Fahrzeug-Bestände
        </h1>
        <p className="text-surface-400 text-sm mt-1">
          Interaktive Live-Übersicht aller Lieferfahrzeuge & Geladenen Bestände
        </p>
      </div>

      {/* Interactive Vehicle Selector & Sorting View */}
      <VehicleStockView locations={rawLocations} />
    </div>
  )
}

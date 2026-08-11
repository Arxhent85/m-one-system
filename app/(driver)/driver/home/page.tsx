import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Package, ShoppingCart, TrendingUp, ChevronRight, Truck } from 'lucide-react'
import { formatCurrency, formatNumber } from '@/lib/utils/currency'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Fahrer Terminal — Start' }

export default async function DriverHomePage() {
  const supabase = await createClient()

  // Real orders
  const { data: dbOrders } = await supabase
    .from('sales_orders')
    .select('*, customers(company_name)')
    .gte('created_at', new Date(new Date().setHours(0,0,0,0)).toISOString())
    .order('created_at', { ascending: false })

  // Real products
  const { data: dbProducts } = await supabase
    .from('products')
    .select('id, sku, name, unit, selling_price')
    .eq('is_active', true)
    .order('sku', { ascending: true })
    .limit(5)

  // Real vehicle location
  const { data: dbLocations } = await supabase
    .from('locations')
    .select('id, name, type')
    .eq('type', 'vehicle')
    .limit(1)

  const myOrders = dbOrders ?? []
  const myProducts = dbProducts ?? []
  const locationName = (dbLocations as any)?.[0]?.name ?? 'Fahrzeug 1 (Depo Mensuri)'
  const todayRevenue = myOrders.reduce((s: number, o: any) => s + (o.total_amount ?? 0), 0)

  return (
    <div className="p-4 space-y-4 animate-in max-w-lg mx-auto">
      {/* Begrüßung */}
      <div className="pt-2 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-surface-50">
            Fahrzeug Terminal
          </h1>
          <p className="text-emerald-400 text-xs flex items-center gap-1 font-semibold mt-0.5">
            <Truck className="w-3.5 h-3.5" /> {locationName}
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3">
        <div className="kpi-card">
          <TrendingUp className="w-5 h-5 text-brand-400" />
          <div>
            <p className="kpi-value text-xl">{formatCurrency(todayRevenue)}</p>
            <p className="kpi-label">Mein Umsatz heute</p>
          </div>
        </div>
        <div className="kpi-card">
          <ShoppingCart className="w-5 h-5 text-success-500" />
          <div>
            <p className="kpi-value text-xl">{formatNumber(myOrders.length)}</p>
            <p className="kpi-label">Erfasste Verkäufe</p>
          </div>
        </div>
      </div>

      {/* Mein Fahrzeug-Bestand */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-surface-100 flex items-center gap-2 text-sm">
            <Package className="w-4 h-4 text-brand-400" />
            Geladener Fahrzeug-Bestand
          </h2>
          <Link href="/driver/stock" className="text-xs text-brand-400 flex items-center gap-0.5 font-medium">
            Alle <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="space-y-3 divide-y divide-surface-800/40">
          {myProducts.length === 0 ? (
            <p className="text-xs text-surface-500 py-2">Keine Artikel auf diesem Fahrzeug geladen.</p>
          ) : (
            myProducts.map((product: any) => (
              <div key={product.id} className="pt-2.5 flex items-center justify-between first:pt-0">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-surface-100 truncate">{product.name}</p>
                  <p className="text-[10px] text-surface-500 font-mono">Art.-Nr. {product.sku}</p>
                </div>
                <div className="text-right ml-3 shrink-0">
                  <p className="text-xs font-bold text-surface-50 tabular-nums">
                    {formatCurrency(product.selling_price)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Action Button */}
      <Link
        href="/driver/sell"
        className="btn-primary w-full btn-lg justify-center shadow-glow"
      >
        <ShoppingCart className="w-5 h-5" />
        Direktverkauf an Kunden erfassen
      </Link>
    </div>
  )
}

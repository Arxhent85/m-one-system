import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ShoppingCart } from 'lucide-react'
import { formatCurrency, formatNumber } from '@/lib/utils/currency'
import OrdersListView from '@/components/orders/OrdersListView'
import MOCK_2026_SALES from '@/lib/mock2026Sales.json'

export const metadata: Metadata = { title: 'Verkäufe 2026 | M ONE ERP' }

export default async function OrdersPage() {
  const supabase = await createClient()

  const { data: dbOrders } = await supabase
    .from('sales_orders')
    .select('id, order_number, total_amount, status, payment_method, created_at, customers(company_name, customer_number), locations(name)')
    .order('created_at', { ascending: false })

  const orders = (dbOrders && dbOrders.length > 0) ? dbOrders : (MOCK_2026_SALES as any)
  const totalVolume = orders.reduce((s: number, o: any) => s + (o.total_amount ?? 0), 0)

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-50 flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-brand-400" />
            Verkäufe & Fakturen 2026
          </h1>
          <p className="text-surface-400 text-sm mt-1">
            {formatNumber(orders.length)} Fakturen · {formatCurrency(totalVolume)} Gesamtvolumen 2026
          </p>
        </div>
      </div>

      {/* Orders List View */}
      <OrdersListView orders={orders} />
    </div>
  )
}

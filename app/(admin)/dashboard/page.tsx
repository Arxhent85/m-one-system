import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import DashboardView from '@/components/dashboard/DashboardView'
import { MOCK_LOCATIONS } from '@/lib/mockData'
import MOCK_2026_SALES from '@/lib/mock2026Sales.json'

export const metadata: Metadata = { title: 'Dashboard | M ONE ERP' }

export default async function DashboardPage() {
  const supabase = await createClient()

  const [
    { data: dbOrders },
    { data: dbLocations },
  ] = await Promise.all([
    supabase
      .from('sales_orders')
      .select('id, order_number, total_amount, status, payment_method, created_at, customers(company_name, customer_number), locations(name)')
      .order('created_at', { ascending: false }),
    supabase.from('locations').select('*, stock_items(quantity)').eq('is_active', true),
  ])

  const OFFICIAL_LOCATION_IDS = [
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333'
  ]

  const rawLocations = (dbLocations && dbLocations.length > 0) ? dbLocations : MOCK_LOCATIONS

  const locations = rawLocations.filter((loc: any) =>
    OFFICIAL_LOCATION_IDS.includes(loc.id) ||
    loc.name.includes('M-ONE') ||
    loc.name.includes('Depo Mensuri') ||
    loc.name.includes('Depo Qerimi')
  )

  const orders = (dbOrders && dbOrders.length > 0) ? dbOrders : (MOCK_2026_SALES as any)

  return <DashboardView initialOrders={orders} locations={locations} />
}

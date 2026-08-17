import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import DriverApp from './DriverApp'
import MOCK_CUSTOMERS from '@/lib/mockCustomers.json'

export const metadata: Metadata = { title: 'Fahrer App' }

interface PageProps {
  searchParams?: Promise<{ driver?: string }>
}

export default async function DriverSellPage({ searchParams }: PageProps) {
  const resolvedParams = searchParams ? await searchParams : {}
  const driverParam = resolvedParams?.driver ?? 'mensuri'

  const supabase = await createClient()

  // Real customers from Supabase or fallback
  const { data: dbCustomers } = await supabase
    .from('customers')
    .select('id, customer_number, company_name, city, notes')
    .eq('is_active', true)
    .limit(1000)

  let mappedCustomers: any[] = []

  if (dbCustomers && dbCustomers.length > 0) {
    mappedCustomers = dbCustomers.map((c: any) => {
      const match = c.notes?.match(/Kundennr:\s*(\d+)/i)
      const custNo = c.customer_number || (match ? match[1] : '0')
      return {
        id: c.id,
        customer_number: custNo,
        company_name: c.company_name,
        city: c.city ?? '',
      }
    })
  }

  if (mappedCustomers.length === 0) {
    mappedCustomers = (MOCK_CUSTOMERS as any[]).map((c) => ({
      id: `cust-${c.customer_number}`,
      customer_number: c.customer_number,
      company_name: c.company_name,
      city: c.city,
    }))
  }

  const driverPrefix = driverParam === 'qerimi' ? '1' : '2'
  const driverName = driverParam === 'qerimi' ? 'Qerimi' : 'Mensuri'

  return (
    <DriverApp
      driverName={driverName}
      driverPrefix={driverPrefix}
      customers={mappedCustomers}
    />
  )
}

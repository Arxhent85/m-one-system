import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Users, Plus } from 'lucide-react'
import Link from 'next/link'
import CustomerListView, { CustomerItem } from '@/components/customers/CustomerListView'
import MOCK_CUSTOMERS from '@/lib/mockCustomers.json'

export const metadata: Metadata = { title: 'Kundenkartei | M ONE ERP' }

export default async function CustomersPage() {
  let fetchedCustomers: CustomerItem[] = []

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('customers')
      .select('id, customer_number, company_name, city, phone, customer_type, notes, is_active')
      .eq('is_active', true)
      .order('customer_number', { ascending: true })

    if (data && data.length > 0) {
      fetchedCustomers = data
    }
  } catch (e) {
    console.error('Error fetching customers from Supabase:', e)
  }

  // Official customers from 'KUNDENLISTE new.xlsx' (799 customers)
  const safeCustomers: CustomerItem[] = fetchedCustomers.length > 0 
    ? fetchedCustomers 
    : (MOCK_CUSTOMERS as CustomerItem[])

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-50 flex items-center gap-2">
            <Users className="w-6 h-6 text-brand-400" />
            Kundenkartei 2026
          </h1>
          <p className="text-surface-400 text-sm mt-1">
            {safeCustomers.length} registrierte Kunden mit eigener Kundennummer (Kd.-Nr.)
          </p>
        </div>
        <Link href="/customers/new" className="btn-primary">
          <Plus className="w-4 h-4" />
          Neuer Kunde
        </Link>
      </div>

      {/* Interactive Customer List View */}
      <CustomerListView customers={safeCustomers} />
    </div>
  )
}

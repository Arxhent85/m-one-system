import type { Metadata } from 'next'
import CustomerAnalyticsView from '@/components/analytics/CustomerAnalyticsView'

export const metadata: Metadata = { title: 'Kunden-Analysen & Intelligenz | M ONE ERP' }

export default function AnalyticsCustomersPage() {
  return <CustomerAnalyticsView />
}

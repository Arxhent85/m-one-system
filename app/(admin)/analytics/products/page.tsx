import type { Metadata } from 'next'
import ProductAnalyticsView from '@/components/analytics/ProductAnalyticsView'

export const metadata: Metadata = { title: 'Produkt-Analysen | M ONE ERP' }

export default function AnalyticsProductsPage() {
  return <ProductAnalyticsView />
}

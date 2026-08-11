import type { Metadata } from 'next'
import AnalyticsView from '@/components/analytics/AnalyticsView'

export const metadata: Metadata = { title: 'Analysen & Auswertungen | M ONE ERP' }

export default function AnalyticsPage() {
  return <AnalyticsView />
}

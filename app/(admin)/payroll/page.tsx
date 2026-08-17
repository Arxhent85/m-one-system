import type { Metadata } from 'next'
import PayrollView from '@/components/payroll/PayrollView'

export const metadata: Metadata = {
  title: 'Lohn & Fahrer-Provision | M ONE ERP',
  description: 'Monatliche Lohn- und Provisionsabrechnung für Fahrer Mensuri und Qerimi',
}

export default function PayrollPage() {
  return <PayrollView />
}

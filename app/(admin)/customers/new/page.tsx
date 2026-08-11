import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Users } from 'lucide-react'
import CustomerForm from '@/components/customers/CustomerForm'
import CsvImporter from '@/components/import/CsvImporter'

export const metadata: Metadata = { title: 'Neuer Kunde / Import' }

export default function NewCustomerPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in">
      {/* Back Link */}
      <div>
        <Link href="/customers" className="text-xs text-surface-400 hover:text-surface-200 flex items-center gap-1 mb-2">
          <ArrowLeft className="w-3.5 h-3.5" /> Zurück zu Kunden
        </Link>
        <h1 className="text-2xl font-bold text-surface-50 flex items-center gap-2">
          <Users className="w-6 h-6 text-brand-400" />
          Kunde anlegen / Kundenliste importieren
        </h1>
        <p className="text-surface-400 text-sm mt-1">
          Einzelnen Kunden erfassen oder komplette Kundenkartei als CSV hochladen
        </p>
      </div>

      {/* CSV Importer */}
      <CsvImporter type="customers" />

      {/* Einzel-Formular */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-bold text-surface-100 mb-4 border-b border-surface-700/50 pb-3">
          Einzelnen Kunden manuell anlegen
        </h2>
        <CustomerForm />
      </div>
    </div>
  )
}

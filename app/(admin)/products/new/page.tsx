import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Package } from 'lucide-react'
import ProductForm from '@/components/products/ProductForm'
import CsvImporter from '@/components/import/CsvImporter'

export const metadata: Metadata = { title: 'Neues Produkt / Import' }

export default function NewProductPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in">
      {/* Back Link */}
      <div>
        <Link href="/products" className="text-xs text-surface-400 hover:text-surface-200 flex items-center gap-1 mb-2">
          <ArrowLeft className="w-3.5 h-3.5" /> Zurück zu Produkten
        </Link>
        <h1 className="text-2xl font-bold text-surface-50 flex items-center gap-2">
          <Package className="w-6 h-6 text-brand-400" />
          Produkt anlegen / Preisliste importieren
        </h1>
        <p className="text-surface-400 text-sm mt-1">
          Einzelnes Produkt manuell erfassen oder ganze Preisliste als CSV importieren
        </p>
      </div>

      {/* CSV Importer */}
      <CsvImporter type="products" />

      {/* Einzel-Formular */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-bold text-surface-100 mb-4 border-b border-surface-700/50 pb-3">
          Einzelnes Produkt manuell anlegen
        </h2>
        <ProductForm />
      </div>
    </div>
  )
}

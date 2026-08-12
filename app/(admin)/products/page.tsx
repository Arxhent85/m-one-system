import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import ProductsClientView from '@/components/products/ProductsClientView'

export const metadata: Metadata = { title: 'Produktkatalog & Preisverwaltung | M ONE ERP' }

export default async function ProductsPage() {
  const supabase = await createClient()

  const { data: dbProducts } = await supabase
    .from('products')
    .select('id, sku, name, unit, purchase_price, selling_price, is_active')
    .eq('is_active', true)
    .order('sku', { ascending: true })

  return <ProductsClientView initialProducts={dbProducts ?? []} />
}

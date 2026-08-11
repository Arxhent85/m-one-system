'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  createProductSchema,
  updateProductSchema,
  type CreateProductInput,
  type UpdateProductInput,
  type ApiResponse,
} from '@/lib/types'
import type { Product } from '@/lib/supabase/database.types'

/**
 * Produkt erstellen
 */
export async function createProduct(
  input: CreateProductInput
): Promise<ApiResponse<Product>> {
  try {
    const validated = createProductSchema.parse(input)
    const supabase  = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    const { data, error } = await supabase
      .from('products')
      .insert(validated)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: `SKU "${validated.sku}" ist bereits vergeben` }
      }
      return { success: false, error: error.message }
    }

    revalidatePath('/products')
    revalidatePath('/inventory')
    return { success: true, data }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: 'Unbekannter Fehler' }
  }
}

/**
 * Produkt aktualisieren
 */
export async function updateProduct(
  id: string,
  input: UpdateProductInput
): Promise<ApiResponse<Product>> {
  try {
    const validated = updateProductSchema.parse(input)
    const supabase  = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    const { data, error } = await supabase
      .from('products')
      .update({ ...validated, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) return { success: false, error: error.message }
    if (!data)  return { success: false, error: 'Produkt nicht gefunden' }

    revalidatePath('/products')
    revalidatePath(`/products/${id}`)
    revalidatePath('/inventory')
    return { success: true, data }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: 'Unbekannter Fehler' }
  }
}

/**
 * Produkt (de)aktivieren
 */
export async function toggleProductActive(
  id: string,
  isActive: boolean
): Promise<ApiResponse<Product>> {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    const { data, error } = await supabase
      .from('products')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    revalidatePath('/products')
    return { success: true, data: data! }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: 'Unbekannter Fehler' }
  }
}

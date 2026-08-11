'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  createCustomerSchema,
  addCustomerLogSchema,
  type CreateCustomerInput,
  type AddCustomerLogInput,
  type ApiResponse,
} from '@/lib/types'
import type { Customer } from '@/lib/supabase/database.types'

/**
 * Neuen Kunden anlegen
 */
export async function createCustomer(
  input: CreateCustomerInput
): Promise<ApiResponse<Customer>> {
  try {
    const validated = createCustomerSchema.parse(input)
    const supabase  = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    const { data, error } = await supabase
      .from('customers')
      .insert(validated)
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    // Customer-Log: Erster Eintrag
    await supabase.from('customer_logs').insert({
      customer_id:  data.id,
      action_type:  'note',
      description:  'Kunde angelegt',
      user_id:      user.id,
    })

    revalidatePath('/customers')
    return { success: true, data }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: 'Unbekannter Fehler' }
  }
}

/**
 * Kunden aktualisieren
 */
export async function updateCustomer(
  id: string,
  input: Partial<CreateCustomerInput>
): Promise<ApiResponse<Customer>> {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    const { data, error } = await supabase
      .from('customers')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    revalidatePath('/customers')
    revalidatePath(`/customers/${id}`)
    return { success: true, data: data! }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: 'Unbekannter Fehler' }
  }
}

/**
 * Aktivitäts-Eintrag für Kunden hinzufügen
 */
export async function addCustomerLog(
  input: AddCustomerLogInput
): Promise<ApiResponse<void>> {
  try {
    const validated = addCustomerLogSchema.parse(input)
    const supabase  = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    const { error } = await supabase.from('customer_logs').insert({
      ...validated,
      user_id: user.id,
    })

    if (error) return { success: false, error: error.message }

    revalidatePath(`/customers/${validated.customer_id}`)
    return { success: true }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: 'Unbekannter Fehler' }
  }
}

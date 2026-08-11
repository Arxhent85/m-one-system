'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  createSalesOrderSchema,
  type CreateSalesOrderInput,
  type ApiResponse,
} from '@/lib/types'
import { calcOrderTotals } from '@/lib/utils/currency'
import type { SalesOrder } from '@/lib/supabase/database.types'

/**
 * Verkaufsauftrag erstellen (als Draft — kein Bestandsabzug!)
 * Bestand wird erst beim Bestätigen (confirmSalesOrder) abgebucht.
 */
export async function createSalesOrder(
  input: CreateSalesOrderInput
): Promise<ApiResponse<SalesOrder>> {
  try {
    const validated = createSalesOrderSchema.parse(input)
    const supabase  = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    // Kundenkontingent lesen (falls Stammkunde mit Rabatt)
    let customerDiscount = 0
    if (validated.customer_id) {
      const { data: customer } = await supabase
        .from('customers')
        .select('discount_pct')
        .eq('id', validated.customer_id)
        .single()
      customerDiscount = customer?.discount_pct ?? 0
    }

    // Summen berechnen
    const totals = calcOrderTotals(
      validated.items,
      validated.tax_rate,
      customerDiscount
    )

    // Auftrag anlegen
    const { data: order, error: orderError } = await supabase
      .from('sales_orders')
      .insert({
        customer_id:      validated.customer_id ?? null,
        location_id:      validated.location_id,
        user_id:          user.id,
        payment_method:   validated.payment_method ?? null,
        notes:            validated.notes ?? null,
        delivery_address: validated.delivery_address ?? null,
        due_date:         validated.due_date ?? null,
        tax_rate:         validated.tax_rate,
        ...totals,
      })
      .select()
      .single()

    if (orderError || !order) {
      return { success: false, error: orderError?.message ?? 'Fehler beim Erstellen' }
    }

    // Positionen anlegen
    const items = validated.items.map((item) => {
      const lineTotal   = item.quantity * item.unit_price
      const discounted  = lineTotal * (1 - item.discount_pct / 100)
      return {
        sales_order_id: order.id,
        product_id:     item.product_id,
        quantity:       item.quantity,
        unit_price:     item.unit_price,
        discount_pct:   item.discount_pct,
        total_price:    Math.round(discounted * 100) / 100,
      }
    })

    const { error: itemsError } = await supabase
      .from('sales_order_items')
      .insert(items)

    if (itemsError) {
      await supabase.from('sales_orders').delete().eq('id', order.id)
      return { success: false, error: itemsError.message }
    }

    revalidatePath('/orders')
    revalidatePath('/driver/sell')
    return { success: true, data: order }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: 'Unbekannter Fehler' }
  }
}

/**
 * Verkaufsauftrag bestätigen — Atomare Lagerbuchung via PostgreSQL RPC
 * Bucht alle Positionen in einer DB-Transaktion aus dem Standort-Bestand ab.
 */
export async function confirmSalesOrder(
  orderId: string
): Promise<ApiResponse<{ order_id: string; order_number: string }>> {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    const { data, error } = await supabase.rpc('confirm_sales_order', {
      p_order_id: orderId,
      p_user_id:  user.id,
    })

    if (error) return { success: false, error: error.message }

    const result = data as {
      success: boolean
      error?: string
      order_id?: string
      order_number?: string
      items_processed?: number
    }

    if (!result.success) {
      return { success: false, error: result.error ?? 'Buchung fehlgeschlagen' }
    }

    revalidatePath('/orders')
    revalidatePath(`/orders/${orderId}`)
    revalidatePath('/inventory')
    revalidatePath('/driver/sell')
    revalidatePath('/driver/stock')
    return {
      success: true,
      data: {
        order_id:     result.order_id!,
        order_number: result.order_number!,
      },
    }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: 'Unbekannter Fehler' }
  }
}

/**
 * Zahlungsstatus aktualisieren
 */
export async function updatePaymentStatus(
  orderId: string,
  paymentStatus: 'pending' | 'paid' | 'partial' | 'overdue'
): Promise<ApiResponse<void>> {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    const { error } = await supabase
      .from('sales_orders')
      .update({ payment_status: paymentStatus, updated_at: new Date().toISOString() })
      .eq('id', orderId)

    if (error) return { success: false, error: error.message }

    revalidatePath('/orders')
    revalidatePath(`/orders/${orderId}`)
    return { success: true }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: 'Unbekannter Fehler' }
  }
}

/**
 * Auftrag stornieren
 */
export async function cancelSalesOrder(orderId: string): Promise<ApiResponse<void>> {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    const { error } = await supabase
      .from('sales_orders')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .eq('status', 'draft') // Nur Draft-Aufträge können storniert werden

    if (error) return { success: false, error: error.message }

    revalidatePath('/orders')
    return { success: true }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: 'Unbekannter Fehler' }
  }
}

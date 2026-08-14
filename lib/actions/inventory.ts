'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  createTransferSchema,
  type CreateTransferInput,
  type ApiResponse,
} from '@/lib/types'
import type { StockTransfer } from '@/lib/supabase/database.types'

/**
 * Neuen Umlagerungs-Beleg erstellen (als Draft)
 */
export async function createStockTransfer(
  input: CreateTransferInput
): Promise<ApiResponse<StockTransfer>> {
  try {
    const validated = createTransferSchema.parse(input)
    const supabase  = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    // Transfer-Header anlegen
    const { data: transfer, error: transferError } = await (supabase as any)
      .from('stock_transfers')
      .insert({
        from_location_id: validated.from_location_id,
        to_location_id:   validated.to_location_id,
        notes:            validated.notes,
        user_id:          user.id,
      })
      .select()
      .single()

    if (transferError || !transfer) {
      return { success: false, error: transferError?.message ?? 'Fehler beim Erstellen' }
    }

    // Transfer-Positionen anlegen
    const items = validated.items.map((item) => ({
      stock_transfer_id: transfer.id,
      product_id:        item.product_id,
      quantity:          item.quantity,
    }))

    const { error: itemsError } = await (supabase as any)
      .from('stock_transfer_items')
      .insert(items)

    if (itemsError) {
      // Transfer löschen wenn Positionen fehlschlagen
      await (supabase as any).from('stock_transfers').delete().eq('id', transfer.id)
      return { success: false, error: itemsError.message }
    }

    revalidatePath('/inventory')
    revalidatePath('/inventory/transfers')
    return { success: true, data: transfer }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: 'Unbekannter Fehler' }
  }
}

/**
 * Umlagerung bestätigen — Atomare Buchung via PostgreSQL RPC
 * Löst in einer DB-Transaktion aus: Bestand abbuchen + Bestand zubuchen + Ledger-Einträge
 */
export async function confirmStockTransfer(
  transferId: string
): Promise<ApiResponse<{ transfer_id: string; items_processed: number }>> {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    const { data, error } = await (supabase as any).rpc('confirm_stock_transfer', {
      p_transfer_id: transferId,
      p_user_id:     user.id,
    })

    if (error) return { success: false, error: error.message }

    const result = data as { success: boolean; error?: string; transfer_id?: string; items_processed?: number }

    if (!result.success) {
      return { success: false, error: result.error ?? 'Buchung fehlgeschlagen' }
    }

    revalidatePath('/inventory')
    revalidatePath('/inventory/transfers')
    revalidatePath('/driver/stock')
    return {
      success: true,
      data: {
        transfer_id:     result.transfer_id!,
        items_processed: result.items_processed!,
      },
    }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: 'Unbekannter Fehler' }
  }
}

/**
 * Umlagerung stornieren
 */
export async function cancelStockTransfer(
  transferId: string
): Promise<ApiResponse<void>> {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Nicht authentifiziert' }

    const { error } = await (supabase as any)
      .from('stock_transfers')
      .update({
        status:       'cancelled',
        cancelled_at: new Date().toISOString(),
      })
      .eq('id', transferId)
      .eq('status', 'draft') // Nur Drafts können storniert werden

    if (error) return { success: false, error: error.message }

    revalidatePath('/inventory/transfers')
    return { success: true }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: 'Unbekannter Fehler' }
  }
}

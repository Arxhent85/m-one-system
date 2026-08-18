import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { INITIAL_DEMO_EXPENSES, type ExpenseEntry } from '@/lib/expenseStore'

// In-memory / server-side expense registry for cross-device sync
let globalServerExpenses: ExpenseEntry[] = [...INITIAL_DEMO_EXPENSES]

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: dbExpenses, error } = await supabase
      .from('expenses' as any)
      .select('*')
      .order('date', { ascending: false })

    if (!error && dbExpenses && dbExpenses.length > 0) {
      globalServerExpenses = dbExpenses as any
    }
  } catch (e) {
    // Fallback to server memory
  }

  return NextResponse.json({
    success: true,
    expenses: globalServerExpenses,
  })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // Handle Delete Action
    if (body.action === 'delete') {
      const { expenseId } = body
      globalServerExpenses = globalServerExpenses.filter((e) => e.id !== expenseId)

      try {
        const supabase = await createClient()
        await supabase.from('expenses' as any).delete().eq('id', expenseId)
      } catch (dbErr) {}

      return NextResponse.json({ success: true, deletedId: expenseId })
    }

    // Handle Save / Update Action
    const { expense } = body
    if (!expense || !expense.title || !expense.amount) {
      return NextResponse.json({ success: false, error: 'Ungültige Ausgabendaten' }, { status: 400 })
    }

    const idx = globalServerExpenses.findIndex((e) => e.id === expense.id)
    if (idx >= 0) {
      globalServerExpenses[idx] = { ...expense, updated_at: new Date().toISOString() }
    } else {
      globalServerExpenses = [{ ...expense, updated_at: new Date().toISOString() }, ...globalServerExpenses]
    }

    // Try persisting to Supabase if table exists
    try {
      const supabase = await createClient()
      await supabase.from('expenses' as any).upsert({
        id: expense.id,
        title: expense.title,
        category: expense.category,
        amount: expense.amount,
        date: expense.date,
        month: expense.month,
        vehicle_id: expense.vehicleId,
        driver_name: expense.driverName,
        fuel_liters: expense.fuelLiters,
        mileage: expense.mileage,
        receipt_image: expense.receiptImage,
        is_automatic: expense.isAutomatic,
        status: expense.status,
        notes: expense.notes,
        tax_reference: expense.taxReference,
        updated_at: new Date().toISOString(),
      } as any)
    } catch (dbErr) {}

    return NextResponse.json({
      success: true,
      expense,
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

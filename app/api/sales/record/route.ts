import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { LOCATION_IDS, INITIAL_DEPO_PRODUCTS, INITIAL_MENSURI_STOCK, INITIAL_QERIMI_STOCK } from '@/lib/stockStore'
import MOCK_2026_SALES from '@/lib/mock2026Sales.json'

// Shared in-memory / fallback store for cross-device sync
let globalServerSales: any[] = [...MOCK_2026_SALES]
let globalServerStockMap: Record<string, Record<string, number>> = {
  [LOCATION_IDS.DEPOT]: INITIAL_DEPO_PRODUCTS.reduce((acc, p) => ({ ...acc, [p.sku]: p.stock }), {}),
  [LOCATION_IDS.MENSURI]: { ...INITIAL_MENSURI_STOCK },
  [LOCATION_IDS.QERIMI]: { ...INITIAL_QERIMI_STOCK },
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // Special action: Load 2026 demo dataset
    if (body.action === 'load_2026_demo') {
      globalServerSales = [...MOCK_2026_SALES]
      return NextResponse.json({
        success: true,
        message: '2026 Echtdaten erfolgreich geladen.',
        salesCount: globalServerSales.length,
        sales: globalServerSales,
        stockMap: globalServerStockMap,
      })
    }

    const {
      driverName = 'Mensuri',
      driverPrefix = '2',
      customerNumber = '—',
      customerName = 'Kunde',
      items = [] as { sku: string; name: string; qty: number; unit_price: number }[],
      paymentMethod = 'bar',
      total = 0,
    } = body

    const vehicleLocId = driverPrefix === '2' ? LOCATION_IDS.MENSURI : LOCATION_IDS.QERIMI
    const vehicleLocName = driverPrefix === '2' ? 'Fahrzeug 1 (Depo Mensuri)' : 'Fahrzeug 2 (Depo Qerimi)'
    const nextNum = (globalServerSales.length + 1).toString().padStart(4, '0')
    const orderNumber = `FK-2026-${nextNum}`

    // 1. Update in-memory global stock map on server
    if (!globalServerStockMap[vehicleLocId]) {
      globalServerStockMap[vehicleLocId] = {}
    }

    items.forEach((it) => {
      const curr = globalServerStockMap[vehicleLocId][it.sku] ?? 0
      globalServerStockMap[vehicleLocId][it.sku] = Math.max(0, curr - it.qty)
    })

    // 2. Record sale
    const saleEntry = {
      id: `sale-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      order_number: orderNumber,
      driver_name: driverName,
      vehicle_location_id: vehicleLocId,
      vehicle_location_name: vehicleLocName,
      customer_number: customerNumber,
      customer_name: customerName,
      items: items.map((i) => ({ ...i, total: i.qty * i.unit_price })),
      items_count: items.length,
      total_amount: total || items.reduce((s, i) => s + i.qty * i.unit_price, 0),
      payment_method: paymentMethod,
      created_at: new Date().toISOString(),
    }

    globalServerSales.unshift(saleEntry)

    // 3. Persist to Supabase if connected (Fire-and-forget in background, non-blocking)
    createClient()
      .then((supabase) => {
        const paymentMap: Record<string, string> = { bar: 'cash', rechnung: 'invoice', karte: 'card' }
        const itemsSummary = items.map((i) => `${i.qty}x ${i.sku} ${i.name}`).join(', ')
        return (supabase.from('sales_orders') as any).insert({
          order_number: orderNumber,
          location_id: vehicleLocId,
          total_amount: saleEntry.total_amount,
          payment_method: paymentMap[paymentMethod] || 'cash',
          payment_status: paymentMethod === 'bar' ? 'paid' : 'pending',
          status: 'confirmed',
          notes: `Fahrer-App Verkauf | Fahrer ${driverName} | Kd. ${customerNumber} (${customerName}) | ${itemsSummary}`,
        })
      })
      .catch((dbErr) => console.warn('Supabase insert warning:', dbErr))

    return NextResponse.json({
      success: true,
      sale: saleEntry,
      stockMap: globalServerStockMap,
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Fehler beim Buchen' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    sales: globalServerSales,
    stockMap: globalServerStockMap,
  })
}

export async function DELETE() {
  globalServerSales = []
  globalServerStockMap = {
    [LOCATION_IDS.DEPOT]: INITIAL_DEPO_PRODUCTS.reduce((acc, p) => ({ ...acc, [p.sku]: p.stock }), {}),
    [LOCATION_IDS.MENSURI]: { ...INITIAL_MENSURI_STOCK },
    [LOCATION_IDS.QERIMI]: { ...INITIAL_QERIMI_STOCK },
  }

  try {
    const supabase = await createClient()
    await (supabase.from('sales_orders') as any).delete().neq('id', '00000000-0000-0000-0000-000000000000')
  } catch (err) {
    console.warn('Supabase reset warning:', err)
  }

  return NextResponse.json({
    success: true,
    message: 'System-Reset erfolgreich durchgeführt.',
    sales: globalServerSales,
    stockMap: globalServerStockMap,
  })
}

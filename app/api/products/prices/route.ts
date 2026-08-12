import { NextResponse } from 'next/server'

let globalServerPrices: Record<string, number> = {}

export async function GET() {
  return NextResponse.json({
    success: true,
    prices: globalServerPrices,
  })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    if (body.prices && typeof body.prices === 'object') {
      globalServerPrices = { ...globalServerPrices, ...body.prices }
    }
    return NextResponse.json({
      success: true,
      prices: globalServerPrices,
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Fehler beim Speichern' }, { status: 500 })
  }
}

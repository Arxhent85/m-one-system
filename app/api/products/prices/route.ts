import { NextResponse } from 'next/server'

const DEFAULT_MASTER_PRICES: Record<string, number> = {
  "11000": 8.0,
  "12000": 9.0,
  "12001": 2.5,
  "16936": 3.5,
  "17101": 3.1,
  "17510": 3.1,
  "20000": 1.8,
  "20001": 1.8,
  "20014": 8.0,
  "26736": 2.0,
  "28022": 4.0,
  "28101": 4.0,
  "29801": 20.0,
  "29802": 1.7,
  "30275": 1.8,
  "30276": 1.8,
  "30277": 2.5,
  "31812": 2.5,
  "31815": 2.5,
  "31818": 2.5,
  "31819": 2.5,
  "31822": 2.5,
  "31824": 2.5,
  "31827": 2.5,
  "31828": 3.5,
  "31829": 3.5,
  "31880": 3.5,
  "31903": 3.8,
  "35108": 4.0,
  "35109": 4.0,
  "35110": 4.0,
  "35111": 4.0,
  "35112": 4.0,
  "35113": 4.0,
  "35114": 4.0,
  "35115": 4.0,
  "35119": 4.0,
  "35121": 4.0,
  "35125": 4.0,
  "35128": 4.0,
  "37112": 4.0,
  "38136": 3.5,
  "39505": 3.0,
  "44001": 3.5,
  "49644": 2.0,
  "50912": 8.0,
  "51611": 1.25,
  "51612": 2.3,
  "51736": 2.5,
  "51936": 2.5,
  "54412": 2.0,
  "55718": 3.5,
  "56117": 4.0,
  "66701": 5.8,
  "66762": 9.0,
  "69236": 3.0,
  "72101": 4.2
}

let globalServerPrices: Record<string, number> = { ...DEFAULT_MASTER_PRICES }

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

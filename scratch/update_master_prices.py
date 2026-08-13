import re

master_prices = {
  "11000": 8.00,
  "12000": 9.00,
  "12001": 2.50,
  "16936": 3.50,
  "17101": 3.10,
  "17510": 3.10,
  "20000": 1.80,
  "20001": 1.80,
  "20014": 8.00,
  "26736": 3.50,
  "28022": 4.00,
  "28101": 4.00,
  "29801": 20.00,
  "29802": 1.70,
  "30275": 1.80,
  "30276": 1.80,
  "30277": 2.50,
  "31812": 2.50,
  "31815": 2.50,
  "31818": 2.50,
  "31819": 2.50,
  "31822": 2.50,
  "31824": 2.50,
  "31827": 2.50,
  "31828": 3.50,
  "31829": 3.50,
  "31880": 3.50,
  "31903": 3.80,
  "35108": 4.00,
  "35109": 4.00,
  "35110": 4.00,
  "35111": 4.00,
  "35112": 4.00,
  "35113": 4.00,
  "35114": 4.00,
  "35115": 4.00,
  "35119": 4.00,
  "35121": 4.00,
  "35125": 4.00,
  "35128": 4.00,
  "37112": 4.00,
  "38136": 3.50,
  "39505": 3.00,
  "44001": 3.50,
  "49644": 2.00,
  "50912": 8.00,
  "51611": 1.25,
  "51612": 2.30,
  "51736": 2.50,
  "51936": 2.50,
  "54412": 2.00,
  "55718": 3.50,
  "56117": 4.00,
  "66701": 5.80,
  "66762": 9.00,
  "69236": 3.00,
  "72101": 4.20
}

# Update lib/stockStore.ts
stock_store_path = r'D:\M ONE SYSTEM APP\lib\stockStore.ts'
with open(stock_store_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace selling_price for each SKU in INITIAL_DEPO_PRODUCTS
for sku, price in master_prices.items():
    formatted_price = f"{price:.2f}"
    pattern = rf"({{ id: 'p-{sku}'.*?selling_price: )\d+\.\d+"
    content = re.sub(pattern, rf"\g<1>{formatted_price}", content)

with open(stock_store_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated lib/stockStore.ts successfully.")

# Update app/api/products/prices/route.ts
prices_route_path = r'D:\M ONE SYSTEM APP\app\api\products\prices\route.ts'
import json

route_code = f'''import {{ NextResponse }} from 'next/server'

const DEFAULT_MASTER_PRICES: Record<string, number> = {json.dumps(master_prices, indent=2)}

let globalServerPrices: Record<string, number> = {{ ...DEFAULT_MASTER_PRICES }}

export async function GET() {{
  return NextResponse.json({{
    success: true,
    prices: globalServerPrices,
  }})
}}

export async function POST(req: Request) {{
  try {{
    const body = await req.json()
    if (body.prices && typeof body.prices === 'object') {{
      globalServerPrices = {{ ...globalServerPrices, ...body.prices }}
    }}
    return NextResponse.json({{
      success: true,
      prices: globalServerPrices,
    }})
  }} catch (err: any) {{
    return NextResponse.json({{ success: false, error: err?.message || 'Fehler beim Speichern' }}, {{ status: 500 }})
  }}
}}
'''

with open(prices_route_path, 'w', encoding='utf-8') as f:
    f.write(route_code)

print("Updated app/api/products/prices/route.ts successfully.")

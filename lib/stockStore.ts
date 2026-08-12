// ============================================================
// M ONE ERP — ZENTRALER BESTANDS- & UMLAGERUNGS-STORE (LIVE)
// Daten: DEPO M ONE 1.xlsx / MENSURI DEPO 1.xlsx / QERIMI DEPO 1.xlsx
// Stand: 2026-08-07
// ============================================================

import MOCK_2026_SALES from '@/lib/mock2026Sales.json'

export interface ProductStockInfo {
  id: string
  sku: string
  name: string
  stock: number // Bestand im Hauptlager (Ausgangsbasis)
  unit: string
  purchase_price: number
  selling_price: number
}

export interface StockTransferRecord {
  id: string
  transfer_number: string
  from_location_id: string
  from_location_name: string
  to_location_id: string
  to_location_name: string
  items: { sku: string; name: string; qty: number }[]
  items_count: number
  notes: string
  created_at: string
  status: string
}

export interface SaleRecord {
  id: string
  order_number: string
  driver_name: string
  vehicle_location_id: string
  vehicle_location_name: string
  customer_number: string
  customer_name: string
  items: { sku: string; name: string; qty: number; unit_price: number; total: number }[]
  items_count: number
  subtotal: number
  discount_pct: number
  total_amount: number
  payment_method: 'cash' | 'card' | 'invoice'
  created_at: string
}

// ──────────────────────────────────────────────────────────────────────────────
// OFFIZIELLES PRODUKTSORTIMENT (alle Produkte die in irgendeinem Lager existieren)
// Sortiert nach SKU aufsteigend
// ──────────────────────────────────────────────────────────────────────────────
export const INITIAL_DEPO_PRODUCTS: ProductStockInfo[] = [
  // ── Reiniger / Autowäsche ──────────────────────────────────────────────────
  // Shumice-Preise aus ÇMIMORE 2026 Preisliste (Spalte: Shumice)
  { id: 'p-11000', sku: '11000', name: 'Bodenreiniger 4 Ltr',              stock: 14,   unit: 'cope', purchase_price: 1.50, selling_price: 8.00 },
  { id: 'p-16936', sku: '16936', name: 'FELGENSILBER 400 ML',               stock: 40,   unit: 'cope', purchase_price: 1.50, selling_price: 3.50 },
  { id: 'p-17101', sku: '17101', name: 'KÜHLERREINIGER 400 ML',             stock: 300,  unit: 'cope', purchase_price: 1.20, selling_price: 3.10 },
  { id: 'p-26736', sku: '26736', name: 'HAFTGRUND 400 ml',                  stock: 209,  unit: 'cope', purchase_price: 1.50, selling_price: 3.50 },
  { id: 'p-30276', sku: '30276', name: 'Bio Blic Antikalk 750 ml',          stock: 13,   unit: 'cope', purchase_price: 2.50, selling_price: 1.80 },

  // ── Lack-Sprays ────────────────────────────────────────────────────────────
  { id: 'p-31812', sku: '31812', name: 'M-ONE LACK GELB',                   stock: 272,  unit: 'cope', purchase_price: 1.50, selling_price: 3.50 },
  { id: 'p-31815', sku: '31815', name: 'M-ONE LACK HELLGRAU',               stock: 313,  unit: 'cope', purchase_price: 1.50, selling_price: 3.50 },
  { id: 'p-31818', sku: '31818', name: 'M ONE LACK ANTHRAZIT 400 ML',       stock: 3,    unit: 'cope', purchase_price: 1.50, selling_price: 3.50 },
  { id: 'p-31819', sku: '31819', name: 'LACK FUERROT 400 ML',               stock: 1601, unit: 'cope', purchase_price: 1.50, selling_price: 3.50 },
  { id: 'p-31822', sku: '31822', name: 'M-ONE GOLD SPRAY',                  stock: 367,  unit: 'cope', purchase_price: 2.00, selling_price: 3.50 },
  { id: 'p-31824', sku: '31824', name: 'M-ONE LACK BRAUN',                  stock: 417,  unit: 'cope', purchase_price: 1.50, selling_price: 3.50 },
  { id: 'p-31827', sku: '31827', name: 'M-ONE LACK GRUN',                   stock: 292,  unit: 'cope', purchase_price: 1.50, selling_price: 3.50 },
  { id: 'p-31880', sku: '31880', name: 'HAT LACK SCHWARZ 690°C 400 ML',    stock: 1445, unit: 'cope', purchase_price: 1.50, selling_price: 5.50 },
  { id: 'p-31903', sku: '31903', name: 'M-ONE CHROM SPRAY 400 ML',          stock: 319,  unit: 'cope', purchase_price: 2.00, selling_price: 3.80 },

  // ── Sanitar Silikone ────────────────────────────────────────────────────────
  { id: 'p-35108', sku: '35108', name: 'M-ONE Sanitar Silikon Hellgrau',    stock: 3294, unit: 'cope', purchase_price: 1.15, selling_price: 4.00 },
  { id: 'p-35109', sku: '35109', name: 'M-ONE Sanitar Silikon Silbergrau',  stock: 4990, unit: 'cope', purchase_price: 1.15, selling_price: 4.00 },
  { id: 'p-35110', sku: '35110', name: 'M-ONE Sanitar Silikon transparent', stock: 5774, unit: 'cope', purchase_price: 1.15, selling_price: 4.00 },
  { id: 'p-35111', sku: '35111', name: 'M-ONE Sanitar Silikon Weiss',       stock: 3989, unit: 'cope', purchase_price: 1.15, selling_price: 4.00 },
  { id: 'p-35112', sku: '35112', name: 'M-ONE Sanitar Silikon Schwarz',     stock: 2284, unit: 'cope', purchase_price: 1.15, selling_price: 4.00 },
  { id: 'p-35113', sku: '35113', name: 'M-ONE Sanitar Silikon Bahamabeige', stock: 1897, unit: 'cope', purchase_price: 1.15, selling_price: 4.00 },
  { id: 'p-35114', sku: '35114', name: 'M-ONE Sanitar Silikon Braun',       stock: 1789, unit: 'cope', purchase_price: 1.15, selling_price: 4.00 },
  { id: 'p-35115', sku: '35115', name: 'M-ONE Sanitar Silikon Grau',        stock: 4661, unit: 'cope', purchase_price: 1.15, selling_price: 4.00 },
  { id: 'p-35119', sku: '35119', name: 'M-ONE Sanitar Silikon Jasemin',     stock: 921,  unit: 'cope', purchase_price: 1.15, selling_price: 4.00 },
  { id: 'p-35121', sku: '35121', name: 'M-ONE Sanitar Silikon Manhatten',   stock: 4654, unit: 'cope', purchase_price: 1.15, selling_price: 4.00 },
  { id: 'p-35125', sku: '35125', name: 'M-ONE Sanitar Silikon Caramel',     stock: 0,    unit: 'cope', purchase_price: 1.15, selling_price: 4.00 },
  { id: 'p-35128', sku: '35128', name: 'M-ONE Sanitar Silikon Anthrazit',   stock: 2150, unit: 'cope', purchase_price: 1.15, selling_price: 4.00 },

  // ── Silicone 280g ───────────────────────────────────────────────────────────
  { id: 'p-37112', sku: '37112', name: 'M ONE 280GR SILICONE BLACK',        stock: 600,  unit: 'cope', purchase_price: 1.15, selling_price: 4.00 },

  // ── Diverse Sprays ──────────────────────────────────────────────────────────
  { id: 'p-38136', sku: '38136', name: 'KLARLACK 400 ML',                   stock: 4,    unit: 'cope', purchase_price: 1.50, selling_price: 3.50 },
  { id: 'p-39505', sku: '39505', name: 'M ONE Silikonspray 400ml',          stock: 3712, unit: 'cope', purchase_price: 1.20, selling_price: 3.00 },
  { id: 'p-44001', sku: '44001', name: 'Fettspray 400ml',                   stock: 2960, unit: 'cope', purchase_price: 1.20, selling_price: 3.30 },
  { id: 'p-49644', sku: '49644', name: 'M ONE Rostlöser 400 ml',            stock: 9569, unit: 'cope', purchase_price: 1.00, selling_price: 2.00 },

  // ── Dichtung / Acryl ────────────────────────────────────────────────────────
  { id: 'p-50912', sku: '50912', name: 'Universal Dichtung Schwarz',        stock: 1526, unit: 'cope', purchase_price: 1.50, selling_price: 8.00 },
  { id: 'p-51611', sku: '51611', name: 'Universal Acryl 280 ml',            stock: 608,  unit: 'cope', purchase_price: 1.00, selling_price: 1.25 },
  { id: 'p-51612', sku: '51612', name: 'Structural Acryl 280 ml',           stock: 1109, unit: 'cope', purchase_price: 1.00, selling_price: 2.20 },
  { id: 'p-51736', sku: '51736', name: 'SCHWARZ GLANZED 400 ML',            stock: 1337, unit: 'cope', purchase_price: 1.50, selling_price: 3.00 },
  { id: 'p-51936', sku: '51936', name: 'SCHWARZ MATT 400 ml',               stock: 1302, unit: 'cope', purchase_price: 1.50, selling_price: 3.00 },

  // ── Fahrzeugpflege ──────────────────────────────────────────────────────────
  { id: 'p-54412', sku: '54412', name: 'M ONE Bremsen&Teile Reiniger 500 ml', stock: 9987, unit: 'cope', purchase_price: 1.15, selling_price: 2.30 },
  { id: 'p-55718', sku: '55718', name: 'M ONE MOTORSTART 400ML',            stock: 3224, unit: 'cope', purchase_price: 1.50, selling_price: 3.00 },
  { id: 'p-56117', sku: '56117', name: 'M ONE UBS 500ML',                   stock: 2969, unit: 'cope', purchase_price: 1.50, selling_price: 3.70 },

  // ── Profi Mont ──────────────────────────────────────────────────────────────
  { id: 'p-66701', sku: '66701', name: 'PROFI MONT EXTREME 280 ml',         stock: 757,  unit: 'cope', purchase_price: 1.50, selling_price: 5.80 },

  // ── Sonstige ────────────────────────────────────────────────────────────────
  { id: 'p-69236', sku: '69236', name: 'WEISS GLANZED 400 ML',              stock: 1453, unit: 'cope', purchase_price: 1.50, selling_price: 3.00 },
  { id: 'p-72101', sku: '72101', name: 'ZINK SPRAY 400 ML',                 stock: 3739, unit: 'cope', purchase_price: 1.50, selling_price: 4.50 },
]

// ──────────────────────────────────────────────────────────────────────────────
// INITIALER BESTAND JE STANDORT (exakt aus den 3 Excel-Dateien)
// ──────────────────────────────────────────────────────────────────────────────
export const INITIAL_MENSURI_STOCK: Record<string, number> = {
  '16936': 6,  '26736': 6,  '31812': 8,  '31819': 6,
  '31827': 5,  '31880': 6,  '31903': 6,  '35108': 60,
  '35109': 72, '35110': 36, '35111': 24, '35112': 60,
  '35113': 84, '35114': 36, '35115': 48, '35119': 24,
  '35121': 60, '35128': 48, '39505': 4,  '44001': 6,
  '49644': 22, '50912': 21, '51611': 48, '51612': 36,
  '51936': 6,  '54412': 11, '55718': 13, '56117': 7,
  '66701': 36, '69236': 9,  '72101': 8,
}

export const INITIAL_QERIMI_STOCK: Record<string, number> = {
  '26736': 7,  '31812': 7,  '31815': 6,  '31818': 6,
  '31822': 3,  '31824': 2,  '31827': 10, '31880': 6,
  '31903': 3,  '35108': 84, '35109': 84, '35110': 120,
  '35111': 156,'35112': 108,'35113': 84, '35114': 84,
  '35115': 120,'35119': 84, '35121': 120,'35128': 120,
  '39505': 4,  '44001': 17, '49644': 23, '50912': 28,
  '51611': 24, '51612': 36, '51736': 8,  '51936': 16,
  '54412': 24, '55718': 14, '56117': 17, '66701': 12,
  '69236': 9,  '72101': 6,
}

export const LOCATION_IDS = {
  DEPOT:   '11111111-1111-1111-1111-111111111111',
  MENSURI: '22222222-2222-2222-2222-222222222222',
  QERIMI:  '33333333-3333-3333-3333-333333333333',
}

// localStorage-Schlüssel — neue Version erzwingt Reset auf die neuen Daten
const STORAGE_KEY    = 'm_one_stock_map_v3'
const TRANSFERS_KEY  = 'm_one_transfers_history_v3'
const SALES_KEY      = 'm_one_sales_history_v1'
const PRICES_KEY     = 'm_one_custom_prices_v1'

export function getCustomPricesMap(): Record<string, number> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(PRICES_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.error('Error reading custom prices', e)
  }
  return {}
}

export function saveCustomPricesMap(map: Record<string, number>) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(PRICES_KEY, JSON.stringify(map))
    window.dispatchEvent(new Event('m_one_products_changed'))
    window.dispatchEvent(new Event('m_one_stock_changed'))
  } catch (e) {
    console.error('Error saving custom prices', e)
  }
}

export function getActiveProductsList(): ProductStockInfo[] {
  const customPrices = getCustomPricesMap()
  return INITIAL_DEPO_PRODUCTS.map((p) => {
    if (customPrices[p.sku] !== undefined) {
      return { ...p, selling_price: customPrices[p.sku] }
    }
    return p
  })
}

// ──────────────────────────────────────────────────────────────────────────────
// HILFSFUNKTIONEN
// ──────────────────────────────────────────────────────────────────────────────
function buildDefaultStockMap(): Record<string, Record<string, number>> {
  const depotStock: Record<string, number> = {}
  INITIAL_DEPO_PRODUCTS.forEach(p => {
    depotStock[p.sku] = p.stock
  })

  return {
    [LOCATION_IDS.DEPOT]:   depotStock,
    [LOCATION_IDS.MENSURI]: { ...INITIAL_MENSURI_STOCK },
    [LOCATION_IDS.QERIMI]:  { ...INITIAL_QERIMI_STOCK },
  }
}

export function getStockMap(): Record<string, Record<string, number>> {
  if (typeof window === 'undefined') return buildDefaultStockMap()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.error('Error reading stock map', e)
  }
  const defaultMap = buildDefaultStockMap()
  saveStockMap(defaultMap)
  return defaultMap
}

export function saveStockMap(map: Record<string, Record<string, number>>) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
    window.dispatchEvent(new Event('m_one_stock_changed'))
  } catch (e) {
    console.error('Error saving stock map', e)
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// UMLAGERUNG BUCHEN (LIVE)
// ──────────────────────────────────────────────────────────────────────────────
export function executeStockTransfer(
  fromLocId: string,
  fromLocName: string,
  toLocId: string,
  toLocName: string,
  items: { sku: string; name: string; qty: number }[],
  notes: string = ''
): StockTransferRecord {
  const map = getStockMap()

  if (!map[fromLocId]) map[fromLocId] = {}
  if (!map[toLocId])   map[toLocId]   = {}

  items.forEach(item => {
    const from = map[fromLocId][item.sku] ?? 0
    const to   = map[toLocId][item.sku]   ?? 0
    map[fromLocId][item.sku] = Math.max(0, from - item.qty)
    map[toLocId][item.sku]   = to + item.qty
  })

  saveStockMap(map)

  const history   = getTransfersHistory()
  const nextNum   = (history.length + 1).toString().padStart(4, '0')
  const record: StockTransferRecord = {
    id:                 `tr-${Date.now()}`,
    transfer_number:    `TR-2026-${nextNum}`,
    from_location_id:   fromLocId,
    from_location_name: fromLocName,
    to_location_id:     toLocId,
    to_location_name:   toLocName,
    items,
    items_count:        items.length,
    notes:              notes || 'Fahrzeugbeladung',
    created_at:         new Date().toISOString(),
    status:             'confirmed',
  }

  const updatedHistory = [record, ...history]
  if (typeof window !== 'undefined') {
    localStorage.setItem(TRANSFERS_KEY, JSON.stringify(updatedHistory))
  }

  return record
}

// ──────────────────────────────────────────────────────────────────────────────
// UMLAGERUNGS-PROTOKOLL
// ──────────────────────────────────────────────────────────────────────────────
export function getTransfersHistory(): StockTransferRecord[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(TRANSFERS_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.error('Error reading transfers history', e)
  }
  return []
}

// ──────────────────────────────────────────────────────────────────────────────
// VERKAUF BUCHEN — Zieht Bestand vom Fahrzeuglager ab & speichert Verkaufshistorie
// ──────────────────────────────────────────────────────────────────────────────
export function executeSale(
  vehicleLocId: string,
  vehicleLocName: string,
  driverName: string,
  customerNumber: string,
  customerName: string,
  items: { sku: string; name: string; qty: number; unit_price: number }[],
  discountPct: number,
  paymentMethod: 'cash' | 'card' | 'invoice'
): SaleRecord {
  // 1. Bestand vom Fahrzeuglager abziehen
  const map = getStockMap()
  if (!map[vehicleLocId]) map[vehicleLocId] = {}

  items.forEach(item => {
    const current = map[vehicleLocId][item.sku] ?? 0
    map[vehicleLocId][item.sku] = Math.max(0, current - item.qty)
  })

  saveStockMap(map)

  // 2. Verkaufsbon erstellen & speichern
  const subtotal = items.reduce((s, i) => s + i.qty * i.unit_price, 0)
  const discountVal = subtotal * (discountPct / 100)
  const totalAmount = subtotal - discountVal

  const salesHistory = getSalesHistory()
  const nextNum = (salesHistory.length + 1).toString().padStart(4, '0')

  const record: SaleRecord = {
    id:                   `sale-${Date.now()}`,
    order_number:         `VK-2026-${nextNum}`,
    driver_name:          driverName,
    vehicle_location_id:  vehicleLocId,
    vehicle_location_name: vehicleLocName,
    customer_number:      customerNumber,
    customer_name:        customerName,
    items:                items.map(i => ({
      sku:        i.sku,
      name:       i.name,
      qty:        i.qty,
      unit_price: i.unit_price,
      total:      i.qty * i.unit_price,
    })),
    items_count:          items.length,
    subtotal,
    discount_pct:         discountPct,
    total_amount:         totalAmount,
    payment_method:       paymentMethod,
    created_at:           new Date().toISOString(),
  }

  const updatedHistory = [record, ...salesHistory]
  if (typeof window !== 'undefined') {
    localStorage.setItem(SALES_KEY, JSON.stringify(updatedHistory))
    // Löse einen Event aus, damit alle Komponenten die neuen Verkäufe anzeigen
    window.dispatchEvent(new CustomEvent('m_one_sale_recorded', { detail: record }))
  }

  return record
}

// ──────────────────────────────────────────────────────────────────────────────
// VERKAUFSHISTORIE LESEN
// ──────────────────────────────────────────────────────────────────────────────
export function getSalesHistory(): SaleRecord[] {
  if (typeof window === 'undefined') return []
  try {
    if (localStorage.getItem('m_one_sales_cleared') === 'true') {
      return []
    }
    const raw = localStorage.getItem(SALES_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.error('Error reading sales history', e)
  }
  return MOCK_2026_SALES as any
}

// ──────────────────────────────────────────────────────────────────────────────
// LAGER-RESET (alle Bestände auf die Excel-Ausgangswerte zurücksetzen)
// ──────────────────────────────────────────────────────────────────────────────
export function resetStockToInitial() {
  const defaultMap = buildDefaultStockMap()
  saveStockMap(defaultMap)
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TRANSFERS_KEY)
    localStorage.setItem('m_one_sales_cleared', 'true')
    localStorage.setItem(SALES_KEY, '[]')
    window.dispatchEvent(new Event('m_one_stock_changed'))
  }
}

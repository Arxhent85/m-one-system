// ============================================================
// M ONE ERP — ZENTRALER BESTANDS- & UMLAGERUNGS-STORE (LIVE)
// Daten: DEPO MONE 2026 -2.xlsx / MENSURI depo 2.xlsx / QERIMI DEPO 2.xlsx
// Stand: 2026-08-19
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
  latitude?: number
  longitude?: number
  gps_accuracy?: number
  google_maps_url?: string
  created_at: string
}

// ──────────────────────────────────────────────────────────────────────────────
// OFFIZIELLES PRODUKTSORTIMENT (alle Produkte die in irgendeinem Lager existieren)
// Sortiert nach SKU aufsteigend
// ──────────────────────────────────────────────────────────────────────────────
export const INITIAL_DEPO_PRODUCTS: ProductStockInfo[] = [
  // ── Reiniger / Autowäsche ──────────────────────────────────────────────────
  { id: 'p-11000', sku: '11000', name: 'Bodenreiniger 4 Ltr',              stock: 14,   unit: 'cope', purchase_price: 1.50, selling_price: 8.00 },
  { id: 'p-12000', sku: '12000', name: 'BAU CLEAN 4L',                     stock: 0,    unit: 'cope', purchase_price: 1.50, selling_price: 3.00 },
  { id: 'p-16936', sku: '16936', name: 'FELGENSILBER 400 ML',               stock: 34,   unit: 'cope', purchase_price: 1.50, selling_price: 3.50 },
  { id: 'p-17101', sku: '17101', name: 'KÜHLERREINIGER 400 ML',             stock: 300,  unit: 'cope', purchase_price: 1.20, selling_price: 3.10 },
  { id: 'p-26736', sku: '26736', name: 'HAFTGRUND 400 ml',                  stock: 197,  unit: 'cope', purchase_price: 1.50, selling_price: 2.00 },
  { id: 'p-30276', sku: '30276', name: 'Bio Blic Antikalk 750 ml',          stock: 3,    unit: 'cope', purchase_price: 1.50, selling_price: 3.50 },

  // ── Lack-Sprays ────────────────────────────────────────────────────────────
  { id: 'p-31812', sku: '31812', name: 'M-ONE LACK GELB',                   stock: 272,  unit: 'cope', purchase_price: 1.50, selling_price: 2.50 },
  { id: 'p-31815', sku: '31815', name: 'M-ONE LACK HELLGRAU',               stock: 313,  unit: 'cope', purchase_price: 1.50, selling_price: 2.50 },
  { id: 'p-31818', sku: '31818', name: 'M ONE LACK ANTHRAZIT 400 ML',       stock: 0,    unit: 'cope', purchase_price: 1.50, selling_price: 2.50 },
  { id: 'p-31819', sku: '31819', name: 'LACK FUERROT 400 ML',               stock: 1571, unit: 'cope', purchase_price: 1.50, selling_price: 2.50 },
  { id: 'p-31822', sku: '31822', name: 'M-ONE GOLD SPRAY',                  stock: 367,  unit: 'cope', purchase_price: 2.00, selling_price: 2.50 },
  { id: 'p-31824', sku: '31824', name: 'M-ONE LACK BRAUN',                  stock: 417,  unit: 'cope', purchase_price: 1.50, selling_price: 2.50 },
  { id: 'p-31827', sku: '31827', name: 'M-ONE LACK GRUN',                   stock: 292,  unit: 'cope', purchase_price: 1.50, selling_price: 2.50 },
  { id: 'p-31880', sku: '31880', name: 'HAT LACK SCHWARZ 690°C 400 ML',    stock: 1445, unit: 'cope', purchase_price: 1.50, selling_price: 3.50 },
  { id: 'p-31903', sku: '31903', name: 'M-ONE CHROM SPRAY 400 ML',          stock: 319,  unit: 'cope', purchase_price: 2.00, selling_price: 3.80 },

  // ── Sanitar Silikone ────────────────────────────────────────────────────────
  { id: 'p-35108', sku: '35108', name: 'M-ONE Sanitar Silikon Hellgrau',    stock: 3095, unit: 'cope', purchase_price: 1.15, selling_price: 4.00 },
  { id: 'p-35109', sku: '35109', name: 'M-ONE Sanitar Silikon Silbergrau',  stock: 4174, unit: 'cope', purchase_price: 1.15, selling_price: 4.00 },
  { id: 'p-35110', sku: '35110', name: 'M-ONE Sanitar Silikon transparent', stock: 4982, unit: 'cope', purchase_price: 1.15, selling_price: 4.00 },
  { id: 'p-35111', sku: '35111', name: 'M-ONE Sanitar Silikon Weiss',       stock: 3435, unit: 'cope', purchase_price: 1.15, selling_price: 4.00 },
  { id: 'p-35112', sku: '35112', name: 'M-ONE Sanitar Silikon Schwarz',     stock: 1888, unit: 'cope', purchase_price: 1.15, selling_price: 4.00 },
  { id: 'p-35113', sku: '35113', name: 'M-ONE Sanitar Silikon Bahamabeige', stock: 1213, unit: 'cope', purchase_price: 1.15, selling_price: 4.00 },
  { id: 'p-35114', sku: '35114', name: 'M-ONE Sanitar Silikon Braun',       stock: 1587, unit: 'cope', purchase_price: 1.15, selling_price: 4.00 },
  { id: 'p-35115', sku: '35115', name: 'M-ONE Sanitar Silikon Grau',        stock: 4011, unit: 'cope', purchase_price: 1.15, selling_price: 4.00 },
  { id: 'p-35119', sku: '35119', name: 'M-ONE Sanitar Silikon Jasemin',     stock: 785,  unit: 'cope', purchase_price: 1.15, selling_price: 4.00 },
  { id: 'p-35121', sku: '35121', name: 'M-ONE Sanitar Silikon Manhatten',   stock: 3911, unit: 'cope', purchase_price: 1.15, selling_price: 4.00 },
  { id: 'p-35128', sku: '35128', name: 'M-ONE Sanitar Silikon Anthrazit',   stock: 1608, unit: 'cope', purchase_price: 1.15, selling_price: 4.00 },

  // ── Diverse Sprays ──────────────────────────────────────────────────────────
  { id: 'p-38136', sku: '38136', name: 'KLARLACK 400 ML',                    stock: 4,    unit: 'cope', purchase_price: 1.50, selling_price: 2.50 },
  { id: 'p-39505', sku: '39505', name: 'M ONE Silikonspray 400ml',          stock: 3712, unit: 'cope', purchase_price: 1.20, selling_price: 3.00 },
  { id: 'p-44001', sku: '44001', name: 'Fettspray 400ml',                   stock: 2912, unit: 'cope', purchase_price: 1.20, selling_price: 3.50 },
  { id: 'p-49644', sku: '49644', name: 'M ONE Rostlöser 400 ml',            stock: 9497, unit: 'cope', purchase_price: 1.00, selling_price: 2.00 },

  // ── Dichtung / Acryl ────────────────────────────────────────────────────────
  { id: 'p-50912', sku: '50912', name: 'Universal Dichtung Schwarz',        stock: 1418, unit: 'cope', purchase_price: 1.50, selling_price: 8.00 },
  { id: 'p-51611', sku: '51611', name: 'Universal Acryl 280 ml',            stock: 305,  unit: 'cope', purchase_price: 1.00, selling_price: 1.25 },
  { id: 'p-51612', sku: '51612', name: 'Structural Acryl 280 ml',           stock: 797,  unit: 'cope', purchase_price: 1.00, selling_price: 2.30 },
  { id: 'p-51736', sku: '51736', name: 'SCHWARZ GLANZED 400 ML',            stock: 1307, unit: 'cope', purchase_price: 1.50, selling_price: 2.50 },
  { id: 'p-51936', sku: '51936', name: 'SCHWARZ MATT 400 ml',               stock: 1289, unit: 'cope', purchase_price: 1.50, selling_price: 2.50 },

  // ── Fahrzeugpflege ──────────────────────────────────────────────────────────
  { id: 'p-54412', sku: '54412', name: 'M ONE Bremsen&Teile Reiniger 500 ml', stock: 9939, unit: 'cope', purchase_price: 1.15, selling_price: 2.00 },
  { id: 'p-55718', sku: '55718', name: 'M ONE MOTORSTART 400ML',            stock: 3212, unit: 'cope', purchase_price: 1.50, selling_price: 3.50 },
  { id: 'p-56117', sku: '56117', name: 'M ONE UBS 500ML',                   stock: 2911, unit: 'cope', purchase_price: 1.50, selling_price: 4.00 },

  // ── Profi Mont ──────────────────────────────────────────────────────────────
  { id: 'p-66700', sku: '66700', name: 'PROFI MONT DEKOR 280ml',            stock: 144,  unit: 'cope', purchase_price: 1.50, selling_price: 3.00 },
  { id: 'p-66701', sku: '66701', name: 'PROFI MONT EXTREME 280 ml',         stock: 565,  unit: 'cope', purchase_price: 1.50, selling_price: 5.80 },

  // ── Sonstige ────────────────────────────────────────────────────────────────
  { id: 'p-69236', sku: '69236', name: 'WEISS GLANZED 400 ML',              stock: 1447, unit: 'cope', purchase_price: 1.50, selling_price: 3.00 },
  { id: 'p-72101', sku: '72101', name: 'ZINK SPRAY 400 ML',                 stock: 3739, unit: 'cope', purchase_price: 1.50, selling_price: 4.20 },
]

// ──────────────────────────────────────────────────────────────────────────────
// INITIALER BESTAND JE STANDORT (exakt aus den neuen 2026 Excel-Dateien)
// ──────────────────────────────────────────────────────────────────────────────
export const INITIAL_MENSURI_STOCK: Record<string, number> = {
  '16936': 4,
  '26736': 8,
  '31812': 8,
  '31819': 6,
  '31880': 6,
  '31903': 6,
  '35108': 48,
  '35109': 84,
  '35110': 96,
  '35111': 48,
  '35112': 60,
  '35113': 72,
  '35114': 48,
  '35115': 60,
  '35119': 36,
  '35121': 96,
  '35128': 72,
  '39505': 2,
  '44001': 7,
  '49644': 15,
  '50912': 23,
  '51611': 60,
  '51612': 48,
  '51736': 16,
  '51936': 6,
  '54412': 8,
  '55718': 4,
  '56117': 12,
  '66701': 60,
  '69236': 8,
  '72101': 8,
}

export const INITIAL_QERIMI_STOCK: Record<string, number> = {
  '26736': 7,
  '30276': 10,
  '31812': 7,
  '31815': 6,
  '31818': 2,
  '31819': 12,
  '31822': 3,
  '31824': 2,
  '31827': 8,
  '31880': 6,
  '31903': 3,
  '35108': 120,
  '35109': 144,
  '35110': 144,
  '35111': 144,
  '35112': 96,
  '35113': 204,
  '35114': 96,
  '35115': 120,
  '35119': 84,
  '35121': 180,
  '35128': 132,
  '39505': 4,
  '44001': 17,
  '49644': 33,
  '50912': 34,
  '51611': 72,
  '51612': 60,
  '51736': 8,
  '51936': 16,
  '54412': 24,
  '55718': 19,
  '56117': 19,
  '66701': 12,
  '69236': 9,
  '72101': 6,
}

export const LOCATION_IDS = {
  DEPOT:   '11111111-1111-1111-1111-111111111111',
  MENSURI: '22222222-2222-2222-2222-222222222222',
  QERIMI:  '33333333-3333-3333-3333-333333333333',
}

// localStorage-Schlüssel — neue Version v5 erzwingt Reset auf die neuen Daten
const STORAGE_KEY    = 'm_one_stock_map_v5'
const TRANSFERS_KEY  = 'm_one_transfers_history_v5'
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
export const CUSTOMER_GPS_KEY = 'm_one_customer_gps_map'

export interface CustomerGpsInfo {
  lat: number
  lng: number
  accuracy?: number
  updatedAt: string
  google_maps_url: string
}

export function getCustomerGpsMap(): Record<string, CustomerGpsInfo> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(CUSTOMER_GPS_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.error('Error reading customer GPS map:', e)
  }
  return {}
}

export function saveCustomerGps(customerNumber: string, lat: number, lng: number, accuracy?: number): CustomerGpsInfo {
  const currentMap = getCustomerGpsMap()
  const info: CustomerGpsInfo = {
    lat,
    lng,
    accuracy,
    updatedAt: new Date().toISOString(),
    google_maps_url: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
  }
  currentMap[customerNumber] = info
  if (typeof window !== 'undefined') {
    localStorage.setItem(CUSTOMER_GPS_KEY, JSON.stringify(currentMap))
    window.dispatchEvent(new CustomEvent('m_one_customer_gps_updated', { detail: { customerNumber, info } }))
  }
  return info
}

// ──────────────────────────────────────────────────────────────────────────────
// VERKAUF DURCHFÜHREN (Direktverkauf durch Fahrer)
// ──────────────────────────────────────────────────────────────────────────────
export function executeSale(
  vehicleLocId: string,
  vehicleLocName: string,
  driverName: string,
  customerNumber: string,
  customerName: string,
  items: { sku: string; name: string; qty: number; unit_price: number }[],
  discountPct: number,
  paymentMethod: 'cash' | 'card' | 'invoice',
  gps?: { latitude?: number; longitude?: number; accuracy?: number }
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

  const googleMapsUrl = (gps?.latitude && gps?.longitude)
    ? `https://www.google.com/maps/search/?api=1&query=${gps.latitude},${gps.longitude}`
    : undefined

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
    latitude:             gps?.latitude,
    longitude:            gps?.longitude,
    gps_accuracy:         gps?.accuracy,
    google_maps_url:      googleMapsUrl,
    created_at:           new Date().toISOString(),
  }

  // 3. Wenn GPS vorhanden ist, Kunden-Standort permanent abspeichern
  if (customerNumber && customerNumber !== '—' && gps?.latitude && gps?.longitude) {
    saveCustomerGps(customerNumber, gps.latitude, gps.longitude, gps.accuracy)
  }

  const updatedHistory = [record, ...salesHistory]
  if (typeof window !== 'undefined') {
    localStorage.removeItem('m_one_sales_cleared')
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
    const raw = localStorage.getItem(SALES_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        return parsed
      }
    }
  } catch (e) {
    console.error('Error reading sales history', e)
  }
  return []
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

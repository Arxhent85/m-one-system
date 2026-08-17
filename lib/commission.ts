import commissionRatesData from './commissionRates.json'

export const COMMISSION_RATES: Record<string, number> = commissionRatesData

/**
 * Fixes Grundgehalt / Fixlohn je Fahrer pro Monat
 */
export const FIXED_DRIVER_SALARY = 137.50

/**
 * Liefert den Provisionssatz in € pro Stück für einen bestimmten Artikel (SKU).
 */
export function getCommissionRate(sku?: string | number): number {
  if (!sku) return 0.0
  const cleanSku = String(sku).trim()
  return COMMISSION_RATES[cleanSku] ?? 0.0
}

/**
 * Berechnet die Provision für eine Position (Artikelnummer * Stückzahl).
 */
export function calculateItemCommission(sku: string | number, qty: number = 1): number {
  const rate = getCommissionRate(sku)
  return Math.round(rate * qty * 100) / 100
}

/**
 * Berechnet die Gesamtprovision für einen Auftrag/Verkauf.
 */
export function calculateOrderCommission(order: { items?: any[] }): {
  totalCommission: number
  totalPieces: number
  itemsCommission: {
    sku: string
    name: string
    qty: number
    rate: number
    commission: number
  }[]
} {
  const items = Array.isArray(order.items) ? order.items : []
  let totalCommission = 0
  let totalPieces = 0

  const itemsCommission = items.map((it: any) => {
    const sku = String(it.sku || it.raw_sku || '').trim()
    const name = it.name || it.description || 'Artikel'
    const qty = Number(it.qty || 1) || 1
    const rate = getCommissionRate(sku)
    const comm = Math.round(rate * qty * 100) / 100

    totalCommission += comm
    totalPieces += qty

    return {
      sku,
      name,
      qty,
      rate,
      commission: comm,
    }
  })

  return {
    totalCommission: Math.round(totalCommission * 100) / 100,
    totalPieces,
    itemsCommission,
  }
}

/**
 * Bestimmt den Fahrer (Mensuri oder Qerimi) STRIKT anhand der Kundennummer:
 * - Alle Kunden, deren Nummer mit '1' beginnt (z.B. 10101, 1-02-03, 010203) -> 100% Fahrer Qerimi
 * - Alle Kunden, deren Nummer mit '2' beginnt (z.B. 20101, 2-01-01, 020101) -> 100% Fahrer Mensuri
 * - Alle anderen (z.B. 40xxx Baufirmen / Zentrale) -> Zentrale (erzeugt keine Fahrer-Stückprovision)
 */
export function getDriverForSale(sale: any): 'Mensuri' | 'Qerimi' | 'Zentrale' {
  const custNumRaw = String(sale.customer_number || sale.customerNumber || sale.customers?.customer_number || '').trim()
  
  if (custNumRaw) {
    let clean = custNumRaw.replace(/[-.\s]/g, '')
    if (clean.startsWith('0')) clean = clean.substring(1)
    
    if (clean.startsWith('1')) return 'Qerimi'
    if (clean.startsWith('2')) return 'Mensuri'
    if (clean.startsWith('4') || clean.toLowerCase().startsWith('blq')) return 'Zentrale'
  }

  // Sekundärer Fallback falls keine Kundennummer vorliegt
  const driverName = String(sale.driver_name || sale.driver || '').toLowerCase()
  const locName = String(sale.vehicle_location_name || sale.locations?.name || '').toLowerCase()

  if (driverName.includes('qerimi') || locName.includes('qerimi')) return 'Qerimi'
  if (driverName.includes('mensuri') || locName.includes('mensuri')) return 'Mensuri'
  
  return 'Zentrale'
}


/**
 * Formatiert YYYY-MM in lesbares Deutsch (z.B. 2026-07 -> Juli 2026).
 */
export function formatMonthKey(monthKey: string): string {
  if (!monthKey || !monthKey.includes('-')) return monthKey
  const [year, month] = monthKey.split('-')
  const monthNames = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ]
  const idx = parseInt(month, 10) - 1
  return `${monthNames[idx] || month} ${year}`
}

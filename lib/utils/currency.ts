/**
 * Währungsformatierung (EUR, deutsch)
 */
export function formatCurrency(
  amount: number,
  currency = 'EUR',
  locale = 'de-DE'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Zahl mit Dezimalen formatieren
 */
export function formatNumber(
  value: number,
  decimals = 0,
  locale = 'de-DE'
): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

/**
 * Prozent-Marge berechnen
 */
export function calcMarginPct(revenue: number, cost: number): number {
  if (revenue <= 0) return 0
  return ((revenue - cost) / revenue) * 100
}

/**
 * Bestellsumme berechnen
 */
export function calcOrderTotals(
  items: Array<{ quantity: number; unit_price: number; discount_pct: number }>,
  taxRate = 0,
  globalDiscountPct = 0
) {
  const subtotal = items.reduce((sum, item) => {
    const lineTotal = item.quantity * item.unit_price
    const discounted = lineTotal * (1 - item.discount_pct / 100)
    return sum + discounted
  }, 0)

  const discountAmount = subtotal * (globalDiscountPct / 100)
  const taxableAmount  = subtotal - discountAmount
  const taxAmount      = taxableAmount * (taxRate / 100)
  const totalAmount    = taxableAmount + taxAmount

  return {
    subtotal:       Math.round(subtotal * 100) / 100,
    discount_amount: Math.round(discountAmount * 100) / 100,
    tax_amount:     Math.round(taxAmount * 100) / 100,
    total_amount:   Math.round(totalAmount * 100) / 100,
  }
}

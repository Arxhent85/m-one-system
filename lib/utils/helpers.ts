import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Tailwind class merging utility (clsx + tailwind-merge)
 * Verhindert Klassen-Konflikte bei bedingten Tailwind-Klassen.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/**
 * Bestand-Status ermitteln
 */
export function getStockStatus(
  current: number,
  threshold: number
): 'ok' | 'low_stock' | 'out_of_stock' {
  if (current <= 0)         return 'out_of_stock'
  if (current <= threshold) return 'low_stock'
  return 'ok'
}

/**
 * Status-Badge-Konfiguration für Verkaufsaufträge
 */
export function getOrderStatusConfig(status: string) {
  const configs: Record<string, { label: string; className: string }> = {
    draft:     { label: 'Entwurf',    className: 'bg-surface-700 text-surface-300' },
    confirmed: { label: 'Bestätigt',  className: 'bg-brand-900 text-brand-300' },
    delivered: { label: 'Geliefert',  className: 'bg-success-900 text-success-500' },
    invoiced:  { label: 'Fakturiert', className: 'bg-warning-900 text-warning-500' },
    cancelled: { label: 'Storniert',  className: 'bg-danger-900 text-danger-500' },
  }
  return configs[status] ?? { label: status, className: 'bg-surface-700 text-surface-300' }
}

/**
 * Zahlungsstatus-Badge-Konfiguration
 */
export function getPaymentStatusConfig(status: string) {
  const configs: Record<string, { label: string; className: string }> = {
    pending:  { label: 'Offen',      className: 'bg-warning-900 text-warning-500' },
    paid:     { label: 'Bezahlt',    className: 'bg-success-900 text-success-500' },
    partial:  { label: 'Teilzahlung', className: 'bg-brand-900 text-brand-300' },
    overdue:  { label: 'Überfällig', className: 'bg-danger-900 text-danger-500' },
  }
  return configs[status] ?? { label: status, className: 'bg-surface-700 text-surface-300' }
}

/**
 * Standort-Typ-Icon/Farbe
 */
export function getLocationConfig(type: 'depot' | 'vehicle') {
  return type === 'depot'
    ? { label: 'Hauptdepot', color: 'text-brand-400',   bg: 'bg-brand-950' }
    : { label: 'Fahrzeug',   color: 'text-success-500', bg: 'bg-success-900/30' }
}

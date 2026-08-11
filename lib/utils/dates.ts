import { format, formatDistanceToNow, isToday, isYesterday, subDays, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns'
import { de } from 'date-fns/locale'
import type { DateRange } from '@/lib/types'

/**
 * Datum formatieren (deutsch)
 */
export function formatDate(date: string | Date, pattern = 'dd.MM.yyyy'): string {
  return format(new Date(date), pattern, { locale: de })
}

/**
 * Datum + Zeit formatieren
 */
export function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'dd.MM.yyyy HH:mm', { locale: de })
}

/**
 * Relative Zeitangabe (z.B. "vor 3 Stunden")
 */
export function formatRelative(date: string | Date): string {
  const d = new Date(date)
  if (isToday(d))     return `Heute, ${format(d, 'HH:mm')}`
  if (isYesterday(d)) return `Gestern, ${format(d, 'HH:mm')}`
  return formatDistanceToNow(d, { addSuffix: true, locale: de })
}

/**
 * Datumsbereich aus DateRange-Label berechnen
 */
export function getDateRangeFromLabel(range: DateRange): { from: Date; to: Date } {
  const now = new Date()
  switch (range) {
    case 'today':
      return { from: startOfDay(now), to: endOfDay(now) }
    case 'week':
      return { from: startOfWeek(now, { locale: de }), to: endOfWeek(now, { locale: de }) }
    case 'month':
      return { from: startOfMonth(now), to: endOfMonth(now) }
    case 'quarter':
      return { from: subDays(now, 90), to: endOfDay(now) }
    case 'year':
      return { from: startOfYear(now), to: endOfYear(now) }
    default:
      return { from: startOfMonth(now), to: endOfMonth(now) }
  }
}

import MOCK_2026_SALES from './mock2026Sales.json'

export type ExpenseCategory =
  | 'fuel'
  | 'electricity'
  | 'rent'
  | 'salary'
  | 'tax'
  | 'maintenance'
  | 'materials'
  | 'office'
  | 'other'

export interface ExpenseEntry {
  id: string
  title: string
  category: ExpenseCategory
  amount: number
  date: string // YYYY-MM-DD
  month: string // YYYY-MM
  vehicleId?: 'vehicle-1' | 'vehicle-2' | 'depot' | 'general'
  vehicleName?: string
  driverName?: string
  fuelLiters?: number
  mileage?: number
  receiptImage?: string | null // WebP/JPEG Base64
  isAutomatic?: boolean
  status: 'paid' | 'pending' | 'draft'
  notes?: string
  taxReference?: string
  created_at: string
  updated_at: string
}

export interface TaxReminder {
  monthKey: string // The month the tax applies to (e.g. "2026-07")
  dueDate: string // Always the 15th of the following month (e.g. "2026-08-15")
  monthLabel: string
  totalRevenue: number
  totalDeductibleExpenses: number
  estimatedTaxAmount: number // Estimated tax due
  taxRatePercent: number // e.g. 10% profit tax / ATK
  isPaid: boolean
  paidExpenseId?: string
  status: 'due' | 'overdue' | 'paid' | 'upcoming'
}

export interface MonthlyFinancialSummary {
  monthKey: string
  monthLabel: string
  revenue: number
  totalExpenses: number
  netProfit: number
  profitMarginPercent: number
  salariesExpense: number
  fuelExpense: number
  electricityExpense: number
  rentExpense: number
  taxExpense: number
  maintenanceExpense: number
  materialsExpense: number
  otherExpense: number
  taxReminder: TaxReminder
}

export const EXPENSE_CATEGORIES_META: Record<
  ExpenseCategory,
  { label: string; icon: string; color: string; badgeClass: string; bgClass: string }
> = {
  fuel: {
    label: 'Treibstoff (Diesel)',
    icon: '⛽',
    color: '#f59e0b',
    badgeClass: 'bg-amber-950/80 text-amber-400 border border-amber-800/60',
    bgClass: 'bg-amber-500/10 text-amber-400',
  },
  electricity: {
    label: 'Strom & Energie',
    icon: '⚡',
    color: '#eab308',
    badgeClass: 'bg-yellow-950/80 text-yellow-400 border border-yellow-800/60',
    bgClass: 'bg-yellow-500/10 text-yellow-400',
  },
  rent: {
    label: 'Miete (Lager & Büro)',
    icon: '🏢',
    color: '#8b5cf6',
    badgeClass: 'bg-purple-950/80 text-purple-400 border border-purple-800/60',
    bgClass: 'bg-purple-500/10 text-purple-400',
  },
  salary: {
    label: 'Löhne & Gehälter',
    icon: '👥',
    color: '#10b981',
    badgeClass: 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60',
    bgClass: 'bg-emerald-500/10 text-emerald-400',
  },
  tax: {
    label: 'Steuern & Abgaben',
    icon: '🏛️',
    color: '#ef4444',
    badgeClass: 'bg-rose-950/80 text-rose-400 border border-rose-800/60',
    bgClass: 'bg-rose-500/10 text-rose-400',
  },
  maintenance: {
    label: 'Fahrzeug-Wartung & Reparatur',
    icon: '🔧',
    color: '#3b82f6',
    badgeClass: 'bg-blue-950/80 text-blue-400 border border-blue-800/60',
    bgClass: 'bg-blue-500/10 text-blue-400',
  },
  materials: {
    label: 'Wareneinkauf & Material',
    icon: '📦',
    color: '#ec4899',
    badgeClass: 'bg-pink-950/80 text-pink-400 border border-pink-800/60',
    bgClass: 'bg-pink-500/10 text-pink-400',
  },
  office: {
    label: 'Büro & Verwaltung',
    icon: '📂',
    color: '#6366f1',
    badgeClass: 'bg-indigo-950/80 text-indigo-400 border border-indigo-800/60',
    bgClass: 'bg-indigo-500/10 text-indigo-400',
  },
  other: {
    label: 'Sonstige Ausgaben',
    icon: '📝',
    color: '#94a3b8',
    badgeClass: 'bg-surface-800 text-surface-300 border border-surface-700',
    bgClass: 'bg-surface-800/60 text-surface-400',
  },
}

const EXPENSES_STORAGE_KEY = 'm_one_expenses_v1'
const FIXED_DRIVER_SALARY = 137.5

// ──────────────────────────────────────────────────────────────
// CLIENT-SIDE BELEG-KOMPRIMIERUNG (WebP / JPEG ~40-60 KB)
// ──────────────────────────────────────────────────────────────
export function compressExpenseReceipt(
  file: File,
  maxWidth = 1200,
  quality = 0.72
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) return reject('Canvas error')

        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, 0, 0, width, height)

        let output = canvas.toDataURL('image/webp', quality)
        if (!output.startsWith('data:image/webp')) {
          output = canvas.toDataURL('image/jpeg', quality)
        }

        resolve(output)
      }
      img.onerror = (err) => reject(err)
      img.src = event.target?.result as string
    }
    reader.onerror = (err) => reject(err)
    reader.readAsDataURL(file)
  })
}

// ──────────────────────────────────────────────────────────────
// INITIAL OPERATIONAL EXPENSES FOR 2026
// ──────────────────────────────────────────────────────────────
export const INITIAL_DEMO_EXPENSES: ExpenseEntry[] = [
  // August 2026
  {
    id: 'exp-2026-08-01',
    title: 'Diesel Fahrzeug 1 (Depo Mensuri)',
    category: 'fuel',
    amount: 84.5,
    date: '2026-08-14',
    month: '2026-08',
    vehicleId: 'vehicle-1',
    vehicleName: 'Fahrzeug 1 (Depo Mensuri)',
    driverName: 'Mensuri',
    fuelLiters: 65,
    mileage: 184500,
    status: 'paid',
    notes: 'Vollbetankung Tankstelle IP Petrol Fushë Kosovë',
    created_at: '2026-08-14T08:30:00Z',
    updated_at: '2026-08-14T08:30:00Z',
  },
  {
    id: 'exp-2026-08-02',
    title: 'Diesel Fahrzeug 2 (Depo Qerimi)',
    category: 'fuel',
    amount: 91.0,
    date: '2026-08-12',
    month: '2026-08',
    vehicleId: 'vehicle-2',
    vehicleName: 'Fahrzeug 2 (Depo Qerimi)',
    driverName: 'Qerimi',
    fuelLiters: 70,
    mileage: 162300,
    status: 'paid',
    notes: 'Vollbetankung Tour Pejë / Gjakovë',
    created_at: '2026-08-12T07:45:00Z',
    updated_at: '2026-08-12T07:45:00Z',
  },
  {
    id: 'exp-2026-08-03',
    title: 'Stromrechnung Hauptlager (KEDS)',
    category: 'electricity',
    amount: 145.2,
    date: '2026-08-08',
    month: '2026-08',
    vehicleId: 'depot',
    vehicleName: 'Hauptlager (M-ONE)',
    status: 'paid',
    notes: 'KEDS Stromrechnung Lager & Beleuchtung',
    created_at: '2026-08-08T11:00:00Z',
    updated_at: '2026-08-08T11:00:00Z',
  },
  {
    id: 'exp-2026-08-04',
    title: 'Lagerhallen-Miete Fushë Kosovë',
    category: 'rent',
    amount: 650.0,
    date: '2026-08-01',
    month: '2026-08',
    vehicleId: 'depot',
    vehicleName: 'Hauptlager (M-ONE)',
    status: 'paid',
    notes: 'Monatsmiete August 2026 Hauptlager',
    created_at: '2026-08-01T09:00:00Z',
    updated_at: '2026-08-01T09:00:00Z',
  },

  // Juli 2026
  {
    id: 'exp-2026-07-01',
    title: 'Diesel Fahrzeug 1 (Depo Mensuri)',
    category: 'fuel',
    amount: 185.4,
    date: '2026-07-28',
    month: '2026-07',
    vehicleId: 'vehicle-1',
    vehicleName: 'Fahrzeug 1 (Depo Mensuri)',
    driverName: 'Mensuri',
    fuelLiters: 142,
    mileage: 183200,
    status: 'paid',
    notes: 'Diesel Monat Juli Tour Süd/Ost',
    created_at: '2026-07-28T16:00:00Z',
    updated_at: '2026-07-28T16:00:00Z',
  },
  {
    id: 'exp-2026-07-02',
    title: 'Diesel Fahrzeug 2 (Depo Qerimi)',
    category: 'fuel',
    amount: 172.8,
    date: '2026-07-25',
    month: '2026-07',
    vehicleId: 'vehicle-2',
    vehicleName: 'Fahrzeug 2 (Depo Qerimi)',
    driverName: 'Qerimi',
    fuelLiters: 132,
    mileage: 161100,
    status: 'paid',
    notes: 'Diesel Monat Juli Tour West/Nord',
    created_at: '2026-07-25T15:30:00Z',
    updated_at: '2026-07-25T15:30:00Z',
  },
  {
    id: 'exp-2026-07-03',
    title: 'Stromrechnung Hauptlager (KEDS)',
    category: 'electricity',
    amount: 138.9,
    date: '2026-07-10',
    month: '2026-07',
    vehicleId: 'depot',
    vehicleName: 'Hauptlager (M-ONE)',
    status: 'paid',
    notes: 'KEDS Stromrechnung Juli',
    created_at: '2026-07-10T10:00:00Z',
    updated_at: '2026-07-10T10:00:00Z',
  },
  {
    id: 'exp-2026-07-04',
    title: 'Lagerhallen-Miete Fushë Kosovë',
    category: 'rent',
    amount: 650.0,
    date: '2026-07-01',
    month: '2026-07',
    vehicleId: 'depot',
    vehicleName: 'Hauptlager (M-ONE)',
    status: 'paid',
    notes: 'Monatsmiete Juli 2026',
    created_at: '2026-07-01T09:00:00Z',
    updated_at: '2026-07-01T09:00:00Z',
  },
  {
    id: 'exp-2026-07-05',
    title: 'Ölwechsel & Inspektion Fahrzeug 1',
    category: 'maintenance',
    amount: 220.0,
    date: '2026-07-18',
    month: '2026-07',
    vehicleId: 'vehicle-1',
    vehicleName: 'Fahrzeug 1 (Depo Mensuri)',
    driverName: 'Mensuri',
    status: 'paid',
    notes: 'Motoröl, Filter & Bremsenkontrolle Werkstatt Ferizaj',
    created_at: '2026-07-18T14:00:00Z',
    updated_at: '2026-07-18T14:00:00Z',
  },

  // Juni 2026
  {
    id: 'exp-2026-06-01',
    title: 'Diesel Fahrzeug 1 (Depo Mensuri)',
    category: 'fuel',
    amount: 195.0,
    date: '2026-06-26',
    month: '2026-06',
    vehicleId: 'vehicle-1',
    vehicleName: 'Fahrzeug 1 (Depo Mensuri)',
    driverName: 'Mensuri',
    fuelLiters: 150,
    status: 'paid',
    created_at: '2026-06-26T17:00:00Z',
    updated_at: '2026-06-26T17:00:00Z',
  },
  {
    id: 'exp-2026-06-02',
    title: 'Diesel Fahrzeug 2 (Depo Qerimi)',
    category: 'fuel',
    amount: 188.5,
    date: '2026-06-24',
    month: '2026-06',
    vehicleId: 'vehicle-2',
    vehicleName: 'Fahrzeug 2 (Depo Qerimi)',
    driverName: 'Qerimi',
    fuelLiters: 145,
    status: 'paid',
    created_at: '2026-06-24T16:00:00Z',
    updated_at: '2026-06-24T16:00:00Z',
  },
  {
    id: 'exp-2026-06-03',
    title: 'Stromrechnung Hauptlager (KEDS)',
    category: 'electricity',
    amount: 129.4,
    date: '2026-06-09',
    month: '2026-06',
    vehicleId: 'depot',
    status: 'paid',
    created_at: '2026-06-09T10:00:00Z',
    updated_at: '2026-06-09T10:00:00Z',
  },
  {
    id: 'exp-2026-06-04',
    title: 'Lagerhallen-Miete Fushë Kosovë',
    category: 'rent',
    amount: 650.0,
    date: '2026-06-01',
    month: '2026-06',
    vehicleId: 'depot',
    status: 'paid',
    created_at: '2026-06-01T09:00:00Z',
    updated_at: '2026-06-01T09:00:00Z',
  },

  // Mai 2026
  {
    id: 'exp-2026-05-01',
    title: 'Diesel Fahrzeug 1 & 2',
    category: 'fuel',
    amount: 365.0,
    date: '2026-05-25',
    month: '2026-05',
    status: 'paid',
    created_at: '2026-05-25T12:00:00Z',
    updated_at: '2026-05-25T12:00:00Z',
  },
  {
    id: 'exp-2026-05-02',
    title: 'Strom & Nebenkosten Lager',
    category: 'electricity',
    amount: 135.0,
    date: '2026-05-10',
    month: '2026-05',
    status: 'paid',
    created_at: '2026-05-10T10:00:00Z',
    updated_at: '2026-05-10T10:00:00Z',
  },
  {
    id: 'exp-2026-05-03',
    title: 'Lagerhallen-Miete',
    category: 'rent',
    amount: 650.0,
    date: '2026-05-01',
    month: '2026-05',
    status: 'paid',
    created_at: '2026-05-01T09:00:00Z',
    updated_at: '2026-05-01T09:00:00Z',
  },

  // April 2026
  {
    id: 'exp-2026-04-01',
    title: 'Diesel Fahrzeuge',
    category: 'fuel',
    amount: 350.0,
    date: '2026-04-25',
    month: '2026-04',
    status: 'paid',
    created_at: '2026-04-25T12:00:00Z',
    updated_at: '2026-04-25T12:00:00Z',
  },
  {
    id: 'exp-2026-04-02',
    title: 'Strom & Miete Lager',
    category: 'rent',
    amount: 780.0,
    date: '2026-04-01',
    month: '2026-04',
    status: 'paid',
    created_at: '2026-04-01T09:00:00Z',
    updated_at: '2026-04-01T09:00:00Z',
  },

  // März 2026
  {
    id: 'exp-2026-03-01',
    title: 'Diesel Fahrzeuge',
    category: 'fuel',
    amount: 340.0,
    date: '2026-03-25',
    month: '2026-03',
    status: 'paid',
    created_at: '2026-03-25T12:00:00Z',
    updated_at: '2026-03-25T12:00:00Z',
  },
  {
    id: 'exp-2026-03-02',
    title: 'Strom & Miete Lager',
    category: 'rent',
    amount: 790.0,
    date: '2026-03-01',
    month: '2026-03',
    status: 'paid',
    created_at: '2026-03-01T09:00:00Z',
    updated_at: '2026-03-01T09:00:00Z',
  },

  // Februar 2026
  {
    id: 'exp-2026-02-01',
    title: 'Diesel Fahrzeuge',
    category: 'fuel',
    amount: 320.0,
    date: '2026-02-25',
    month: '2026-02',
    status: 'paid',
    created_at: '2026-02-25T12:00:00Z',
    updated_at: '2026-02-25T12:00:00Z',
  },
  {
    id: 'exp-2026-02-02',
    title: 'Strom & Miete Lager',
    category: 'rent',
    amount: 810.0,
    date: '2026-02-01',
    month: '2026-02',
    status: 'paid',
    created_at: '2026-02-01T09:00:00Z',
    updated_at: '2026-02-01T09:00:00Z',
  },

  // Januar 2026
  {
    id: 'exp-2026-01-01',
    title: 'Diesel Fahrzeuge',
    category: 'fuel',
    amount: 290.0,
    date: '2026-01-25',
    month: '2026-01',
    status: 'paid',
    created_at: '2026-01-25T12:00:00Z',
    updated_at: '2026-01-25T12:00:00Z',
  },
  {
    id: 'exp-2026-01-02',
    title: 'Strom & Miete Lager',
    category: 'rent',
    amount: 830.0,
    date: '2026-01-01',
    month: '2026-01',
    status: 'paid',
    created_at: '2026-01-01T09:00:00Z',
    updated_at: '2026-01-01T09:00:00Z',
  },
]

// Helper: Calculate automatic driver salaries from sales
export function calculateAutomaticSalariesFromSales(salesList: any[] = MOCK_2026_SALES): ExpenseEntry[] {
  const monthlyMap: Record<
    string,
    {
      monthKey: string
      mensuriPieces: number
      mensuriCommission: number
      qerimiPieces: number
      qerimiCommission: number
    }
  > = {}

  salesList.forEach((s) => {
    const d = s.created_at || s.date || '2026-01-01'
    const monthKey = d.slice(0, 7)
    if (!monthKey.match(/^\d{4}-\d{2}$/)) return

    if (!monthlyMap[monthKey]) {
      monthlyMap[monthKey] = {
        monthKey,
        mensuriPieces: 0,
        mensuriCommission: 0,
        qerimiPieces: 0,
        qerimiCommission: 0,
      }
    }

    const driver =
      s.driver_name === 'Mensuri' || s.vehicle_location_name?.includes('Mensuri') || (s.customer_number || '').startsWith('2')
        ? 'Mensuri'
        : 'Qerimi'

    ;(s.items || []).forEach((it: any) => {
      const qty = Number(it.qty) || 0
      const rate = Number(it.rate) || 0.17
      const comm = qty * rate

      if (driver === 'Mensuri') {
        monthlyMap[monthKey].mensuriPieces += qty
        monthlyMap[monthKey].mensuriCommission += comm
      } else {
        monthlyMap[monthKey].qerimiPieces += qty
        monthlyMap[monthKey].qerimiCommission += comm
      }
    })
  })

  const salaryEntries: ExpenseEntry[] = []

  Object.values(monthlyMap).forEach((m) => {
    const lastDayOfMonth = new Date(
      parseInt(m.monthKey.slice(0, 4)),
      parseInt(m.monthKey.slice(5, 7)),
      0
    )
      .toISOString()
      .slice(0, 10)

    // Mensuri Total Salary
    if (m.mensuriPieces > 0) {
      const totalMensuri = Math.round((m.mensuriCommission + FIXED_DRIVER_SALARY) * 100) / 100
      salaryEntries.push({
        id: `auto-salary-mensuri-${m.monthKey}`,
        title: `Fahrerlohn Mensuri (${m.monthKey})`,
        category: 'salary',
        amount: totalMensuri,
        date: lastDayOfMonth,
        month: m.monthKey,
        vehicleId: 'vehicle-1',
        vehicleName: 'Fahrzeug 1 (Depo Mensuri)',
        driverName: 'Mensuri',
        isAutomatic: true,
        status: 'paid',
        notes: `Automatische Lohnabrechnung: ${Math.round(m.mensuriPieces)} Stk. (${m.mensuriCommission.toFixed(2)} €) + ${FIXED_DRIVER_SALARY.toFixed(2)} € Fixlohn`,
        created_at: `${lastDayOfMonth}T18:00:00Z`,
        updated_at: `${lastDayOfMonth}T18:00:00Z`,
      })
    }

    // Qerimi Total Salary
    if (m.qerimiPieces > 0) {
      const totalQerimi = Math.round((m.qerimiCommission + FIXED_DRIVER_SALARY) * 100) / 100
      salaryEntries.push({
        id: `auto-salary-qerimi-${m.monthKey}`,
        title: `Fahrerlohn Qerimi (${m.monthKey})`,
        category: 'salary',
        amount: totalQerimi,
        date: lastDayOfMonth,
        month: m.monthKey,
        vehicleId: 'vehicle-2',
        vehicleName: 'Fahrzeug 2 (Depo Qerimi)',
        driverName: 'Qerimi',
        isAutomatic: true,
        status: 'paid',
        notes: `Automatische Lohnabrechnung: ${Math.round(m.qerimiPieces)} Stk. (${m.qerimiCommission.toFixed(2)} €) + ${FIXED_DRIVER_SALARY.toFixed(2)} € Fixlohn`,
        created_at: `${lastDayOfMonth}T18:00:00Z`,
        updated_at: `${lastDayOfMonth}T18:00:00Z`,
      })
    }
  })

  return salaryEntries
}

// ──────────────────────────────────────────────────────────────
// EXPENSES STORAGE & QUERY FUNCTIONS
// ──────────────────────────────────────────────────────────────
export function getCustomExpenses(): ExpenseEntry[] {
  if (typeof window === 'undefined') return INITIAL_DEMO_EXPENSES
  try {
    const raw = localStorage.getItem(EXPENSES_STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.error('Error reading expenses from localStorage:', e)
  }
  return INITIAL_DEMO_EXPENSES
}

export function getAllExpenses(salesList: any[] = MOCK_2026_SALES): ExpenseEntry[] {
  const manual = getCustomExpenses()
  const autoSalaries = calculateAutomaticSalariesFromSales(salesList)

  // Merge manual and auto-generated salaries (manual overrides auto if id matches)
  const combined = [...manual]
  autoSalaries.forEach((auto) => {
    if (!combined.some((c) => c.id === auto.id)) {
      combined.push(auto)
    }
  })

  return combined.sort((a, b) => b.date.localeCompare(a.date))
}

export function saveExpense(expense: ExpenseEntry): ExpenseEntry {
  const manual = getCustomExpenses()
  const idx = manual.findIndex((e) => e.id === expense.id)

  let updatedList: ExpenseEntry[]
  if (idx >= 0) {
    manual[idx] = { ...expense, updated_at: new Date().toISOString() }
    updatedList = [...manual]
  } else {
    updatedList = [{ ...expense, updated_at: new Date().toISOString() }, ...manual]
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(updatedList))
    window.dispatchEvent(new CustomEvent('m_one_expenses_updated', { detail: { expense } }))

    // Background server sync
    fetch('/api/expenses/record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ expense }),
    }).catch((e) => console.warn('Expense server sync notice:', e))
  }

  return expense
}

export function deleteExpense(expenseId: string): boolean {
  const manual = getCustomExpenses()
  const filtered = manual.filter((e) => e.id !== expenseId)

  if (typeof window !== 'undefined') {
    localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(filtered))
    window.dispatchEvent(new CustomEvent('m_one_expenses_updated', { detail: { deletedId: expenseId } }))

    fetch('/api/expenses/record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', expenseId }),
    }).catch((e) => console.warn('Expense delete sync notice:', e))
  }

  return true
}

// ──────────────────────────────────────────────────────────────
// TAX ENGINE (Automatische Steuer-Berechnung zum 15. des Monats)
// ──────────────────────────────────────────────────────────────
export function getTaxReminderForMonth(
  monthKey: string, // e.g. "2026-07"
  salesList: any[] = MOCK_2026_SALES,
  expensesList?: ExpenseEntry[]
): TaxReminder {
  const allExpenses = expensesList || getAllExpenses(salesList)

  // 1. Calculate revenue for this month
  const monthSales = salesList.filter((s) => {
    const d = s.created_at || s.date || '2026-01-01'
    return d.startsWith(monthKey)
  })
  const totalRevenue = monthSales.reduce((s, o) => s + (Number(o.total_amount) || 0), 0)

  // 2. Calculate operational deductible expenses (excluding taxes)
  const monthExpenses = allExpenses.filter((e) => e.month === monthKey && e.category !== 'tax')
  const totalExpenses = monthExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0)

  // 3. Tax Calculation:
  // Kosovo corporate / flat profit tax is 10% on profit (or 9% TVSH differential)
  const grossProfit = Math.max(0, totalRevenue - totalExpenses)
  const taxRate = 0.1 // 10% Gewinnsteuer / ATK Kosovo
  const estimatedTaxAmount = Math.round(grossProfit * taxRate * 100) / 100

  // 4. Due Date: 15th of the NEXT month
  const [yearStr, monthStr] = monthKey.split('-')
  const year = parseInt(yearStr)
  const month = parseInt(monthStr)

  let nextMonth = month + 1
  let nextYear = year
  if (nextMonth > 12) {
    nextMonth = 1
    nextYear += 1
  }
  const dueDate = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-15`

  // 5. Check if tax is already marked as paid
  const paidTaxExpense = allExpenses.find(
    (e) => e.category === 'tax' && (e.month === monthKey || e.taxReference?.includes(monthKey))
  )

  const monthNames = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
  ]
  const monthLabel = `${monthNames[month - 1]} ${year}`

  const todayStr = new Date().toISOString().slice(0, 10)
  let status: TaxReminder['status'] = 'upcoming'

  if (paidTaxExpense) {
    status = 'paid'
  } else if (todayStr > dueDate) {
    status = 'overdue'
  } else {
    status = 'due'
  }

  return {
    monthKey,
    dueDate,
    monthLabel,
    totalRevenue,
    totalDeductibleExpenses: totalExpenses,
    estimatedTaxAmount,
    taxRatePercent: 10,
    isPaid: Boolean(paidTaxExpense),
    paidExpenseId: paidTaxExpense?.id,
    status,
  }
}

// ──────────────────────────────────────────────────────────────
// FINANCIAL P&L SUMMARY (Gewinn- & Verlustrechnung)
// ──────────────────────────────────────────────────────────────
export function getMonthlyFinancialSummaries(
  salesList: any[] = MOCK_2026_SALES,
  expensesList?: ExpenseEntry[]
): MonthlyFinancialSummary[] {
  const allExpenses = expensesList || getAllExpenses(salesList)

  // Extract all active months
  const monthsSet = new Set<string>()
  salesList.forEach((s) => {
    const d = s.created_at || s.date || '2026-01-01'
    const m = d.slice(0, 7)
    if (m.match(/^\d{4}-\d{2}$/)) monthsSet.add(m)
  })
  allExpenses.forEach((e) => {
    if (e.month && e.month.match(/^\d{4}-\d{2}$/)) monthsSet.add(e.month)
  })

  const sortedMonths = Array.from(monthsSet).sort().reverse()

  const monthNames = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
  ]

  return sortedMonths.map((mKey) => {
    const [yearStr, monthStr] = mKey.split('-')
    const monthNum = parseInt(monthStr)
    const monthLabel = `${monthNames[monthNum - 1]} ${yearStr}`

    // Revenue
    const monthSales = salesList.filter((s) => {
      const d = s.created_at || s.date || '2026-01-01'
      return d.startsWith(mKey)
    })
    const revenue = monthSales.reduce((s, o) => s + (Number(o.total_amount) || 0), 0)

    // Expenses Breakdown
    const monthExpenses = allExpenses.filter((e) => e.month === mKey)
    let salariesExpense = 0
    let fuelExpense = 0
    let electricityExpense = 0
    let rentExpense = 0
    let taxExpense = 0
    let maintenanceExpense = 0
    let materialsExpense = 0
    let otherExpense = 0

    monthExpenses.forEach((e) => {
      const amt = Number(e.amount) || 0
      if (e.category === 'salary') salariesExpense += amt
      else if (e.category === 'fuel') fuelExpense += amt
      else if (e.category === 'electricity') electricityExpense += amt
      else if (e.category === 'rent') rentExpense += amt
      else if (e.category === 'tax') taxExpense += amt
      else if (e.category === 'maintenance') maintenanceExpense += amt
      else if (e.category === 'materials') materialsExpense += amt
      else otherExpense += amt
    })

    const totalExpenses = monthExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0)
    const netProfit = revenue - totalExpenses
    const profitMarginPercent = revenue > 0 ? (netProfit / revenue) * 100 : 0

    const taxReminder = getTaxReminderForMonth(mKey, salesList, allExpenses)

    return {
      monthKey: mKey,
      monthLabel,
      revenue: Math.round(revenue * 100) / 100,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      netProfit: Math.round(netProfit * 100) / 100,
      profitMarginPercent: Math.round(profitMarginPercent * 10) / 10,
      salariesExpense: Math.round(salariesExpense * 100) / 100,
      fuelExpense: Math.round(fuelExpense * 100) / 100,
      electricityExpense: Math.round(electricityExpense * 100) / 100,
      rentExpense: Math.round(rentExpense * 100) / 100,
      taxExpense: Math.round(taxExpense * 100) / 100,
      maintenanceExpense: Math.round(maintenanceExpense * 100) / 100,
      materialsExpense: Math.round(materialsExpense * 100) / 100,
      otherExpense: Math.round(otherExpense * 100) / 100,
      taxReminder,
    }
  })
}

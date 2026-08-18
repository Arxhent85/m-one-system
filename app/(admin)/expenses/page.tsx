import type { Metadata } from 'next'
import ExpenseListView from '@/components/expenses/ExpenseListView'

export const metadata: Metadata = {
  title: 'Betriebsausgaben, Finanzen & GuV | M-ONE ERP',
}

export default function ExpensesPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-200">
      <ExpenseListView />
    </div>
  )
}

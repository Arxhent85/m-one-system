'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Banknote,
  Coins,
  TrendingUp,
  Package,
  Users,
  Truck,
  Calendar,
  Search,
  Filter,
  Printer,
  ChevronRight,
  Eye,
  FileText,
  CheckCircle2,
  Receipt,
  Download,
} from 'lucide-react'
import { formatCurrency, formatNumber } from '@/lib/utils/currency'
import {
  getCommissionRate,
  calculateItemCommission,
  calculateOrderCommission,
  getDriverForSale,
  formatMonthKey,
  COMMISSION_RATES,
} from '@/lib/commission'
import { getSalesHistory } from '@/lib/stockStore'
import PayrollPrintModal from './PayrollPrintModal'
import InvoiceDetailModal from '@/components/orders/InvoiceDetailModal'

export default function PayrollView() {
  const [salesList, setSalesList] = useState<any[]>([])
  const [selectedMonth, setSelectedMonth] = useState<string>('all')
  const [driverFilter, setDriverFilter] = useState<'all' | 'Mensuri' | 'Qerimi'>('all')
  const [activeTab, setActiveTab] = useState<'overview' | 'months' | 'products' | 'invoices'>('overview')
  const [searchQuery, setSearchQuery] = useState('')

  // Modals
  const [printModalData, setPrintModalData] = useState<{
    driverName: string
    monthKey: string
    totalCommission: number
    totalPieces: number
    totalSalesVolume: number
    totalOrders: number
    itemBreakdown: any[]
  } | null>(null)

  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null)

  // Real-time Fetch from Server
  useEffect(() => {
    function loadSales() {
      fetch('/api/sales/record')
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            if (data.isCleared || (Array.isArray(data.sales) && data.sales.length === 0)) {
              setSalesList([])
            } else if (Array.isArray(data.sales) && data.sales.length > 0) {
              setSalesList(data.sales)
            }
          }
        })
        .catch(() => {
          const local = getSalesHistory()
          setSalesList(local)
        })
    }

    loadSales()
    window.addEventListener('focus', loadSales)
    window.addEventListener('m_one_sale_recorded', loadSales)
    return () => {
      window.removeEventListener('focus', loadSales)
      window.removeEventListener('m_one_sale_recorded', loadSales)
    }
  }, [])

  // Extract all available months from sales
  const availableMonths = useMemo(() => {
    const set = new Set<string>()
    salesList.forEach((s) => {
      const d = s.created_at || s.date || '2026-01-01'
      const key = d.slice(0, 7)
      if (key.match(/^\d{4}-\d{2}$/)) {
        set.add(key)
      }
    })
    return Array.from(set).sort().reverse()
  }, [salesList])

  // Filtered sales based on selected month & driver filter
  const filteredSales = useMemo(() => {
    return salesList.filter((s) => {
      const d = s.created_at || s.date || '2026-01-01'
      const monthKey = d.slice(0, 7)

      // Month filter
      if (selectedMonth !== 'all' && monthKey !== selectedMonth) {
        return false
      }

      // Driver filter
      const driver = getDriverForSale(s)
      if (driverFilter !== 'all' && driver !== driverFilter) {
        return false
      }

      // Search filter (Invoice #, Customer, Item SKU)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const orderNum = (s.order_number || '').toLowerCase()
        const custNum = (s.customer_number || s.customers?.customer_number || '').toLowerCase()
        const custName = (s.customer_name || s.customers?.company_name || '').toLowerCase()
        const hasItem = (s.items || []).some((it: any) =>
          (it.sku || '').toLowerCase().includes(q) || (it.name || '').toLowerCase().includes(q)
        )
        return orderNum.includes(q) || custNum.includes(q) || custName.includes(q) || hasItem
      }

      return true
    })
  }, [salesList, selectedMonth, driverFilter, searchQuery])

  // Monthly Aggregated Stats
  const monthlyStats = useMemo(() => {
    const map: Record<
      string,
      {
        monthKey: string
        mensuriComm: number
        mensuriPieces: number
        mensuriOrders: number
        mensuriVolume: number
        qerimiComm: number
        qerimiPieces: number
        qerimiOrders: number
        qerimiVolume: number
        totalComm: number
        totalPieces: number
        totalOrders: number
        totalVolume: number
      }
    > = {}

    salesList.forEach((s) => {
      const d = s.created_at || s.date || '2026-01-01'
      const monthKey = d.slice(0, 7)
      if (!map[monthKey]) {
        map[monthKey] = {
          monthKey,
          mensuriComm: 0,
          mensuriPieces: 0,
          mensuriOrders: 0,
          mensuriVolume: 0,
          qerimiComm: 0,
          qerimiPieces: 0,
          qerimiOrders: 0,
          qerimiVolume: 0,
          totalComm: 0,
          totalPieces: 0,
          totalOrders: 0,
          totalVolume: 0,
        }
      }

      const driver = getDriverForSale(s)
      const orderComm = calculateOrderCommission(s)
      const vol = Number(s.total_amount || 0)

      map[monthKey].totalComm += orderComm.totalCommission
      map[monthKey].totalPieces += orderComm.totalPieces
      map[monthKey].totalOrders += 1
      map[monthKey].totalVolume += vol

      if (driver === 'Mensuri') {
        map[monthKey].mensuriComm += orderComm.totalCommission
        map[monthKey].mensuriPieces += orderComm.totalPieces
        map[monthKey].mensuriOrders += 1
        map[monthKey].mensuriVolume += vol
      } else {
        map[monthKey].qerimiComm += orderComm.totalCommission
        map[monthKey].qerimiPieces += orderComm.totalPieces
        map[monthKey].qerimiOrders += 1
        map[monthKey].qerimiVolume += vol
      }
    })

    return Object.values(map).sort((a, b) => b.monthKey.localeCompare(a.monthKey))
  }, [salesList])

  // Driver-specific totals for the currently filtered view
  const driverTotals = useMemo(() => {
    let mensuriComm = 0
    let mensuriPieces = 0
    let mensuriOrders = 0
    let mensuriVolume = 0

    let qerimiComm = 0
    let qerimiPieces = 0
    let qerimiOrders = 0
    let qerimiVolume = 0

    const mensuriItemsMap: Record<string, { sku: string; name: string; qty: number; rate: number; commission: number }> = {}
    const qerimiItemsMap: Record<string, { sku: string; name: string; qty: number; rate: number; commission: number }> = {}

    filteredSales.forEach((s) => {
      const driver = getDriverForSale(s)
      const { totalCommission, totalPieces, itemsCommission } = calculateOrderCommission(s)
      const vol = Number(s.total_amount || 0)

      if (driver === 'Mensuri') {
        mensuriComm += totalCommission
        mensuriPieces += totalPieces
        mensuriOrders += 1
        mensuriVolume += vol

        itemsCommission.forEach((it) => {
          if (!mensuriItemsMap[it.sku]) {
            mensuriItemsMap[it.sku] = { ...it, qty: 0, commission: 0 }
          }
          mensuriItemsMap[it.sku].qty += it.qty
          mensuriItemsMap[it.sku].commission += it.commission
        })
      } else {
        qerimiComm += totalCommission
        qerimiPieces += totalPieces
        qerimiOrders += 1
        qerimiVolume += vol

        itemsCommission.forEach((it) => {
          if (!qerimiItemsMap[it.sku]) {
            qerimiItemsMap[it.sku] = { ...it, qty: 0, commission: 0 }
          }
          qerimiItemsMap[it.sku].qty += it.qty
          qerimiItemsMap[it.sku].commission += it.commission
        })
      }
    })

    return {
      mensuri: {
        comm: Math.round(mensuriComm * 100) / 100,
        pieces: mensuriPieces,
        orders: mensuriOrders,
        volume: Math.round(mensuriVolume * 100) / 100,
        itemBreakdown: Object.values(mensuriItemsMap).sort((a, b) => b.commission - a.commission),
      },
      qerimi: {
        comm: Math.round(qerimiComm * 100) / 100,
        pieces: qerimiPieces,
        orders: qerimiOrders,
        volume: Math.round(qerimiVolume * 100) / 100,
        itemBreakdown: Object.values(qerimiItemsMap).sort((a, b) => b.commission - a.commission),
      },
      combinedComm: Math.round((mensuriComm + qerimiComm) * 100) / 100,
      combinedPieces: mensuriPieces + qerimiPieces,
      combinedOrders: mensuriOrders + qerimiOrders,
      combinedVolume: Math.round((mensuriVolume + qerimiVolume) * 100) / 100,
    }
  }, [filteredSales])

  // Product Commission Matrix / Top Products
  const productCommissionTable = useMemo(() => {
    const map: Record<
      string,
      {
        sku: string
        name: string
        rate: number
        mensuriQty: number
        qerimiQty: number
        totalQty: number
        mensuriComm: number
        qerimiComm: number
        totalComm: number
      }
    > = {}

    // Initialize with all known SKUs in COMMISSION_RATES
    Object.entries(COMMISSION_RATES).forEach(([sku, rate]) => {
      map[sku] = {
        sku,
        name: 'Artikel ' + sku,
        rate,
        mensuriQty: 0,
        qerimiQty: 0,
        totalQty: 0,
        mensuriComm: 0,
        qerimiComm: 0,
        totalComm: 0,
      }
    })

    // Sum from filtered sales
    filteredSales.forEach((s) => {
      const driver = getDriverForSale(s)
      const { itemsCommission } = calculateOrderCommission(s)

      itemsCommission.forEach((it) => {
        if (!map[it.sku]) {
          map[it.sku] = {
            sku: it.sku,
            name: it.name,
            rate: it.rate,
            mensuriQty: 0,
            qerimiQty: 0,
            totalQty: 0,
            mensuriComm: 0,
            qerimiComm: 0,
            totalComm: 0,
          }
        } else if (it.name && map[it.sku].name.startsWith('Artikel ')) {
          map[it.sku].name = it.name
        }

        map[it.sku].totalQty += it.qty
        map[it.sku].totalComm += it.commission

        if (driver === 'Mensuri') {
          map[it.sku].mensuriQty += it.qty
          map[it.sku].mensuriComm += it.commission
        } else {
          map[it.sku].qerimiQty += it.qty
          map[it.sku].qerimiComm += it.commission
        }
      })
    })

    return Object.values(map).sort((a, b) => b.totalComm - a.totalComm)
  }, [filteredSales])

  // Open Print Modal for Driver
  function openDriverPrint(driver: 'Mensuri' | 'Qerimi', monthKey = selectedMonth) {
    const isMensuri = driver === 'Mensuri'
    const targetSales = salesList.filter((s) => {
      const d = s.created_at || s.date || '2026-01-01'
      const m = d.slice(0, 7)
      if (monthKey !== 'all' && m !== monthKey) return false
      return getDriverForSale(s) === driver
    })

    let totalComm = 0
    let totalPieces = 0
    let totalVol = 0
    const itemMap: Record<string, any> = {}

    targetSales.forEach((s) => {
      const { totalCommission, totalPieces: p, itemsCommission } = calculateOrderCommission(s)
      totalComm += totalCommission
      totalPieces += p
      totalVol += Number(s.total_amount || 0)

      itemsCommission.forEach((it) => {
        if (!itemMap[it.sku]) itemMap[it.sku] = { ...it, qty: 0, commission: 0 }
        itemMap[it.sku].qty += it.qty
        itemMap[it.sku].commission += it.commission
      })
    })

    setPrintModalData({
      driverName: driver,
      monthKey,
      totalCommission: Math.round(totalComm * 100) / 100,
      totalPieces,
      totalSalesVolume: Math.round(totalVol * 100) / 100,
      totalOrders: targetSales.length,
      itemBreakdown: Object.values(itemMap).sort((a, b) => b.commission - a.commission),
    })
  }

  return (
    <div className="space-y-6 animate-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-50 flex items-center gap-2.5">
            <Coins className="w-6 h-6 text-brand-400" />
            Lohn & Fahrer-Provisionen
          </h1>
          <p className="text-surface-400 text-sm mt-1">
            Automatische Stück-Provisionsabrechnung (1. bis Monatsende) für Fahrer Mensuri & Qerimi
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => openDriverPrint('Mensuri')}
            className="btn-secondary py-2 px-3 text-xs font-semibold flex items-center gap-1.5 border-emerald-500/30 text-emerald-300 hover:border-emerald-400"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            Lohnzettel Mensuri
          </button>
          <button
            onClick={() => openDriverPrint('Qerimi')}
            className="btn-secondary py-2 px-3 text-xs font-semibold flex items-center gap-1.5 border-cyan-500/30 text-cyan-300 hover:border-cyan-400"
          >
            <Printer className="w-4 h-4 text-cyan-400" />
            Lohnzettel Qerimi
          </button>
        </div>
      </div>

      {/* Filter Toolbar: Monatsauswahl & Fahrerfilter */}
      <div className="glass-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-surface-700/60 bg-surface-900/60">
        
        {/* Month Selector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scroll-hidden">
          <span className="text-xs font-semibold text-surface-400 uppercase tracking-wider mr-1 flex items-center gap-1 shrink-0">
            <Calendar className="w-3.5 h-3.5 text-brand-400" />
            Monat:
          </span>

          <button
            onClick={() => setSelectedMonth('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-all ${
              selectedMonth === 'all'
                ? 'bg-brand-600 text-white shadow-glow'
                : 'bg-surface-800 text-surface-300 hover:bg-surface-700 hover:text-surface-100'
            }`}
          >
            Gesamtes Jahr 2026
          </button>

          {availableMonths.map((m) => (
            <button
              key={m}
              onClick={() => setSelectedMonth(m)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-all ${
                selectedMonth === m
                  ? 'bg-brand-600 text-white shadow-glow'
                  : 'bg-surface-800 text-surface-300 hover:bg-surface-700 hover:text-surface-100'
              }`}
            >
              {formatMonthKey(m)}
            </button>
          ))}
        </div>

        {/* Driver Filter & Search */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center rounded-lg bg-surface-800/80 p-0.5 border border-surface-700/60">
            <button
              onClick={() => setDriverFilter('all')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                driverFilter === 'all' ? 'bg-surface-700 text-white font-semibold' : 'text-surface-400 hover:text-surface-200'
              }`}
            >
              Alle Fahrer
            </button>
            <button
              onClick={() => setDriverFilter('Mensuri')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                driverFilter === 'Mensuri' ? 'bg-emerald-900/60 text-emerald-300 font-semibold border border-emerald-500/30' : 'text-surface-400 hover:text-surface-200'
              }`}
            >
              Mensuri
            </button>
            <button
              onClick={() => setDriverFilter('Qerimi')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                driverFilter === 'Qerimi' ? 'bg-cyan-900/60 text-cyan-300 font-semibold border border-cyan-500/30' : 'text-surface-400 hover:text-surface-200'
              }`}
            >
              Qerimi
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-surface-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Suchen (SKU, Faktura, Kd)…"
              className="input pl-8 py-1.5 text-xs w-48 bg-surface-800/90"
            />
          </div>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Commission */}
        <div className="glass-card p-4 border border-brand-500/30 bg-gradient-to-br from-brand-950/40 via-surface-900 to-surface-900">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-brand-300 uppercase tracking-wider">Gesamt-Provision</p>
            <div className="w-8 h-8 rounded-lg bg-brand-900/60 text-brand-400 flex items-center justify-center">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-surface-50 mt-2">
            {formatCurrency(driverTotals.combinedComm)}
          </p>
          <p className="text-[11px] text-surface-400 mt-1 flex items-center gap-1">
            <span className="text-emerald-400 font-medium">{formatNumber(driverTotals.combinedPieces)}</span> verkaufte Einheiten
          </p>
        </div>

        {/* Mensuri Salary Card */}
        <div className="glass-card p-4 border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 via-surface-900 to-surface-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">Lohn Mensuri</p>
              <p className="text-[10px] text-surface-400">Fahrzeug 1 (Kd 2xxxx)</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-900/60 text-emerald-400 flex items-center justify-center font-bold text-xs">
              M
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-300 mt-2">
            {formatCurrency(driverTotals.mensuri.comm)}
          </p>
          <div className="flex items-center justify-between text-[11px] text-surface-400 mt-1">
            <span>{formatNumber(driverTotals.mensuri.pieces)} Stk · {formatNumber(driverTotals.mensuri.orders)} Fakt.</span>
            <button
              onClick={() => openDriverPrint('Mensuri')}
              className="text-emerald-400 hover:underline flex items-center gap-0.5"
            >
              Lohnzettel <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Qerimi Salary Card */}
        <div className="glass-card p-4 border border-cyan-500/30 bg-gradient-to-br from-cyan-950/40 via-surface-900 to-surface-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-cyan-300 uppercase tracking-wider">Lohn Qerimi</p>
              <p className="text-[10px] text-surface-400">Fahrzeug 2 (Kd 1xxxx)</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-cyan-900/60 text-cyan-400 flex items-center justify-center font-bold text-xs">
              Q
            </div>
          </div>
          <p className="text-2xl font-black text-cyan-300 mt-2">
            {formatCurrency(driverTotals.qerimi.comm)}
          </p>
          <div className="flex items-center justify-between text-[11px] text-surface-400 mt-1">
            <span>{formatNumber(driverTotals.qerimi.pieces)} Stk · {formatNumber(driverTotals.qerimi.orders)} Fakt.</span>
            <button
              onClick={() => openDriverPrint('Qerimi')}
              className="text-cyan-400 hover:underline flex items-center gap-0.5"
            >
              Lohnzettel <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Total Sales Volume */}
        <div className="glass-card p-4 border border-surface-700/60 bg-surface-900">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider">Verkaufsvolumen</p>
            <div className="w-8 h-8 rounded-lg bg-surface-800 text-surface-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-surface-50 mt-2">
            {formatCurrency(driverTotals.combinedVolume)}
          </p>
          <p className="text-[11px] text-surface-400 mt-1">
            Ø {formatCurrency(driverTotals.combinedOrders > 0 ? driverTotals.combinedComm / driverTotals.combinedOrders : 0)} Provision / Faktur
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-surface-700/60">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'overview'
              ? 'border-brand-500 text-brand-400 bg-brand-950/20'
              : 'border-transparent text-surface-400 hover:text-surface-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Monatliche Abrechnungen ({monthlyStats.length})
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'products'
              ? 'border-brand-500 text-brand-400 bg-brand-950/20'
              : 'border-transparent text-surface-400 hover:text-surface-200'
          }`}
        >
          <Package className="w-4 h-4" />
          Artikel & Provisionsmatrix ({productCommissionTable.filter((p) => p.totalQty > 0).length})
        </button>

        <button
          onClick={() => setActiveTab('invoices')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'invoices'
              ? 'border-brand-500 text-brand-400 bg-brand-950/20'
              : 'border-transparent text-surface-400 hover:text-surface-200'
          }`}
        >
          <Receipt className="w-4 h-4" />
          Fakturen-Einzelnachweis ({filteredSales.length})
        </button>
      </div>

      {/* TAB 1: Monatliche Abrechnungen */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-xl border border-surface-700/60 bg-surface-900">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-800/80 text-surface-300 uppercase text-[10px] font-semibold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Abrechnungsmonat</th>
                  <th className="py-3 px-4 text-right">Lohn Mensuri (Kd 2xxxx)</th>
                  <th className="py-3 px-4 text-right">Lohn Qerimi (Kd 1xxxx)</th>
                  <th className="py-3 px-4 text-right">Gesamtstückzahl</th>
                  <th className="py-3 px-4 text-right">Umsatzvolumen</th>
                  <th className="py-3 px-4 text-right font-bold">Gesamtauszahlung</th>
                  <th className="py-3 px-4 text-center">Lohnzettel drucken</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-700/40">
                {monthlyStats.map((row) => (
                  <tr key={row.monthKey} className="hover:bg-surface-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-surface-100 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-brand-400" />
                      {formatMonthKey(row.monthKey)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-mono font-bold text-emerald-400">{formatCurrency(row.mensuriComm)}</span>
                      <p className="text-[10px] text-surface-400">{formatNumber(row.mensuriPieces)} Stk ({row.mensuriOrders} Fakt.)</p>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-mono font-bold text-cyan-400">{formatCurrency(row.qerimiComm)}</span>
                      <p className="text-[10px] text-surface-400">{formatNumber(row.qerimiPieces)} Stk ({row.qerimiOrders} Fakt.)</p>
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-surface-200">
                      {formatNumber(row.totalPieces)} Stk
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-surface-300">
                      {formatCurrency(row.totalVolume)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-sm text-brand-300">
                      {formatCurrency(row.totalComm)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openDriverPrint('Mensuri', row.monthKey)}
                          className="px-2 py-1 bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 hover:border-emerald-400 rounded text-[11px] font-semibold"
                          title="Lohnzettel Mensuri für diesen Monat"
                        >
                          Mensuri
                        </button>
                        <button
                          onClick={() => openDriverPrint('Qerimi', row.monthKey)}
                          className="px-2 py-1 bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 hover:border-cyan-400 rounded text-[11px] font-semibold"
                          title="Lohnzettel Qerimi für diesen Monat"
                        >
                          Qerimi
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-surface-800/90 font-bold border-t-2 border-surface-600 text-surface-100">
                <tr>
                  <td className="py-3.5 px-4 uppercase text-xs">Gesamtsumme 2026</td>
                  <td className="py-3.5 px-4 text-right text-emerald-400 font-mono text-sm">
                    {formatCurrency(driverTotals.mensuri.comm)}
                  </td>
                  <td className="py-3.5 px-4 text-right text-cyan-400 font-mono text-sm">
                    {formatCurrency(driverTotals.qerimi.comm)}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {formatNumber(driverTotals.combinedPieces)} Stk
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {formatCurrency(driverTotals.combinedVolume)}
                  </td>
                  <td className="py-3.5 px-4 text-right text-base text-brand-400 font-mono">
                    {formatCurrency(driverTotals.combinedComm)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Artikel & Provisionsmatrix */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-xl border border-surface-700/60 bg-surface-900">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-800/80 text-surface-300 uppercase text-[10px] font-semibold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Art. Nr. (SKU)</th>
                  <th className="py-3 px-4">Artikelbezeichnung</th>
                  <th className="py-3 px-4 text-right font-bold text-brand-300">Provisionssatz (€/Stk)</th>
                  <th className="py-3 px-4 text-right">Mensuri Menge</th>
                  <th className="py-3 px-4 text-right">Qerimi Menge</th>
                  <th className="py-3 px-4 text-right font-medium">Gesamt-Stückzahl</th>
                  <th className="py-3 px-4 text-right font-bold text-surface-100">Ausbezahlte Provision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-700/40">
                {productCommissionTable.map((p) => (
                  <tr key={p.sku} className="hover:bg-surface-800/40 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-bold text-brand-300">{p.sku}</td>
                    <td className="py-2.5 px-4 text-surface-200 font-medium">{p.name}</td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-amber-400 bg-amber-950/20">
                      {p.rate.toFixed(2)} €
                    </td>
                    <td className="py-2.5 px-4 text-right font-medium text-emerald-300">
                      {p.mensuriQty > 0 ? formatNumber(p.mensuriQty) : '—'}
                    </td>
                    <td className="py-2.5 px-4 text-right font-medium text-cyan-300">
                      {p.qerimiQty > 0 ? formatNumber(p.qerimiQty) : '—'}
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-surface-100">
                      {formatNumber(p.totalQty)} Stk
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-400">
                      {formatCurrency(p.totalComm)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Fakturen-Einzelnachweis */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-xl border border-surface-700/60 bg-surface-900">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-800/80 text-surface-300 uppercase text-[10px] font-semibold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Datum</th>
                  <th className="py-3 px-4">Fakturanummer</th>
                  <th className="py-3 px-4">Fahrer</th>
                  <th className="py-3 px-4">Kunde</th>
                  <th className="py-3 px-4 text-right">Positionen</th>
                  <th className="py-3 px-4 text-right">Rechnungsbetrag</th>
                  <th className="py-3 px-4 text-right font-bold text-brand-300">Fahrer-Provision</th>
                  <th className="py-3 px-4 text-center">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-700/40">
                {filteredSales.slice(0, 100).map((s) => {
                  const driver = getDriverForSale(s)
                  const { totalCommission, totalPieces } = calculateOrderCommission(s)
                  const custNum = s.customer_number || s.customers?.customer_number || '—'
                  const custName = s.customer_name || s.customers?.company_name || 'Kunde'
                  const orderDate = (s.created_at || s.date || '').slice(0, 10)

                  return (
                    <tr key={s.id || s.order_number} className="hover:bg-surface-800/40 transition-colors">
                      <td className="py-2.5 px-4 text-surface-400 font-mono">{orderDate}</td>
                      <td className="py-2.5 px-4 font-mono font-semibold text-surface-100">{s.order_number}</td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                            driver === 'Mensuri'
                              ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-700/40'
                              : 'bg-cyan-950/60 text-cyan-300 border border-cyan-700/40'
                          }`}
                        >
                          {driver}
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        <p className="font-medium text-surface-200 truncate max-w-[200px]">{custName}</p>
                        <p className="text-[10px] font-mono text-surface-500">Kd-Nr. {custNum}</p>
                      </td>
                      <td className="py-2.5 px-4 text-right font-medium text-surface-300">
                        {totalPieces} Stk ({(s.items || []).length} Pos.)
                      </td>
                      <td className="py-2.5 px-4 text-right font-medium text-surface-200">
                        {formatCurrency(s.total_amount || 0)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-400">
                        {formatCurrency(totalCommission)}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <button
                          onClick={() => setSelectedInvoice(s)}
                          className="btn-icon text-surface-400 hover:text-brand-400 hover:bg-surface-800"
                          title="Fakturadetails ansehen"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {filteredSales.length > 100 && (
            <p className="text-xs text-surface-500 text-center py-2">
              Zeige die ersten 100 von {formatNumber(filteredSales.length)} Fakturen. Nutze die Monatsfilter für gezielte Zeiträume.
            </p>
          )}
        </div>
      )}

      {/* Lohnabrechnung Print Modal */}
      {printModalData && (
        <PayrollPrintModal
          driverName={printModalData.driverName}
          monthKey={printModalData.monthKey}
          totalCommission={printModalData.totalCommission}
          totalPieces={printModalData.totalPieces}
          totalSalesVolume={printModalData.totalSalesVolume}
          totalOrders={printModalData.totalOrders}
          itemBreakdown={printModalData.itemBreakdown}
          onClose={() => setPrintModalData(null)}
        />
      )}

      {/* Invoice Details Modal */}
      {selectedInvoice && (
        <InvoiceDetailModal
          invoice={selectedInvoice}
          sales={salesList}
          onClose={() => setSelectedInvoice(null)}
        />
      )}

    </div>
  )
}

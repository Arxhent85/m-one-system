'use client'

import { useState, useEffect } from 'react'
import { X, Check, Delete, Zap } from 'lucide-react'

interface TouchNumpadModalProps {
  isOpen: boolean
  title: string
  subtitle?: string
  initialValue: number
  max?: number
  unit?: string
  onConfirm: (value: number) => void
  onClose: () => void
}

export default function TouchNumpadModal({
  isOpen,
  title,
  subtitle,
  initialValue,
  max,
  unit = 'Stk.',
  onConfirm,
  onClose,
}: TouchNumpadModalProps) {
  const [valStr, setValStr] = useState<string>(initialValue > 0 ? initialValue.toString() : '1')

  useEffect(() => {
    if (isOpen) {
      setValStr(initialValue > 0 ? initialValue.toString() : '1')
    }
  }, [isOpen, initialValue])

  if (!isOpen) return null

  const numVal = parseInt(valStr) || 0
  const isOverMax = max !== undefined && max > 0 && numVal > max

  function handleKeyPress(digit: string) {
    if (valStr === '0' && digit !== '00') {
      setValStr(digit)
      return
    }
    if (valStr === '' && digit === '00') {
      setValStr('0')
      return
    }
    const next = valStr + digit
    if (next.length > 6) return
    setValStr(next)
  }

  function handleBackspace() {
    if (valStr.length <= 1) {
      setValStr('0')
    } else {
      setValStr(valStr.slice(0, -1))
    }
  }

  function handleClear() {
    setValStr('0')
  }

  function handleAddPreset(amount: number) {
    const current = parseInt(valStr) || 0
    const next = Math.max(0, current + amount)
    if (max !== undefined && max > 0 && next > max) {
      setValStr(max.toString())
    } else {
      setValStr(next.toString())
    }
  }

  function handleSetMax() {
    if (max !== undefined && max > 0) {
      setValStr(max.toString())
    }
  }

  function handleConfirm() {
    const finalNum = parseInt(valStr) || 0
    onConfirm(finalNum)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-150 p-0 sm:p-4">
      {/* Backdrop tap to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal / Sheet Container */}
      <div className="relative w-full max-w-md bg-surface-900 border border-surface-700 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in slide-in-from-bottom duration-200">
        
        {/* Header */}
        <div className="p-4 bg-surface-950 border-b border-surface-800 flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <h3 className="text-base font-bold text-surface-50 truncate">{title}</h3>
            {subtitle && (
              <p className="text-xs text-brand-400 font-medium truncate mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-surface-800 hover:bg-surface-700 flex items-center justify-center text-surface-400 hover:text-surface-100 shrink-0 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Display Area (Giant Numbers) */}
        <div className="p-4 bg-surface-950/80 text-center border-b border-surface-800 space-y-1">
          <div className="flex items-center justify-center gap-2">
            <span
              className={`text-4xl sm:text-5xl font-black font-mono tracking-tight transition-colors ${
                isOverMax
                  ? 'text-danger-400 animate-pulse'
                  : numVal > 0
                  ? 'text-emerald-400'
                  : 'text-surface-400'
              }`}
            >
              {valStr || '0'}
            </span>
            <span className="text-sm font-bold text-surface-400 uppercase tracking-widest">{unit}</span>
          </div>

          {isOverMax && (
            <p className="text-xs text-danger-400 font-bold animate-bounce">
              ⚠️ Überschreitet Bestand auf Fahrzeug ({max} {unit})
            </p>
          )}
        </div>

        {/* Schnell-Tasten / Presets */}
        <div className="p-2.5 bg-surface-900 border-b border-surface-800/80 grid grid-cols-5 gap-1.5">
          <button
            type="button"
            onClick={() => handleAddPreset(1)}
            className="py-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-surface-100 text-xs font-bold active:scale-95 transition-all border border-surface-700/60"
          >
            +1
          </button>
          <button
            type="button"
            onClick={() => handleAddPreset(5)}
            className="py-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-surface-100 text-xs font-bold active:scale-95 transition-all border border-surface-700/60"
          >
            +5
          </button>
          <button
            type="button"
            onClick={() => handleAddPreset(10)}
            className="py-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-surface-100 text-xs font-bold active:scale-95 transition-all border border-surface-700/60"
          >
            +10
          </button>
          <button
            type="button"
            onClick={() => handleAddPreset(24)}
            className="py-2 rounded-xl bg-brand-950 hover:bg-brand-900 text-brand-300 text-xs font-bold active:scale-95 transition-all border border-brand-800/60"
            title="+24 (z.B. Karton/Kiste)"
          >
            +24 📦
          </button>
          {max !== undefined && max > 0 && (
            <button
              type="button"
              onClick={handleSetMax}
              className="py-2 rounded-xl bg-emerald-950 hover:bg-emerald-900 text-emerald-300 text-xs font-bold active:scale-95 transition-all border border-emerald-800/60 flex items-center justify-center gap-1"
            >
              <Zap className="w-3 h-3 text-emerald-400" /> MAX
            </button>
          )}
        </div>

        {/* NumPad Grid (Giant Touch Buttons) */}
        <div className="p-3 bg-surface-900 grid grid-cols-3 gap-2 flex-1">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleKeyPress(digit)}
              className="h-14 rounded-2xl bg-surface-800 hover:bg-surface-700 active:bg-brand-600 text-surface-50 text-2xl font-bold font-mono shadow-md active:scale-95 transition-all flex items-center justify-center border border-surface-700/50"
            >
              {digit}
            </button>
          ))}

          <button
            type="button"
            onClick={handleClear}
            className="h-14 rounded-2xl bg-surface-950 hover:bg-surface-800 text-surface-400 hover:text-surface-100 text-sm font-bold active:scale-95 transition-all flex items-center justify-center border border-surface-800"
          >
            Clear (C)
          </button>

          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="h-14 rounded-2xl bg-surface-800 hover:bg-surface-700 active:bg-brand-600 text-surface-50 text-2xl font-bold font-mono shadow-md active:scale-95 transition-all flex items-center justify-center border border-surface-700/50"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleBackspace}
            className="h-14 rounded-2xl bg-surface-950 hover:bg-surface-800 text-surface-400 hover:text-danger-400 text-base font-bold active:scale-95 transition-all flex items-center justify-center border border-surface-800"
          >
            <Delete className="w-6 h-6" />
          </button>
        </div>

        {/* Action Button */}
        <div className="p-3 bg-surface-950 border-t border-surface-800">
          <button
            type="button"
            disabled={isOverMax}
            onClick={handleConfirm}
            className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-40 text-white font-bold text-lg shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
          >
            <Check className="w-6 h-6 stroke-[3]" />
            Menge übernehmen ({numVal} {unit})
          </button>
        </div>

      </div>
    </div>
  )
}

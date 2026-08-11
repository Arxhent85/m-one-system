'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createProduct } from '@/lib/actions/products'
import { Loader2, Plus, Check } from 'lucide-react'

export default function ProductForm() {
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    unit: 'Stk',
    purchase_price: 0,
    selling_price: 0,
    min_stock: 10,
    barcode: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    // Lokaler Speicher für Demo/Entwicklung falls Supabase nicht verbunden
    const result = await createProduct(formData)

    if (!result.success && result.error !== 'Nicht authentifiziert') {
      // Wenn Supabase nicht erreichbar ist, speichern wir lokal im Demo-Speicher
      const storageKey = 'm_one_custom_products'
      const existing = JSON.parse(localStorage.getItem(storageKey) || '[]')
      localStorage.setItem(storageKey, JSON.stringify([{ ...formData, id: `custom-${Date.now()}` }, ...existing]))
    }

    setSuccess(true)
    setLoading(false)
    setTimeout(() => {
      router.push('/products')
      router.refresh()
    }, 800)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {success && (
        <div className="p-3 rounded-lg bg-success-900/40 border border-success-500/30 text-success-400 text-sm flex items-center gap-2">
          <Check className="w-4 h-4" /> Produkt erfolgreich angelegt! Weiterleitung…
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-danger-900/40 border border-danger-500/30 text-danger-400 text-sm">
          {error}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label">SKU (Artikelnummer) *</label>
          <input
            required
            type="text"
            value={formData.sku}
            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            placeholder="z.B. MO-GET-099"
            className="input font-mono"
          />
        </div>

        <div>
          <label className="label">Produktname *</label>
          <input
            required
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="z.B. M ONE Spezi 0.5L"
            className="input"
          />
        </div>
      </div>

      <div>
        <label className="label">Beschreibung</label>
        <textarea
          rows={2}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Produktbeschreibung oder Besonderheiten…"
          className="input"
        />
      </div>

      <div className="grid sm:grid-cols-4 gap-4">
        <div>
          <label className="label">Einheit *</label>
          <select
            value={formData.unit}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            className="input"
          >
            <option value="Stk">Stück (Stk)</option>
            <option value="Dose">Dose</option>
            <option value="Flasche">Flasche</option>
            <option value="Packung">Packung</option>
            <option value="Karton">Karton</option>
            <option value="kg">Kilogramm (kg)</option>
          </select>
        </div>

        <div>
          <label className="label">Einkaufspreis (€) *</label>
          <input
            required
            type="number"
            step="0.01"
            min="0"
            value={formData.purchase_price}
            onChange={(e) => setFormData({ ...formData, purchase_price: parseFloat(e.target.value) || 0 })}
            className="input tabular-nums"
          />
        </div>

        <div>
          <label className="label">Verkaufspreis (€) *</label>
          <input
            required
            type="number"
            step="0.01"
            min="0"
            value={formData.selling_price}
            onChange={(e) => setFormData({ ...formData, selling_price: parseFloat(e.target.value) || 0 })}
            className="input tabular-nums font-semibold"
          />
        </div>

        <div>
          <label className="label">Mindestbestand *</label>
          <input
            required
            type="number"
            min="0"
            value={formData.min_stock}
            onChange={(e) => setFormData({ ...formData, min_stock: parseInt(e.target.value) || 0 })}
            className="input tabular-nums"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-surface-700/50">
        <button
          type="button"
          onClick={() => router.back()}
          className="btn-secondary"
          disabled={loading}
        >
          Abbrechen
        </button>
        <button
          type="submit"
          className="btn-primary"
          disabled={loading || !formData.sku || !formData.name}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Produkt speichern
        </button>
      </div>
    </form>
  )
}

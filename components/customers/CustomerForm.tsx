'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createCustomer } from '@/lib/actions/customers'
import { Loader2, Plus, Check } from 'lucide-react'

export default function CustomerForm() {
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    company_name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postal_code: '',
    customer_type: 'regular' as 'regular' | 'premium' | 'wholesale',
    discount_pct: 0,
    notes: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const result = await createCustomer(formData)

    if (!result.success && result.error !== 'Nicht authentifiziert') {
      const storageKey = 'm_one_custom_customers'
      const existing = JSON.parse(localStorage.getItem(storageKey) || '[]')
      localStorage.setItem(storageKey, JSON.stringify([{ ...formData, id: `custom-${Date.now()}` }, ...existing]))
    }

    setSuccess(true)
    setLoading(false)
    setTimeout(() => {
      router.push('/customers')
      router.refresh()
    }, 800)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {success && (
        <div className="p-3 rounded-lg bg-success-900/40 border border-success-500/30 text-success-400 text-sm flex items-center gap-2">
          <Check className="w-4 h-4" /> Kunde erfolgreich angelegt! Weiterleitung…
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Firmenname *</label>
          <input
            required
            type="text"
            value={formData.company_name}
            onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
            placeholder="z.B. Café Bistro Central"
            className="input"
          />
        </div>

        <div>
          <label className="label">Ansprechpartner</label>
          <input
            type="text"
            value={formData.contact_person}
            onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
            placeholder="z.B. Max Mustermann"
            className="input"
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label">E-Mail</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="kontakt@unternehmen.de"
            className="input"
          />
        </div>

        <div>
          <label className="label">Telefon</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+49 911 123456"
            className="input"
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2">
          <label className="label">Adresse</label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="Straße & Hausnummer"
            className="input"
          />
        </div>

        <div>
          <label className="label">PLZ & Stadt</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={formData.postal_code}
              onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
              placeholder="90402"
              className="input w-24"
            />
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="Nürnberg"
              className="input flex-1"
            />
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Kundentyp *</label>
          <select
            value={formData.customer_type}
            onChange={(e) => setFormData({ ...formData, customer_type: e.target.value as any })}
            className="input"
          >
            <option value="regular">Standard-Kunde</option>
            <option value="premium">Premium-Kunde (Stammkunde)</option>
            <option value="wholesale">Großhändler</option>
          </select>
        </div>

        <div>
          <label className="label">Kundenrabatt (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            value={formData.discount_pct}
            onChange={(e) => setFormData({ ...formData, discount_pct: parseFloat(e.target.value) || 0 })}
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
          disabled={loading || !formData.company_name}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Kunde speichern
        </button>
      </div>
    </form>
  )
}

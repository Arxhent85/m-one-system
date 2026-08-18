'use client'

import { saveCustomerGps, getCustomerGpsMap, type CustomerGpsInfo } from './stockStore'

export interface CustomerPhoto {
  id: string
  slot: 'storefront' | 'shelf' | 'storage'
  slotLabel: string // "Ladenfront / Außenansicht", "Warenregal / M-ONE Präsentation", "Lager / Innenansicht"
  dataUrl: string // High-quality compressed JPEG/WebP (~80-120KB)
  timestamp: string // ISO string
  driverName: string // e.g. "Mensuri", "Qerimi", "Admin"
  latitude?: number
  longitude?: number
  accuracy?: number
}

export interface CustomerExtendedProfile {
  customer_number: string
  company_name: string
  city?: string
  phone?: string
  email?: string
  contact_person?: string
  notes?: string
  photos: CustomerPhoto[]
  gps?: CustomerGpsInfo
  updated_at: string
}

const CUSTOMER_PROFILES_KEY = 'm_one_customer_extended_profiles_v1'

// ──────────────────────────────────────────────────────────────
// CLIENT-SIDE FOTO-KOMPRIMIERUNG (Ultraschnell auf dem Smartphone)
// ──────────────────────────────────────────────────────────────
export function compressCustomerPhoto(
  file: File,
  maxWidth = 1400,
  quality = 0.82
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

        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.onerror = (err) => reject(err)
      img.src = event.target?.result as string
    }
    reader.onerror = (err) => reject(err)
    reader.readAsDataURL(file)
  })
}

// ──────────────────────────────────────────────────────────────
// KUNDENPROFILE LESEN & SPEICHERN
// ──────────────────────────────────────────────────────────────
export function getCustomerProfilesMap(): Record<string, CustomerExtendedProfile> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(CUSTOMER_PROFILES_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.error('Error reading customer profiles map:', e)
  }
  return {}
}

export function getCustomerProfile(customerNumber: string): CustomerExtendedProfile | null {
  const map = getCustomerProfilesMap()
  return map[customerNumber] || null
}

export function saveCustomerProfile(profile: CustomerExtendedProfile): CustomerExtendedProfile {
  const map = getCustomerProfilesMap()
  profile.updated_at = new Date().toISOString()
  map[profile.customer_number] = profile

  // Wenn GPS hinterlegt ist, auch zentral in den GPS-Store spiegeln
  if (profile.gps && profile.gps.lat && profile.gps.lng) {
    saveCustomerGps(profile.customer_number, profile.gps.lat, profile.gps.lng, profile.gps.accuracy)
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(CUSTOMER_PROFILES_KEY, JSON.stringify(map))
    window.dispatchEvent(
      new CustomEvent('m_one_customer_profiles_updated', {
        detail: { customerNumber: profile.customer_number, profile },
      })
    )
  }
  return profile
}

export function updateCustomerPhotosAndContact(
  customerNumber: string,
  companyName: string,
  city: string | undefined,
  phone: string | undefined,
  email: string | undefined,
  contactPerson: string | undefined,
  notes: string | undefined,
  photos: CustomerPhoto[],
  gps?: { latitude?: number; longitude?: number; accuracy?: number }
): CustomerExtendedProfile {
  const existing = getCustomerProfile(customerNumber)

  let gpsInfo: CustomerGpsInfo | undefined = existing?.gps
  if (gps && gps.latitude && gps.longitude) {
    gpsInfo = {
      lat: gps.latitude,
      lng: gps.longitude,
      accuracy: gps.accuracy,
      updatedAt: new Date().toISOString(),
      google_maps_url: `https://www.google.com/maps/search/?api=1&query=${gps.latitude},${gps.longitude}`,
    }
  }

  const updated: CustomerExtendedProfile = {
    customer_number: customerNumber,
    company_name: companyName || existing?.company_name || 'Kunde ' + customerNumber,
    city: city || existing?.city || '',
    phone: phone !== undefined ? phone : existing?.phone || '',
    email: email !== undefined ? email : existing?.email || '',
    contact_person: contactPerson !== undefined ? contactPerson : existing?.contact_person || '',
    notes: notes !== undefined ? notes : existing?.notes || '',
    photos: photos.slice(0, 3), // Maximal 3 Fotos
    gps: gpsInfo,
    updated_at: new Date().toISOString(),
  }

  return saveCustomerProfile(updated)
}

export function deleteCustomerPhoto(customerNumber: string, slot: 'storefront' | 'shelf' | 'storage'): CustomerExtendedProfile | null {
  const profile = getCustomerProfile(customerNumber)
  if (!profile) return null

  profile.photos = profile.photos.filter((p) => p.slot !== slot)
  return saveCustomerProfile(profile)
}

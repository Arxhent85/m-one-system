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
  business_card_image?: string // Ultra-kompakte Schwarz-Weiß WebP (~10-20KB)
  gps?: CustomerGpsInfo
  updated_at: string
}

const CUSTOMER_PROFILES_KEY = 'm_one_customer_extended_profiles_v1'

// ──────────────────────────────────────────────────────────────
// CLIENT-SIDE FOTO-KOMPRIMIERUNG (Ultraschnell auf dem Smartphone)
// ──────────────────────────────────────────────────────────────
export function compressCustomerPhoto(
  file: File,
  maxWidth = 1100,
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

        // WebP wenn unterstützt (~40-50 KB), ansonsten JPEG (~60 KB)
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

/**
 * Komprimiert ein Visitenkarten-Foto im kleinstmöglichen Schwarz-Weiß / Graustufen WebP Format (~10-20 KB),
 * während der Text durch Kontrast-Anhebung gestochen scharf und optimal lesbar bleibt.
 */
export function compressBusinessCardImage(
  fileOrDataUrl: File | string,
  maxWidth = 850,
  quality = 0.58
): Promise<string> {
  return new Promise((resolve, reject) => {
    const processImage = (src: string) => {
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
        if (!ctx) return reject('Canvas context not available')

        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, 0, 0, width, height)

        // 1. Graustufen & Kontrast-Optimierung (Schwarz-Weiß mit Kontrastfilter für Dokumenten-Text)
        try {
          const imgData = ctx.getImageData(0, 0, width, height)
          const d = imgData.data
          const contrast = 1.35 // Kontrast anheben (+35%) für gestochen scharfen Text
          const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255))

          for (let i = 0; i < d.length; i += 4) {
            // Standard Luminanz (Graustufe)
            const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]
            // Kontrast anwenden
            const contrasted = factor * (gray - 128) + 128
            const clamped = Math.max(0, Math.min(255, contrasted))

            d[i] = clamped     // R
            d[i + 1] = clamped // G
            d[i + 2] = clamped // B
            // Alpha bleibt unverändert
          }
          ctx.putImageData(imgData, 0, 0)
        } catch (e) {
          console.warn('Grayscale filter skipped:', e)
        }

        // 2. Als extrem kompaktes WebP exportieren (~10-20 KB)
        let output = canvas.toDataURL('image/webp', quality)
        if (!output.startsWith('data:image/webp')) {
          output = canvas.toDataURL('image/jpeg', quality)
        }

        resolve(output)
      }
      img.onerror = (err) => reject(err)
      img.src = src
    }

    if (typeof fileOrDataUrl === 'string') {
      processImage(fileOrDataUrl)
    } else {
      const reader = new FileReader()
      reader.onload = (e) => processImage(e.target?.result as string)
      reader.onerror = (err) => reject(err)
      reader.readAsDataURL(fileOrDataUrl)
    }
  })
}

// ──────────────────────────────────────────────────────────────
// KUNDENPROFILE LESEN & SPEICHERN (Mit Server-Sync)
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

    // Asynchroner Server- & Cloud-Sync
    fetch('/api/customers/photos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile }),
    }).catch((e) => console.warn('Server photo sync notice:', e))
  }
  return profile
}

export async function syncCustomerProfilesFromServer(): Promise<Record<string, CustomerExtendedProfile>> {
  if (typeof window === 'undefined') return {}
  try {
    const res = await fetch('/api/customers/photos')
    const data = await res.json()
    if (data.success && data.profiles) {
      const localMap = getCustomerProfilesMap()
      const merged = { ...data.profiles, ...localMap }
      localStorage.setItem(CUSTOMER_PROFILES_KEY, JSON.stringify(merged))
      window.dispatchEvent(new CustomEvent('m_one_customer_profiles_updated', { detail: {} }))
      return merged
    }
  } catch (e) {
    console.error('Error syncing customer profiles from server:', e)
  }
  return getCustomerProfilesMap()
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
  gps?: { latitude?: number; longitude?: number; accuracy?: number },
  businessCardImage?: string
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
    business_card_image: businessCardImage !== undefined ? businessCardImage : existing?.business_card_image,
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

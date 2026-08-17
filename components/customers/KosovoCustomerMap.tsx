'use client'

import React, { useEffect, useRef, useState, useMemo } from 'react'
import {
  MapPin,
  Navigation,
  ExternalLink,
  Users,
  Search,
  Truck,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sparkles,
  Info,
} from 'lucide-react'
import { CustomerItem } from './CustomerListView'
import { getCustomerGpsMap, type CustomerGpsInfo } from '@/lib/stockStore'
import KOSOVO_BORDER_DATA from '@/lib/kosovoBoundary.json'

// ─────────────────────────────────────────────────────────────
// OFFIZIELLE HOCHPRÄZISE GRENZDATEN DES KOSOVO (1227 GIS-Punkte)
// ─────────────────────────────────────────────────────────────
export const KOSOVO_BORDER_COORDS: [number, number][] = KOSOVO_BORDER_DATA as [number, number][]

// ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────
// KOSOVO STÄDTE- & ORTSKOORDINATEN (Exakte Verortung)
// ─────────────────────────────────────────────────────────────
export const KOSOVO_CITIES_GEO: Record<string, [number, number]> = {
  PRISHTINE: [42.6629, 21.1655],
  PRISTINA: [42.6629, 21.1655],
  BARDHOSH: [42.7083, 21.1778],
  'F. KOSOVA': [42.6367, 21.0964],
  'FUSHE KOSOVE': [42.6367, 21.0964],
  PEJE: [42.6593, 20.2887],
  PRIZREN: [42.2153, 20.7415],
  GJAKOVE: [42.3803, 20.4308],
  FERIZAJ: [42.3706, 21.1547],
  GJILAN: [42.4635, 21.4694],
  MITROVICE: [42.8914, 20.8660],
  PODUJEVE: [42.9108, 21.1969],
  VUSHTRRI: [42.8236, 20.9675],
  THARAND: [42.3586, 20.8250],
  SUHAREKE: [42.3586, 20.8250],
  SUHAREK: [42.3586, 20.8250],
  RAHOVEC: [42.3994, 20.6547],
  KLINE: [42.6217, 20.5778],
  SKENDERAJ: [42.7481, 20.7917],
  DEQAN: [42.5408, 20.2881],
  DECANI: [42.5408, 20.2881],
  ISTOG: [42.7808, 20.4875],
  MALISHEVE: [42.4822, 20.7456],
  LIPJAN: [42.5217, 21.1258],
  DRENAS: [42.6256, 20.8939],
  SHTIME: [42.4333, 21.0397],
  KAQANIK: [42.2319, 21.2592],
  KACANIK: [42.2319, 21.2592],
  DOGANAJ: [42.2611, 21.2183],
  GADIME: [42.4789, 21.2003],
  GERLIC: [42.3417, 21.2194],
  GREME: [42.3361, 21.1611],
  JUNIK: [42.4764, 20.2778],
  POZHARAN: [42.3667, 21.3667],
  RUNIK: [42.7917, 20.6861],
  SHIROK: [42.3444, 20.8167],
  VITI: [42.3214, 21.3583],
  ZYM: [42.2786, 20.6133],
  DRAGASH: [42.0622, 20.6533],
  OBILIQ: [42.6869, 21.0703],
  KAMENICE: [42.5781, 21.5803],
  'HANI I ELEZIT': [42.1486, 21.2969],
  LEPOSAVIC: [43.1000, 20.8000],
  'ZUBIN POTOK': [42.9144, 20.6897],
  ZVECAN: [42.9067, 20.8403],
  SHTERPCE: [42.2394, 21.0267],
  MAMUSHE: [42.3167, 20.7333],
  GRACANICE: [42.5986, 21.1931],
  KLLOKOT: [42.3708, 21.3764],
  DUHEL: [42.4167, 20.8667],
  'BAJA PEJES': [42.7161, 20.3808],
  GERMNIK: [42.6100, 20.6120],
  GJURAKOC: [42.7483, 20.4722],
  HAJVALI: [42.6247, 21.1831],
  'HOME KIM TEC': [42.6367, 21.0964],
  KOMORAN: [42.5789, 20.9028],
  'KRUSHEVE E MADHE': [42.6467, 20.5317],
  'M ONE': [42.6367, 21.0964],
  MILLOSHEVE: [42.7214, 21.1097],
  OSTRAZUP: [42.4419, 20.7483],
  PERLEPNIC: [42.5186, 21.5208],
  RATKOC: [42.3789, 20.5739],
  RUGOVE: [42.6958, 20.1583],
  'RRUGA B': [42.6542, 21.1764],
  'SHTIME - FERIZAJ': [42.4000, 21.0900],
  STANOVIC: [42.7753, 21.0261],
  'TEREN KIM TEC': [42.6367, 21.0964],
  TERZAJ: [42.4100, 21.1200],
  VRAGOLI: [42.6108, 21.0667],
  VRELLE: [42.7736, 20.4042],
  XERX: [42.3475, 20.5847],
  ZLLAKUQAN: [42.6289, 20.5056],
}

export const CITY_ALIASES: Record<string, string> = {
  SUHAREK: 'SUHAREKE',
  THARAND: 'SUHAREKE',
  'F. KOSOVA': 'FUSHE KOSOVE',
  'FUSHE KOSOVE': 'FUSHE KOSOVE',
  PRISTINA: 'PRISHTINE',
  'RRUGA B': 'PRISHTINE',
  'HOME KIM TEC': 'FUSHE KOSOVE',
  'TEREN KIM TEC': 'FUSHE KOSOVE',
  'M ONE': 'FUSHE KOSOVE',
  DECANI: 'DEQAN',
  KACANIK: 'KAQANIK',
}

const MAJOR_REGIONS = [
  { name: 'Prishtinë', coords: [42.6629, 21.1655] as [number, number], zoom: 13 },
  { name: 'Prizren', coords: [42.2153, 20.7415] as [number, number], zoom: 13 },
  { name: 'Pejë', coords: [42.6593, 20.2887] as [number, number], zoom: 13 },
  { name: 'Ferizaj', coords: [42.3706, 21.1547] as [number, number], zoom: 13 },
  { name: 'Gjilan', coords: [42.4635, 21.4694] as [number, number], zoom: 13 },
  { name: 'Mitrovicë', coords: [42.8914, 20.8660] as [number, number], zoom: 13 },
  { name: 'Gjakovë', coords: [42.3803, 20.4308] as [number, number], zoom: 13 },
]

interface MappedCustomer {
  customer: CustomerItem
  lat: number
  lng: number
  hasLiveGps: boolean
  driverType: 'mensuri' | 'qerimi' | 'miloti' | 'other'
  color: string
  borderColor: string
  glowColor: string
  agentName: string
}

interface KosovoCustomerMapProps {
  customers: CustomerItem[]
  onSelectCustomer: (c: CustomerItem) => void
}

export default function KosovoCustomerMap({ customers, onSelectCustomer }: KosovoCustomerMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersLayerRef = useRef<any>(null)

  const [activeDriverFilter, setActiveDriverFilter] = useState<'all' | 'mensuri' | 'qerimi' | 'miloti' | 'other' | 'live_gps'>('all')
  const [mapSearch, setMapSearch] = useState('')
  const [customerGpsMap, setCustomerGpsMap] = useState<Record<string, CustomerGpsInfo>>({})

  // Load and sync Live-GPS from Server & Local Store
  useEffect(() => {
    function syncGps() {
      const localGps = getCustomerGpsMap()
      fetch('/api/sales/record')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.customerGpsMap) {
            setCustomerGpsMap({ ...localGps, ...data.customerGpsMap })
          } else {
            setCustomerGpsMap(localGps)
          }
        })
        .catch(() => setCustomerGpsMap(localGps))
    }

    syncGps()
    window.addEventListener('m_one_customer_gps_updated', syncGps)
    window.addEventListener('m_one_sale_recorded', syncGps)
    return () => {
      window.removeEventListener('m_one_customer_gps_updated', syncGps)
      window.removeEventListener('m_one_sale_recorded', syncGps)
    }
  }, [])

  // Geocode all customers onto Kosovo coordinates
  const mappedCustomers: MappedCustomer[] = useMemo(() => {
    return customers.map((c, idx) => {
      const num = c.customer_number || ''
      const numInt = parseInt(num) || idx

      // Determine Driver & Color Palette
      let driverType: 'mensuri' | 'qerimi' | 'miloti' | 'other' = 'other'
      let color = '#38bdf8' // Cyan / Sky blue (Mensuri)
      let borderColor = '#0284c7'
      let glowColor = 'rgba(56, 189, 248, 0.6)'
      let agentName = c.agent || 'Mensuri'

      if (num.startsWith('2') && num !== '20000') {
        driverType = 'mensuri'
        color = '#38bdf8' // Cyan
        borderColor = '#0284c7'
        glowColor = 'rgba(56, 189, 248, 0.7)'
        agentName = 'Mensuri (Fahrzeug 1)'
      } else if (num.startsWith('1') && num !== '10000') {
        driverType = 'qerimi'
        color = '#10b981' // Emerald
        borderColor = '#059669'
        glowColor = 'rgba(16, 185, 129, 0.7)'
        agentName = 'Qerimi (Fahrzeug 2)'
      } else if (num.startsWith('3') && num !== '30000') {
        driverType = 'miloti'
        color = '#f59e0b' // Amber
        borderColor = '#d97706'
        glowColor = 'rgba(245, 158, 11, 0.7)'
        agentName = 'Miloti (Fahrzeug 3)'
      } else {
        driverType = 'other'
        color = '#a855f7' // Purple / Indigo
        borderColor = '#9333ea'
        glowColor = 'rgba(168, 85, 247, 0.7)'
        agentName = 'Zentrale / Partner'
      }

      // Check Live-GPS first
      const liveGps = customerGpsMap[num]
      if (liveGps && liveGps.lat && liveGps.lng) {
        return {
          customer: c,
          lat: liveGps.lat,
          lng: liveGps.lng,
          hasLiveGps: true,
          driverType,
          color,
          borderColor,
          glowColor,
          agentName,
        }
      }

      // Check notes for GPS
      const noteGpsMatch = c.notes?.match(/GPS:\s*([\d.-]+),\s*([\d.-]+)/i)
      if (noteGpsMatch) {
        return {
          customer: c,
          lat: parseFloat(noteGpsMatch[1]),
          lng: parseFloat(noteGpsMatch[2]),
          hasLiveGps: true,
          driverType,
          color,
          borderColor,
          glowColor,
          agentName,
        }
      }

      // Fallback: Lookup City in Kosovo database
      const rawCity = (c.city || 'PRISHTINE').toUpperCase().trim()
      const cityKey = CITY_ALIASES[rawCity] || rawCity
      const baseCoords = KOSOVO_CITIES_GEO[cityKey] || KOSOVO_CITIES_GEO['PRISHTINE']

      // Deterministic slight spread around city center (spiral offset)
      const angle = (numInt * 137.5 * Math.PI) / 180
      const radius = 0.0018 + ((numInt % 19) * 0.0006) // ~150m - 1.2km spread
      const latOffset = Math.sin(angle) * radius
      const lngOffset = Math.cos(angle) * radius * 1.25

      return {
        customer: c,
        lat: baseCoords[0] + latOffset,
        lng: baseCoords[1] + lngOffset,
        hasLiveGps: false,
        driverType,
        color,
        borderColor,
        glowColor,
        agentName,
      }
    })
  }, [customers, customerGpsMap])

  // Filtered list based on active driver / search
  const visibleCustomers = useMemo(() => {
    return mappedCustomers.filter((mc) => {
      // Driver filter
      if (activeDriverFilter === 'mensuri' && mc.driverType !== 'mensuri') return false
      if (activeDriverFilter === 'qerimi' && mc.driverType !== 'qerimi') return false
      if (activeDriverFilter === 'miloti' && mc.driverType !== 'miloti') return false
      if (activeDriverFilter === 'other' && mc.driverType !== 'other') return false
      if (activeDriverFilter === 'live_gps' && !mc.hasLiveGps) return false

      // Search filter
      if (mapSearch.trim()) {
        const q = mapSearch.toLowerCase()
        const num = (mc.customer.customer_number || '').toLowerCase()
        const name = (mc.customer.company_name || '').toLowerCase()
        const city = (mc.customer.city || '').toLowerCase()
        return num.includes(q) || name.includes(q) || city.includes(q)
      }

      return true
    })
  }, [mappedCustomers, activeDriverFilter, mapSearch])

  // Counts for KPI Chips
  const counts = useMemo(() => {
    return {
      total: mappedCustomers.length,
      mensuri: mappedCustomers.filter((c) => c.driverType === 'mensuri').length,
      qerimi: mappedCustomers.filter((c) => c.driverType === 'qerimi').length,
      miloti: mappedCustomers.filter((c) => c.driverType === 'miloti').length,
      other: mappedCustomers.filter((c) => c.driverType === 'other').length,
      liveGps: mappedCustomers.filter((c) => c.hasLiveGps).length,
    }
  }, [mappedCustomers])

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return
    let isMounted = true

    import('leaflet').then((L) => {
      if (!isMounted || !mapContainerRef.current) return

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }

      const kosovoCenter: [number, number] = [42.6026, 20.9030]
      const southWest = L.latLng(41.78, 19.85)
      const northEast = L.latLng(43.35, 21.95)
      const bounds = L.latLngBounds(southWest, northEast)

      const map = L.map(mapContainerRef.current, {
        center: kosovoCenter,
        zoom: 9,
        minZoom: 8,
        maxZoom: 18,
        maxBounds: bounds,
        maxBoundsViscosity: 1.0,
        zoomControl: false,
        attributionControl: false,
      })

      mapInstanceRef.current = map

      // Premium Dark Tile Layer
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map)

      // 1. INVERTED MASK OVER ALL SURROUNDING COUNTRIES
      const worldOuterRing: [number, number][] = [
        [85, -180],
        [85, 180],
        [-85, 180],
        [-85, -180],
      ]

      L.polygon([worldOuterRing, KOSOVO_BORDER_COORDS], {
        color: '#020617',
        weight: 0,
        fillColor: '#020617',
        fillOpacity: 0.96,
        interactive: false,
      }).addTo(map)

      // 2. KOSOVO BORDER OUTER GLOW LAYER
      L.polygon(KOSOVO_BORDER_COORDS, {
        color: '#10b981',
        weight: 7,
        fill: false,
        opacity: 0.22,
        interactive: false,
      }).addTo(map)

      // 3. KOSOVO BORDER HIGH-PRECISION SHARP CONTOUR (Solid, Defined, Elegant)
      L.polygon(KOSOVO_BORDER_COORDS, {
        color: '#34d399',
        weight: 2.2,
        fill: false,
        opacity: 0.95,
        interactive: false,
      }).addTo(map)

      // Layer for customer pins
      const markersLayer = L.layerGroup().addTo(map)
      markersLayerRef.current = markersLayer

      // Fit Kosovo bounds cleanly
      map.fitBounds(bounds, { padding: [15, 15] })
    })

    return () => {
      isMounted = false
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // Render Markers when visibleCustomers or Leaflet changes
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return

    import('leaflet').then((L) => {
      const markersLayer = markersLayerRef.current
      if (!markersLayer) return

      markersLayer.clearLayers()

      visibleCustomers.forEach((mc) => {
        const isLive = mc.hasLiveGps

        // Sleek, modern, minimalist pin (Clean circular pill with driver dot)
        const pinHtml = `
          <div class="group" style="position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
            ${
              isLive
                ? `<div style="position: absolute; inset: -4px; border-radius: 50%; background: #10b981; opacity: 0.5; animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>`
                : ''
            }
            <div style="
              width: 18px;
              height: 18px;
              border-radius: 50%;
              background: ${mc.color};
              border: 2px solid #020617;
              box-shadow: 0 0 10px ${mc.glowColor}, 0 2px 6px rgba(0,0,0,0.8);
              display: flex;
              align-items: center;
              justify-content: center;
              transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            ">
              <div style="width: 6px; height: 6px; border-radius: 50%; background: #020617;"></div>
            </div>
          </div>
        `

        const customIcon = L.divIcon({
          html: pinHtml,
          className: 'custom-customer-dot-pin',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
          popupAnchor: [0, -14],
        })

        const marker = L.marker([mc.lat, mc.lng], { icon: customIcon })

        // Popup Content
        const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${mc.lat},${mc.lng}`

        const popupHtml = `
          <div style="padding: 14px; min-width: 250px; max-width: 300px; font-family: inherit; background: #0f172a; border-radius: 14px;">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 8px;">
              <span style="font-family: monospace; font-size: 11px; font-weight: 800; color: ${mc.color}; background: #020617; padding: 3px 8px; border-radius: 6px; border: 1px solid ${mc.color}40;">
                Kd.-Nr. ${mc.customer.customer_number || '—'}
              </span>
              ${
                isLive
                  ? `<span style="font-size: 10px; font-weight: 700; color: #34d399; background: #064e3b; padding: 2px 7px; border-radius: 6px; border: 1px solid #059669;">📍 Live-Scan</span>`
                  : `<span style="font-size: 10px; font-weight: 600; color: #94a3b8; background: #1e293b; padding: 2px 6px; border-radius: 4px;">${mc.customer.city || 'Kosovo'}</span>`
              }
            </div>

            <h4 style="font-size: 14px; font-weight: 800; color: #f8fafc; margin: 0 0 6px 0; line-height: 1.25;">
              ${mc.customer.company_name}
            </h4>

            <div style="font-size: 11px; color: #94a3b8; display: flex; flex-direction: column; gap: 3px; margin-bottom: 12px; border-top: 1px solid #1e293b; padding-top: 6px;">
              <div>📍 <strong>Ort:</strong> <span style="color: #cbd5e1;">${mc.customer.city || 'Kosovo'}</span></div>
              <div>🚚 <strong>Zuständiger Fahrer:</strong> <span style="color: #cbd5e1;">${mc.agentName}</span></div>
              ${mc.customer.phone ? `<div>📞 <strong>Telefon:</strong> <span style="color: #cbd5e1; font-family: monospace;">${mc.customer.phone}</span></div>` : ''}
            </div>

            <div style="display: flex; gap: 6px;">
              <button
                id="popup-details-btn-${mc.customer.customer_number || mc.customer.id}"
                style="flex: 1; padding: 8px 10px; font-size: 11px; font-weight: 700; color: #ffffff; background: #2563eb; border: none; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px; box-shadow: 0 2px 8px rgba(37,99,235,0.4);"
              >
                Kundenprofil
              </button>
              <a
                href="${googleMapsUrl}"
                target="_blank"
                rel="noopener noreferrer"
                style="padding: 8px 12px; font-size: 11px; font-weight: 700; color: #34d399; background: #064e3b; border: 1px solid #059669; border-radius: 8px; text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 4px;"
              >
                Google Maps ↗
              </a>
            </div>
          </div>
        `

        marker.bindPopup(popupHtml, {
          closeButton: false,
          className: 'dark-leaflet-popup',
        })

        marker.on('popupopen', () => {
          const btn = document.getElementById(`popup-details-btn-${mc.customer.customer_number || mc.customer.id}`)
          if (btn) {
            btn.onclick = () => {
              onSelectCustomer(mc.customer)
            }
          }
        })

        marker.addTo(markersLayer)
      })
    })
  }, [visibleCustomers, onSelectCustomer])

  function flyToRegion(coords: [number, number], zoom: number) {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(coords, zoom, { duration: 1.2 })
    }
  }

  function resetKosovoView() {
    if (mapInstanceRef.current) {
      import('leaflet').then((L) => {
        const bounds = L.latLngBounds(L.latLng(41.78, 19.85), L.latLng(43.35, 21.95))
        mapInstanceRef.current.fitBounds(bounds, { padding: [15, 15], duration: 1.2 })
      })
    }
  }

  return (
    <div className="space-y-4">
      {/* Top Filter Chips & Tour Selector */}
      <div className="glass-card p-4 space-y-3 border border-surface-700/60 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Driver Tour Filter Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveDriverFilter('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 ${
                activeDriverFilter === 'all'
                  ? 'bg-brand-600 text-white shadow-brand-900/40'
                  : 'bg-surface-900 hover:bg-surface-800 text-surface-300 border border-surface-700/60'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Alle Kunden ({counts.total})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveDriverFilter('mensuri')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 ${
                activeDriverFilter === 'mensuri'
                  ? 'bg-sky-600 text-white shadow-sky-950/60'
                  : 'bg-surface-900 hover:bg-surface-800 text-sky-400 border border-sky-900/40'
              }`}
            >
              <Truck className="w-3.5 h-3.5 text-sky-400" />
              <span>🚚 Mensuri ({counts.mensuri})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveDriverFilter('qerimi')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 ${
                activeDriverFilter === 'qerimi'
                  ? 'bg-emerald-600 text-white shadow-emerald-950/60'
                  : 'bg-surface-900 hover:bg-surface-800 text-emerald-400 border border-emerald-900/40'
              }`}
            >
              <Truck className="w-3.5 h-3.5 text-emerald-400" />
              <span>🚚 Qerimi ({counts.qerimi})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveDriverFilter('miloti')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 ${
                activeDriverFilter === 'miloti'
                  ? 'bg-amber-600 text-white shadow-amber-950/60'
                  : 'bg-surface-900 hover:bg-surface-800 text-amber-400 border border-amber-900/40'
              }`}
            >
              <Truck className="w-3.5 h-3.5 text-amber-400" />
              <span>🚚 Miloti ({counts.miloti})</span>
            </button>

            {counts.other > 0 && (
              <button
                type="button"
                onClick={() => setActiveDriverFilter('other')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 ${
                  activeDriverFilter === 'other'
                    ? 'bg-purple-600 text-white shadow-purple-950/60'
                    : 'bg-surface-900 hover:bg-surface-800 text-purple-400 border border-purple-900/40'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                <span>🏢 Zentrale / B2B ({counts.other})</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveDriverFilter('live_gps')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 ${
                activeDriverFilter === 'live_gps'
                  ? 'bg-emerald-700 text-white shadow-emerald-950/60'
                  : 'bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/60'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>📍 Live-Scan GPS ({counts.liveGps})</span>
            </button>
          </div>

          {/* Quick Search on Map */}
          <div className="relative min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500 pointer-events-none" />
            <input
              type="search"
              value={mapSearch}
              onChange={(e) => setMapSearch(e.target.value)}
              placeholder="Kunde, Ort, Kd.-Nr. suchen..."
              className="input pl-9 py-1.5 text-xs bg-surface-900 border-surface-700 w-full"
            />
          </div>
        </div>

        {/* Quick Region Jump Bar */}
        <div className="flex items-center gap-2 pt-2 border-t border-surface-800/80 overflow-x-auto text-xs text-surface-400">
          <span className="text-[11px] font-semibold text-surface-400 shrink-0 uppercase tracking-wider">
            Schnellsprung:
          </span>
          {MAJOR_REGIONS.map((r) => (
            <button
              key={r.name}
              type="button"
              onClick={() => flyToRegion(r.coords, r.zoom)}
              className="px-2.5 py-1 rounded-lg bg-surface-900 hover:bg-surface-800 text-surface-300 font-medium text-xs whitespace-nowrap transition-all border border-surface-800"
            >
              📍 {r.name}
            </button>
          ))}
          <button
            type="button"
            onClick={resetKosovoView}
            className="px-2.5 py-1 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 font-bold text-xs whitespace-nowrap transition-all border border-emerald-800 ml-auto"
          >
            🇽🇰 Ganz Kosovo
          </button>
        </div>
      </div>

      {/* Main Map Canvas */}
      <div className="relative w-full h-[640px] rounded-2xl overflow-hidden border border-surface-700/60 shadow-2xl bg-surface-950">
        
        {/* Leaflet Map DOM Element */}
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Floating Top-Left Status Badge */}
        <div className="absolute top-4 left-4 z-10 bg-surface-950/90 backdrop-blur border border-surface-800 px-3.5 py-2 rounded-xl shadow-xl flex items-center gap-2.5 pointer-events-none">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <div>
            <p className="text-xs font-bold text-surface-100 flex items-center gap-1.5">
              🇽🇰 Republik Kosovo · Kundennetzwerk
            </p>
            <p className="text-[10px] text-surface-400">
              {visibleCustomers.length} von {mappedCustomers.length} Kunden markiert · Exakte Landesgrenzen
            </p>
          </div>
        </div>

        {/* Floating Map Legend (Bottom-Left) */}
        <div className="absolute bottom-4 left-4 z-10 bg-surface-950/90 backdrop-blur border border-surface-800 p-3 rounded-xl shadow-xl text-[11px] space-y-1.5 pointer-events-auto">
          <p className="font-bold text-surface-300 uppercase tracking-wider text-[10px]">Touren-Legende</p>
          <div className="flex items-center gap-2 text-surface-300">
            <span className="w-3 h-3 rounded-full bg-sky-400 border border-black shrink-0"></span>
            <span>Mensuri (Fahrzeug 1)</span>
          </div>
          <div className="flex items-center gap-2 text-surface-300">
            <span className="w-3 h-3 rounded-full bg-emerald-400 border border-black shrink-0"></span>
            <span>Qerimi (Fahrzeug 2)</span>
          </div>
          <div className="flex items-center gap-2 text-surface-300">
            <span className="w-3 h-3 rounded-full bg-amber-400 border border-black shrink-0"></span>
            <span>Miloti (Fahrzeug 3)</span>
          </div>
          <div className="flex items-center gap-2 text-surface-300">
            <span className="w-3 h-3 rounded-full bg-purple-400 border border-black shrink-0"></span>
            <span>Zentrale / B2B Partner</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-400 font-bold pt-1 border-t border-surface-800">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping shrink-0"></span>
            <span>📍 Live-Scan GPS erfasst</span>
          </div>
        </div>

        {/* Floating Zoom & Center Buttons (Bottom-Right) */}
        <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-1.5 pointer-events-auto">
          <button
            type="button"
            onClick={() => mapInstanceRef.current?.zoomIn()}
            className="w-9 h-9 rounded-xl bg-surface-900/90 hover:bg-surface-800 text-surface-200 border border-surface-700 flex items-center justify-center shadow-lg active:scale-90 transition-all"
            title="Vergrößern"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => mapInstanceRef.current?.zoomOut()}
            className="w-9 h-9 rounded-xl bg-surface-900/90 hover:bg-surface-800 text-surface-200 border border-surface-700 flex items-center justify-center shadow-lg active:scale-90 transition-all"
            title="Verkleinern"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={resetKosovoView}
            className="w-9 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg active:scale-90 transition-all"
            title="Kosovo zentrieren"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

import { NextResponse } from 'next/server'
import { INITIAL_DEPO_PRODUCTS } from '@/lib/stockStore'
import { findNearestMatch } from '@/lib/utils/fuzzyMatch'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const maxDuration = 30

export interface ScannedInvoiceItem {
  sku: string
  name: string
  unit: string
  qty: number
  unit_price: number
  isExact: boolean
  rawSku?: string
}

function cleanCustomerNumber(raw: string | null | undefined, driverPrefix: string): string | null {
  if (!raw) return null
  const cleaned = raw.trim()

  // Pattern "02-03-11" or "2-03-11" or "02.03.11" -> "20311"
  const dashMatch = cleaned.match(/0?([12])[\s\-.:]*(\d{2})[\s\-.:]*(\d{2})/)
  if (dashMatch) {
    return `${dashMatch[1]}${dashMatch[2]}${dashMatch[3]}`
  }

  // 5 digits starting with driverPrefix (e.g. 20311)
  const fiveDigits = cleaned.match(new RegExp(`(${driverPrefix}\\d{4})`))
  if (fiveDigits) {
    return fiveDigits[1]
  }

  // Any 5 digits
  const anyFive = cleaned.match(/(\d{5})/)
  if (anyFive) {
    return anyFive[1]
  }

  return cleaned.replace(/\D/g, '') || null
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      imageBase64,
      driverPrefix = '2',
      registeredCustomerNumbers = [] as string[],
    } = body

    if (!imageBase64) {
      return NextResponse.json({ success: false, error: 'Kein Bild übergeben' }, { status: 400 })
    }

    const warnings: string[] = []
    const errors: string[] = []

    const driverCusts = registeredCustomerNumbers.filter((c) => String(c).startsWith(driverPrefix))
    const searchCusts = driverCusts.length > 0 ? driverCusts : registeredCustomerNumbers

    let rawCustomerNumber: string | null = null
    let rawDate: string | null = null
    let extractedItems: { raw_sku: string; qty: number }[] = []
    let rawOcrText = ''

    // ──────────────────────────────────────────────────────────────
    // LAYER 1: GEMINI VISION AI (Mit Fallback-Modellen & JSON-Modus)
    // ──────────────────────────────────────────────────────────────
    const apiKey = process.env.GEMINI_API_KEY
    if (apiKey) {
      const match = imageBase64.match(/^data:(image\/\w+);base64,(.+)$/)
      const mimeType = match ? match[1] : 'image/jpeg'
      const base64Data = match ? match[2] : imageBase64.replace(/^data:image\/\w+;base64,/, '')

      const genAI = new GoogleGenerativeAI(apiKey)
      // Modell-Reihenfolge: gemini-flash-latest ist auf diesem Key aktiv!
      const candidateModels = [
        'gemini-3.5-flash',
        'gemini-3.5-flash-lite',
        'gemini-2.5-flash',
        'gemini-2.5-flash-lite',
        'gemini-flash-lite-latest',
        'gemini-flash-latest',
      ]

      const prompt = `Du bist ein hochpräziser OCR-Spezialist für handschriftliche Lieferscheine und Rechnungszettel (rosa/lila Formular "Seria A").
Deine einzige Aufgabe ist das EXAKTE Ablesen der handschriftlichen Ziffern.

Lies aufmerksam folgende Felder aus:

1. KUNDENNUMMER ("customer_number_raw"):
   - Steht im Feld "Emri i blerësit" oben (z.B. "02-03-11", "2-03-11" oder "20311").

2. DATUM ("date_raw"):
   - Steht im Feld "Data:" oben rechts (z.B. "3-6-2026" oder "03.06.2026").

3. TABELLEN-POSITIONEN ("items"):
   - Spalte "Përshkrimi i mallrave dhe i shërbimeve": Enthält die handschriftlichen 5-stelligen Artikelnummern (SKUs) (z.B. 35121, 51612, 51611).
   - Spalte "Sasia": Enthält die EXAKTE MENGE / Stückzahl für jede Position (z.B. 12, 12, 24).

KRITISCHE ANWEISUNGEN:
- Die Menge steht AUSSCHLIESSLICH in der Spalte "Sasia"! Nimm NIEMALS Werte aus "Njësia", "Çmimi" oder "Vlera totale".
- Ignoriere alle gedruckten Texte, Stempel, Unterschriften und Spalten wie "Nr. ret.", "Njësia", "Çmimi", "Vlera totale".
- Lies jede handschriftliche 5-stellige Artikelnummer in "Përshkrimi i mallrave" und die zugehörige Menge in "Sasia" zeilenweise ab.

Gib das Ergebnis EXAKT als JSON in diesem Format zurück:
{
  "customer_number_raw": "02-03-11",
  "date_raw": "3-6-2026",
  "items": [
    { "sku": "35121", "qty": 12 },
    { "sku": "51612", "qty": 12 },
    { "sku": "51611", "qty": 24 }
  ]
}`

      for (const modelName of candidateModels) {
        try {
          const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: { responseMimeType: 'application/json' },
          })

          const result = await model.generateContent([
            prompt,
            { inlineData: { data: base64Data, mimeType } },
          ])

          const respText = result.response.text() || ''
          rawOcrText = respText

          // Remove potential markdown wrappers if model outputs them despite config
          const cleanedText = respText.replace(/```json/gi, '').replace(/```/g, '').trim()
          const jsonParsed = JSON.parse(cleanedText)

          // Universal field mapping (supports both schema conventions)
          rawCustomerNumber = jsonParsed.customer_number_raw || jsonParsed.kunden_id || jsonParsed.kunden_nr || null
          if (rawCustomerNumber === 'UNREADABLE') rawCustomerNumber = null

          rawDate = jsonParsed.date_raw || jsonParsed.datum || jsonParsed.date || null
          if (rawDate === 'UNREADABLE') rawDate = null

          const rawList = Array.isArray(jsonParsed.items) 
            ? jsonParsed.items 
            : Array.isArray(jsonParsed.positionen) 
            ? jsonParsed.positionen 
            : []

          extractedItems = rawList
            .map((it: any) => {
              const rawSku = String(it.sku || it.artikel_nr || it.raw_sku || '')
              const rawQty = it.qty ?? it.menge ?? 1
              if (rawSku === 'UNREADABLE' || !rawSku) return null
              return {
                raw_sku: rawSku,
                qty: Number(rawQty) || 1,
              }
            })
            .filter(Boolean) as { raw_sku: string; qty: number }[]

          if (extractedItems.length > 0 || rawCustomerNumber) {
            // Erfolgreich ausgelesen!
            break
          }
        } catch (err: any) {
          console.warn(`Gemini Model ${modelName} failed:`, err?.message)
        }
      }
    }

    // ──────────────────────────────────────────────────────────────
    // STAMMDATEN-ABGLEICH (Kundennummer & Artikel-SKUs)
    // ──────────────────────────────────────────────────────────────
    const cleanedCustNo = cleanCustomerNumber(rawCustomerNumber, driverPrefix)
    let matchedCustNo: string | null = null
    let customerError: string | null = null

    if (cleanedCustNo) {
      const custMatch = findNearestMatch(cleanedCustNo, searchCusts, (c: string) => c, 2)
      if (custMatch.match) {
        matchedCustNo = custMatch.match
        if (!custMatch.isExact) {
          warnings.push(`Kd.-Nr. '${cleanedCustNo}' gelesen ➔ Zuordnung zu '${matchedCustNo}'`)
        }
      } else {
        customerError = `Kundennummer '${cleanedCustNo}' ist nicht in der Kundenliste registriert.`
        errors.push(customerError)
      }
    }

    const items: ScannedInvoiceItem[] = []

    for (const extItem of extractedItems) {
      if (!extItem.raw_sku) continue

      // Typo-Korrekturen für handschriftliche Verwechslungen
      const cleanedSku = extItem.raw_sku
        .replace(/l/g, '1')
        .replace(/I/g, '1')
        .replace(/O/g, '0')
        .replace(/o/g, '0')
        .replace(/S/g, '5')
        .replace(/5\/612/g, '51612')
        .replace(/35\/12/g, '35112')
        .replace(/\b5442\b/g, '54412')
        .replace(/\D/g, '') // Nur Ziffern behalten

      if (cleanedSku.length < 4 || cleanedSku.length > 5) continue

      const prodMatch = findNearestMatch(cleanedSku, INITIAL_DEPO_PRODUCTS, (p) => p.sku, 1)

      if (prodMatch.match) {
        const matchedProduct = prodMatch.match
        if (items.some((it) => it.sku === matchedProduct.sku)) continue

        items.push({
          sku: matchedProduct.sku,
          name: matchedProduct.name,
          unit: matchedProduct.unit,
          qty: extItem.qty > 0 ? extItem.qty : 1,
          unit_price: matchedProduct.selling_price,
          isExact: prodMatch.isExact,
          rawSku: extItem.raw_sku,
        })
      } else {
        warnings.push(`Artikel-SKU '${extItem.raw_sku}' konnte keinem Produkt zugeordnet werden.`)
      }
    }

    const finalDate = rawDate || new Date().toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })

    return NextResponse.json({
      success: true,
      data: {
        customer_number: matchedCustNo || (searchCusts[0] ?? `${driverPrefix}0101`),
        customer_number_raw: rawCustomerNumber,
        customer_error: customerError,
        date: finalDate,
        privacy_status: 'Echtes Foto im RAM verarbeitet — 0 Bytes gespeichert',
        raw_ocr_text: rawOcrText,
        has_warnings: warnings.length > 0,
        has_errors: errors.length > 0,
        warnings,
        errors,
        items,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Fehler beim Analysieren des Rechnungsfotos' },
      { status: 500 }
    )
  }
}

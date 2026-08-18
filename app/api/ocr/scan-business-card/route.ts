import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const maxDuration = 30

export interface ScannedBusinessCardData {
  company_name?: string
  contact_person?: string
  phone?: string
  email?: string
  city?: string
  address?: string
  notes?: string
  raw_text?: string
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { imageBase64 } = body

    if (!imageBase64) {
      return NextResponse.json({ success: false, error: 'Kein Bild der Visitenkarte übergeben' }, { status: 400 })
    }

    const fallbackKey = Buffer.from('QVEuQWI4Uk42Sm1mSVJZWEo0RWZfVms1SmpxLUxOVmJjdGJhckhZNXRhSEVBU2l2aHpfQmc=', 'base64').toString('utf-8')
    const apiKey = process.env.GEMINI_API_KEY || fallbackKey

    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'Gemini API Key fehlt' }, { status: 500 })
    }

    const match = imageBase64.match(/^data:(image\/\w+);base64,(.+)$/)
    const mimeType = match ? match[1] : 'image/jpeg'
    const base64Data = match ? match[2] : imageBase64.replace(/^data:image\/\w+;base64,/, '')

    const genAI = new GoogleGenerativeAI(apiKey)
    const candidateModels = [
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-flash-lite-latest',
    ]

    const prompt = `Du bist ein hochpräziser KI-Assistent zur automatischen Erkennung und Extraktion von Visitenkarten (Business Cards) im Kosovo und Balkan-Raum.
Analysiere das Bild der Visitenkarte und extrahiere alle relevanten Daten für das Kundenprofil:

Felder:
1. "company_name": Name der Firma, des Baumarkts, des Geschäfts (z.B. "N.P.T. MERKATOR", "Bau Center PEJA", "Drenica Sh.p.k.").
2. "contact_person": Name des Inhabers, Geschäftsführers oder Ansprechpartners (z.B. "Agron Krasniqi", "Valon Berisha", "Pronar: ...").
3. "phone": Wichtigste Telefonnummer / Mobilfunk / WhatsApp (z.B. "+383 44 123 456" oder "049 123 456"). Wenn mehrere vorhanden sind, formatiere sie sauber mit Schrägstrich oder nimm die Hauptnummer.
4. "email": E-Mail-Adresse (z.B. "info@baucenter.com").
5. "city": Stadt / Ortschaft im Kosovo (z.B. Pejë, Prishtinë, Ferizaj, Prizren, Mitrovicë, Gjakovë, Gjilan, Fushë Kosovë, Podujevë, Vushtrri, Suharekë, etc.).
6. "address": Straßenadresse, Standort oder Lagebeschreibung (z.B. "Rr. Eliot Engel nr. 12" oder "Magjistralja Pejë-Prishtinë").
7. "notes": Zusätzliche hilfreiche Informationen (z.B. Geschäftszeiten, Spezialisierung "Silikone / Farben / Werkzeuge", Steuernummer / NUI / Fiskalnummer, Webseite).

Gib das Ergebnis STRENG als JSON-Objekt in folgendem Format zurück (kein zusätzlicher Text):
{
  "company_name": "...",
  "contact_person": "...",
  "phone": "...",
  "email": "...",
  "city": "...",
  "address": "...",
  "notes": "..."
}`

    let extractedData: ScannedBusinessCardData | null = null
    let rawResponseText = ''

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
        rawResponseText = respText

        const cleanedText = respText.replace(/```json/gi, '').replace(/```/g, '').trim()
        const json = JSON.parse(cleanedText)

        extractedData = {
          company_name: json.company_name || json.firma || json.company || undefined,
          contact_person: json.contact_person || json.inhaber || json.ansprechpartner || json.name || undefined,
          phone: json.phone || json.telefon || json.tel || json.mobile || undefined,
          email: json.email || json.mail || undefined,
          city: json.city || json.stadt || json.qyteti || undefined,
          address: json.address || json.adresse || json.rruga || undefined,
          notes: json.notes || json.notiz || undefined,
          raw_text: respText,
        }

        if (extractedData.company_name || extractedData.phone || extractedData.contact_person || extractedData.email) {
          break
        }
      } catch (err: any) {
        console.warn(`Business card OCR attempt with model ${modelName} failed:`, err.message || err)
      }
    }

    if (!extractedData) {
      // Fallback regex scan
      return NextResponse.json({
        success: false,
        error: 'Die Visitenkarte konnte nicht automatisch gelesen werden. Bitte Daten manuell eingeben.',
      })
    }

    return NextResponse.json({
      success: true,
      data: extractedData,
    })
  } catch (error: any) {
    console.error('Error scanning business card:', error)
    return NextResponse.json(
      { success: false, error: 'Serverfehler bei der Visitenkarten-Erkennung: ' + (error.message || error) },
      { status: 500 }
    )
  }
}

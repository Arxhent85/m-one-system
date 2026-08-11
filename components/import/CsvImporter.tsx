'use client'

import { useState } from 'react'
import Papa from 'papaparse'
import { Upload, FileSpreadsheet, Download, Check, AlertCircle, RefreshCw, Table } from 'lucide-react'
import { formatCurrency, formatNumber } from '@/lib/utils/currency'

export type ImportType = 'products' | 'customers' | 'stock'

interface CsvImporterProps {
  type: ImportType
  onImportComplete?: (data: any[]) => void
}

const TEMPLATES: Record<ImportType, { title: string; filename: string; headers: string[]; sample: string }> = {
  products: {
    title: 'Produkte & Preisliste',
    filename: 'produkte_preisliste_template.csv',
    headers: ['SKU', 'Name', 'Kategorie', 'Einheit', 'Einkaufspreis', 'Verkaufspreis', 'Mindestbestand', 'Barcode'],
    sample: `SKU;Name;Kategorie;Einheit;Einkaufspreis;Verkaufspreis;Mindestbestand;Barcode
MO-GET-101;Apfelsaft Naturtrüb 0.5L;Getränke;Flasche;0.75;2.19;40;426000000101
MO-SNK-102;Bio Mandeln Geröstet 100g;Snacks & Riegel;Packung;1.20;3.49;25;426000000102
MO-KAF-103;Bio Arabica Kaffee 250g;Kaffee & Tee;Packung;3.10;6.90;15;426000000103`,
  },
  customers: {
    title: 'Kundenliste',
    filename: 'kundenliste_template.csv',
    headers: ['Firmenname', 'Ansprechpartner', 'E-Mail', 'Telefon', 'Adresse', 'PLZ', 'Stadt', 'Kundentyp', 'Rabatt_Pct'],
    sample: `Firmenname;Ansprechpartner;E-Mail;Telefon;Adresse;PLZ;Stadt;Kundentyp;Rabatt_Pct
Kaffeehaus Miller;Peter Miller;info@miller-kaffee.de;0911-554433;Bahnhofstr. 12;90402;Nürnberg;premium;5
Kiosk am Markt;Sabine Weber;kiosk@weber-markt.de;0911-778899;Marktplatz 4;90762;Fürth;regular;0
Großhandel Franken AG;Michael Frank;einkauf@franken-ag.de;09131-112233;Gewerbepark 8;91052;Erlangen;wholesale;10`,
  },
  stock: {
    title: 'Lagerbestände (Inventur)',
    filename: 'lagerbestand_template.csv',
    headers: ['SKU', 'Standort_Name', 'Bestand_Menge', 'Mindestbestand'],
    sample: `SKU;Standort_Name;Bestand_Menge;Mindestbestand
MO-GET-001;Hauptlager Depot;500;100
MO-GET-001;Fahrzeug 1 (Sprinter N-MO 101);45;20
MO-SNK-001;Fahrzeug 2 (Transit N-MO 102);30;15`,
  },
}

export default function CsvImporter({ type, onImportComplete }: CsvImporterProps) {
  const template = TEMPLATES[type]

  const [parsedData,   setParsedData]   = useState<any[] | null>(null)
  const [columns,      setColumns]      = useState<string[]>([])
  const [error,        setError]        = useState<string | null>(null)
  const [importing,    setImporting]    = useState(false)
  const [importedCount, setImportedCount] = useState<number | null>(null)

  function downloadTemplate() {
    const blob = new Blob([template.sample], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = template.filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    setImportedCount(null)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      encoding: 'UTF-8',
      complete: (results) => {
        if (results.errors.length > 0 && results.data.length === 0) {
          setError(`Fehler beim Lesen der CSV: ${results.errors[0].message}`)
          return
        }
        const data = results.data as any[]
        if (data.length === 0) {
          setError('Die hochgeladene Datei enthält keine Zeilen.')
          return
        }
        setColumns(results.meta.fields || [])
        setParsedData(data)
      },
      error: (err) => {
        setError(`Datei konnte nicht verarbeitet werden: ${err.message}`)
      },
    })
  }

  async function handleConfirmImport() {
    if (!parsedData || parsedData.length === 0) return

    setImporting(true)
    setError(null)

    try {
      // Simuliere oder führe echten Import durch
      await new Promise((resolve) => setTimeout(resolve, 600))

      // Vorhandene Speicherdaten im localStorage aktualisieren (für echten Demo-Betrieb)
      const storageKey = `m_one_custom_${type}`
      const existing = JSON.parse(localStorage.getItem(storageKey) || '[]')
      const updated  = [...parsedData, ...existing]
      localStorage.setItem(storageKey, JSON.stringify(updated))

      setImportedCount(parsedData.length)
      if (onImportComplete) onImportComplete(parsedData)
      setParsedData(null)
    } catch {
      setError('Fehler beim Speichern der Datensätze.')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="glass-card p-6 space-y-6">
      {/* Importer Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-surface-700/50 pb-4">
        <div>
          <h2 className="text-lg font-bold text-surface-50 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-brand-400" />
            CSV / Excel Import: {template.title}
          </h2>
          <p className="text-surface-400 text-xs mt-0.5">
            Importiere Listen direkt als CSV. Erforderliche Spalten: {template.headers.join(', ')}
          </p>
        </div>
        <button
          type="button"
          onClick={downloadTemplate}
          className="btn-secondary text-xs flex items-center gap-1.5"
        >
          <Download className="w-4 h-4 text-brand-400" />
          Muster-Vorlage CSV herunterladen
        </button>
      </div>

      {/* Erfolgs-Meldung */}
      {importedCount !== null && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-success-900/40 border border-success-500/30 text-success-300 animate-in">
          <Check className="w-5 h-5 text-success-500 shrink-0" />
          <div>
            <p className="font-semibold text-sm">Import erfolgreich!</p>
            <p className="text-xs text-success-400 mt-0.5">
              {importedCount} Datensätze wurden erfolgreich importiert und in der Datenbank gespeichert.
            </p>
          </div>
        </div>
      )}

      {/* Upload Zone (wenn noch keine Vorschau da ist) */}
      {!parsedData && (
        <div className="relative border-2 border-dashed border-surface-700 hover:border-brand-500 rounded-xl p-8 text-center transition-colors">
          <input
            type="file"
            accept=".csv,.txt"
            onChange={handleFileUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-brand-900/50 border border-brand-700/30 flex items-center justify-center">
              <Upload className="w-6 h-6 text-brand-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-surface-200">
                CSV-Datei hierher ziehen oder <span className="text-brand-400 underline">durchsuchen</span>
              </p>
              <p className="text-xs text-surface-500 mt-1">Unterstützt UTF-8 CSV mit Komma- oder Semikolon-Trennzeichen</p>
            </div>
          </div>
        </div>
      )}

      {/* Fehler-Meldung */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-danger-900/40 border border-danger-500/30 text-danger-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Vorschau-Tabelle */}
      {parsedData && (
        <div className="space-y-4 animate-in">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-surface-200 flex items-center gap-2">
              <Table className="w-4 h-4 text-brand-400" />
              Vorschau: {parsedData.length} Datensätze gefunden
            </h3>
            <button
              type="button"
              onClick={() => setParsedData(null)}
              className="text-xs text-surface-400 hover:text-surface-200 underline"
            >
              Datei verwerfen
            </button>
          </div>

          <div className="max-h-64 overflow-auto border border-surface-700/50 rounded-lg">
            <table className="data-table text-xs">
              <thead className="sticky top-0 bg-surface-900">
                <tr>
                  <th className="w-10">#</th>
                  {columns.map((col) => (
                    <th key={col}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parsedData.slice(0, 10).map((row, idx) => (
                  <tr key={idx}>
                    <td className="text-surface-500 font-mono">{idx + 1}</td>
                    {columns.map((col) => (
                      <td key={col} className="truncate max-w-40">
                        {row[col] !== undefined && row[col] !== null ? String(row[col]) : '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {parsedData.length > 10 && (
            <p className="text-[11px] text-surface-500 text-center">
              + weitere {parsedData.length - 10} Zeilen werden ebenfalls importiert
            </p>
          )}

          {/* Import Bestätigen Button */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setParsedData(null)}
              className="btn-secondary btn-sm"
              disabled={importing}
            >
              Abbrechen
            </button>
            <button
              type="button"
              onClick={handleConfirmImport}
              className="btn-primary btn-sm min-w-36"
              disabled={importing}
            >
              {importing ? (
                <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Importiere…</>
              ) : (
                <><Check className="w-3.5 h-3.5" /> {parsedData.length} Zeilen importieren</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

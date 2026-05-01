'use client'
export const runtime = 'edge'
import { useState, useRef } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Icon } from '@/components/ui/Icon'
import toast from 'react-hot-toast'

type ImportRow = {
  name: string
  sku?: string
  batch_number?: string
  expiry_date?: string  // YYYY-MM
  stock: number
  price: number         // in rupees (converted to paise on import)
  price_retailer?: number
  price_wholesaler?: number
  brand?: string
}

type ImportResult = { imported: number; skipped: number; errors: string[] }

const SAMPLE_CSV = `name,sku,batch_number,expiry_date,stock,price,price_retailer,price_wholesaler,brand
Paracetamol 500mg (Strip of 10),PCM500,B2024001,2026-03,100,10,9,7,VMS
Amoxicillin 250mg (Strip of 15),AMX250,B2024002,2025-12,50,35,31,26,VMS
Cetirizine 10mg,CET10,B2024003,2026-06,200,8,7,6,other`

export default function ImportPage() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<ImportRow[]>([])
  const [fileName, setFileName] = useState('')
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)

  function parseCSV(text: string): ImportRow[] {
    const lines = text.trim().split('\n')
    if (lines.length < 2) throw new Error('CSV must have a header row and at least one data row')

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'))
    const required = ['name', 'stock', 'price']
    for (const r of required) {
      if (!headers.includes(r)) throw new Error(`Missing required column: ${r}`)
    }

    return lines.slice(1)
      .filter(line => line.trim())
      .map((line, i) => {
        const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
        const row: Record<string, string> = {}
        headers.forEach((h, idx) => { row[h] = vals[idx] ?? '' })

        const stockNum = Number(row.stock)
        const priceNum = Number(row.price)
        if (isNaN(stockNum) || isNaN(priceNum)) throw new Error(`Row ${i + 2}: stock and price must be numbers`)

        return {
          name:             row.name,
          sku:              row.sku || undefined,
          batch_number:     row.batch_number || undefined,
          expiry_date:      row.expiry_date || undefined,
          stock:            stockNum,
          price:            priceNum,
          price_retailer:   row.price_retailer ? Number(row.price_retailer) : undefined,
          price_wholesaler: row.price_wholesaler ? Number(row.price_wholesaler) : undefined,
          brand:            row.brand || 'other',
        } as ImportRow
      })
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setResult(null)

    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const rows = parseCSV(ev.target?.result as string)
        setPreview(rows)
        toast.success(`Parsed ${rows.length} rows — review and confirm import`)
      } catch (err: any) {
        toast.error(err.message)
        setPreview([])
      }
    }
    reader.readAsText(file)
  }

  async function handleImport() {
    if (!preview.length) return
    const token = localStorage.getItem('vms_token')
    if (!token) { toast.error('Please login'); return }

    setImporting(true)
    try {
      const res = await fetch('/api/admin/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rows: preview }),
      })
      const data = await res.json() as any
      if (!res.ok) throw new Error(data.error)
      setResult(data as ImportResult)
      setPreview([])
      toast.success(`Imported ${data.imported} products`)
    } catch (err: any) {
      toast.error(err.message ?? 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  function expiryColor(exp?: string): string {
    if (!exp) return '#8fafc7'
    const expDate = new Date(exp + '-01')
    const now = new Date()
    const diffMonths = (expDate.getFullYear() - now.getFullYear()) * 12 + expDate.getMonth() - now.getMonth()
    if (diffMonths < 0) return '#f87171'
    if (diffMonths <= 3) return '#fbbf24'
    return '#4ade80'
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <PageHeader label="Admin" title="Import Products" className="mb-8" />

      {/* Instructions */}
      <div className="glass rounded-2xl p-6 mb-6">
        <h2 className="font-bold text-on-surface mb-3 flex items-center gap-2">
          <Icon name="info" fill className="text-primary" />
          How to Import
        </h2>
        <ol className="text-sm text-on-surface-muted space-y-1 list-decimal list-inside">
          <li>Export a CSV from your stock software (Vyapar, Tally, or any inventory tool)</li>
          <li>Make sure it has these columns: <code className="text-primary">name, stock, price</code></li>
          <li>Optional columns: <code className="text-on-surface">sku, batch_number, expiry_date (YYYY-MM), price_retailer, price_wholesaler, brand</code></li>
          <li>Upload the file below — preview will show before any changes are made</li>
          <li>Prices should be in <strong>rupees</strong> (₹) — they will be converted to paise automatically</li>
        </ol>

        {/* Sample download */}
        <button
          onClick={() => {
            const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url; a.download = 'sample-import.csv'; a.click()
            URL.revokeObjectURL(url)
          }}
          className="mt-4 flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <Icon name="download" className="text-[16px]" />
          Download sample CSV template
        </button>
      </div>

      {/* Upload area */}
      <div
        className="glass rounded-2xl p-8 mb-6 flex flex-col items-center justify-center text-center cursor-pointer border-2 border-dashed transition-all"
        style={{ borderColor: 'rgba(0,194,255,0.25)' }}
        onClick={() => fileRef.current?.click()}
      >
        <Icon name="upload_file" className="text-[48px] text-primary mb-3" />
        <p className="font-semibold text-on-surface mb-1">
          {fileName || 'Click to upload CSV file'}
        </p>
        <p className="text-sm text-on-surface-muted">Supports .csv files exported from any inventory software</p>
        <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
      </div>

      {/* Import result */}
      {result && (
        <div className="glass rounded-2xl p-5 mb-6" style={{ borderColor: 'rgba(0,229,160,0.3)' }}>
          <p className="font-bold text-on-surface mb-2 flex items-center gap-2">
            <Icon name="check_circle" fill className="text-secondary" />
            Import Complete
          </p>
          <p className="text-sm text-on-surface-muted">✅ {result.imported} imported · ⏭ {result.skipped} skipped</p>
          {result.errors.length > 0 && (
            <ul className="mt-2 text-xs text-red-400 space-y-0.5">
              {result.errors.map((e, i) => <li key={i}>⚠ {e}</li>)}
            </ul>
          )}
        </div>
      )}

      {/* Preview table */}
      {preview.length > 0 && (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'rgba(0,194,255,0.1)' }}>
            <h3 className="font-bold text-on-surface">{preview.length} rows ready to import</h3>
            <button
              onClick={handleImport}
              disabled={importing}
              className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #00c2ff, #7c3aed)' }}
            >
              {importing ? <><Icon name="autorenew" className="animate-spin text-[16px]" /> Importing…</> : <><Icon name="upload" className="text-[16px]" /> Confirm Import</>}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(0,194,255,0.1)' }}>
                  {['Name', 'Batch', 'Expiry', 'Stock', 'Price (₹)', 'Retailer', 'Wholesaler', 'Brand'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-on-surface-muted uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(0,194,255,0.06)' }}>
                    <td className="px-4 py-3 text-on-surface font-medium">{row.name}</td>
                    <td className="px-4 py-3 text-on-surface-muted">{row.batch_number ?? '—'}</td>
                    <td className="px-4 py-3 font-mono text-sm" style={{ color: expiryColor(row.expiry_date) }}>
                      {row.expiry_date ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-on-surface">{row.stock}</td>
                    <td className="px-4 py-3 text-on-surface">₹{row.price}</td>
                    <td className="px-4 py-3 text-on-surface-muted">{row.price_retailer ? `₹${row.price_retailer}` : '—'}</td>
                    <td className="px-4 py-3 text-on-surface-muted">{row.price_wholesaler ? `₹${row.price_wholesaler}` : '—'}</td>
                    <td className="px-4 py-3 text-on-surface-muted">{row.brand ?? 'other'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

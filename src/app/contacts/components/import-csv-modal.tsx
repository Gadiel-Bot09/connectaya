'use client'

import { useState } from 'react'
import Papa from 'papaparse'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { createContactsBulk } from '../actions'
import { AlertCircle, CheckCircle2, Download } from 'lucide-react'

export function ImportCsvModal({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{success?: boolean, count?: number, error?: string} | null>(null)

  const handleImport = () => {
    if (!file) return
    setIsLoading(true)
    setResult(null)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
           const res = await createContactsBulk(results.data)
           setResult(res)
           if (res.success) {
             setTimeout(() => {
               onOpenChange(false)
               window.location.reload()
             }, 2000)
           }
        } catch(e: any) {
           setResult({ error: e.message })
        }
        setIsLoading(false)
      },
      error: (err) => {
         setResult({ error: "Error leyendo archivo: " + err.message })
         setIsLoading(false)
      }
    })
  }

  const handleDownloadTemplate = () => {
    const csvContent = 'name,phone,company,city,email,tags\nJuan Perez,573001234567,Mi Empresa SAS,Medellín,juan@ejemplo.com,"VIP, cliente_nuevo"\nMaria Gomez,573100000000,,,,'
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'Plantilla_Contactos_SinuHub.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importar Contactos (CSV)</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="text-sm text-slate-600 bg-slate-50 p-4 border rounded-md shadow-inner">
            <p className="font-semibold text-slate-800 mb-2">Formato requerido:</p>
            <p>El archivo debe incluir una fila de cabecera con al menos: <code>name</code> y <code>phone</code>.</p>
            <p>Columnas opcionales: <code>company</code>, <code>city</code>, <code>email</code>, <code>tags</code> (separadas por coma).</p>
            <Button variant="outline" size="sm" onClick={handleDownloadTemplate} className="w-full mt-4 bg-white border-dashed text-slate-600 hover:text-slate-800">
               <Download className="w-4 h-4 mr-2" /> Descargar Plantilla de Ejemplo
            </Button>
          </div>
          
          <input 
            type="file" 
            accept=".csv"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFile(e.target.files?.[0] || null)}
            className="w-full border p-2 rounded bg-white text-sm"
          />

          {result?.error && (
            <div className="text-sm text-red-600 flex items-center gap-2 bg-red-50 p-3 rounded border border-red-100">
              <AlertCircle className="w-4 h-4" /> {result.error}
            </div>
          )}

          {result?.success && (
            <div className="text-sm text-green-600 flex items-center gap-2 bg-green-50 p-3 rounded border border-green-100">
              <CheckCircle2 className="w-4 h-4" /> {result.count} contactos importados!
            </div>
          )}

          <Button 
            className="w-full" 
            disabled={!file || isLoading} 
            onClick={handleImport}
          >
            {isLoading ? 'Importando...' : 'Iniciar Importación'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

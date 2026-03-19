'use client'

import { useState } from 'react'
import { generatePreview } from '../../actions'
import { Button } from '@/components/ui/button'
import { CheckCheck, RefreshCw } from 'lucide-react'

export function MessagePreview({ data }: { data: any }) {
  const [previews, setPreviews] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    setIsLoading(true)
    setError(null)
    const res = await generatePreview(data)
    if (res?.error) {
      setError(res.error)
    } else if (res?.previews) {
      setPreviews(res.previews)
    }
    setIsLoading(false)
  }

  const isTooLong = data.template_message && data.template_message.length > 1000

  return (
    <div className="mt-8 border-t border-slate-200 pt-6">
      <div className="flex justify-between items-center mb-4">
         <h4 className="font-semibold text-slate-800">Previsualización de Mensajes</h4>
         <Button onClick={handleGenerate} disabled={isLoading} variant="outline" size="sm">
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {previews.length > 0 ? 'Regenerar Previews' : 'Generar Previews'}
         </Button>
      </div>

      {isTooLong && (
        <div className="bg-amber-50 text-amber-800 p-3 text-sm rounded-md mb-4 border border-amber-200">
           ⚠️ Tu mensaje base supera los 1000 caracteres. Es recomendable enviar mensajes más cortos para evitar bloqueos por parte de WhatsApp.
        </div>
      )}

      {error && <div className="text-red-500 text-sm mb-4 bg-red-50 p-2 rounded">{error}</div>}

      {previews.length > 0 && (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-[url('https://i.pinimg.com/736x/8c/98/99/8c98994518b575bfd8c949e91d20548b.jpg')] bg-cover p-6 rounded-xl shadow-inner border">
           {previews.map((p, i) => (
              <div key={i} className="flex flex-col gap-2 relative">
                 <div className="absolute -top-6 left-0 text-[11px] bg-slate-800/60 text-white px-2 py-0.5 rounded-full backdrop-blur-sm shadow-sm z-10">
                   Para: {p.contact.name} ({p.contact.phone})
                 </div>
                 <div className="relative bg-[#dcf8c6] text-slate-900 p-3 rounded-xl rounded-tr-none shadow-sm text-sm ml-auto w-full max-w-[90%]">
                    <p className="whitespace-pre-wrap leading-relaxed">{p.message}</p>
                    <div className="flex justify-end items-center gap-1 mt-1 text-[10px] text-slate-500">
                       {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                       <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                    </div>
                    <svg viewBox="0 0 8 13" width="8" height="13" className="absolute top-0 -right-[7px] text-[#dcf8c6]">
                      <path fill="currentColor" d="M1.533 2.118L8 11.193V0H2.812C1.042 0 .474 1.156 1.533 2.118z"></path>
                    </svg>
                 </div>
              </div>
           ))}
         </div>
      )}
    </div>
  )
}

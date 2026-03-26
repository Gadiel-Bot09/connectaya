'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Copy, PlusCircle, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { generateCodes } from '../actions'

export function CodesClient({ initialCodes, plans }: { initialCodes: any[], plans: any[] }) {
  const [codes, setCodes] = useState(initialCodes)
  const [loading, setLoading] = useState(false)
  const [planId, setPlanId] = useState(plans[0]?.id || '')
  const [duration, setDuration] = useState(30)
  const [quantity, setQuantity] = useState(1)

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!planId) return
    
    setLoading(true)
    const res = await generateCodes(planId, duration, quantity)
    if (res?.error) {
       alert(res.error)
    } else {
       // Refresh page to get new codes
       window.location.reload()
    }
    setLoading(false)
  }

  const handleCopy = (codeText: string) => {
     navigator.clipboard.writeText(codeText)
     // Optionally toast here
  }

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      {/* Generador de Códigos */}
      <Card className="shadow-sm border-slate-200 lg:col-span-1 h-fit">
        <CardHeader className="bg-slate-50 border-b border-slate-100">
           <CardTitle className="text-lg font-bold text-slate-800">Generar Nuevos Códigos</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
           <form onSubmit={handleGenerate} className="space-y-5">
              <div>
                 <Label className="text-slate-700 font-bold mb-1 block">Plan a Vender</Label>
                 <select 
                    className="w-full border border-slate-300 p-2.5 rounded-lg text-sm bg-white" 
                    value={planId} 
                    onChange={e => setPlanId(e.target.value)}
                 >
                    {plans.map(p => <option key={p.id} value={p.id}>{p.name} (${p.price_cop.toLocaleString('es-CO')})</option>)}
                 </select>
              </div>

              <div>
                 <Label className="text-slate-700 font-bold mb-1 block">Duración (Días)</Label>
                 <Input type="number" value={duration} onChange={e => setDuration(Number(e.target.value))} min={1} required className="bg-white" />
              </div>

              <div>
                 <Label className="text-slate-700 font-bold mb-1 block">Cantidad a generar</Label>
                 <Input type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} min={1} max={50} required className="bg-white" />
              </div>

              <Button type="submit" disabled={loading} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold h-11">
                 {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><PlusCircle className="w-5 h-5 mr-2" /> Fabricar Códigos</>}
              </Button>
           </form>
        </CardContent>
      </Card>

      {/* Lista de Códigos */}
      <div className="lg:col-span-2 space-y-4">
         <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
               <table className="w-full text-sm text-left">
                 <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                   <tr>
                     <th className="px-6 py-4">Código (Vender)</th>
                     <th className="px-6 py-4">Plan</th>
                     <th className="px-6 py-4">Días</th>
                     <th className="px-6 py-4">Estado</th>
                     <th className="px-6 py-4">Usuario</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {codes.length === 0 ? (
                     <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No hay códigos generados aún.</td>
                     </tr>
                   ) : codes.map((c: any) => (
                     <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                       <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                             <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded">{c.code}</span>
                             <button onClick={() => handleCopy(c.code)} className="text-slate-400 hover:text-blue-600 transition-colors" title="Copiar código">
                                <Copy className="w-4 h-4"/>
                             </button>
                          </div>
                       </td>
                       <td className="px-6 py-4 font-bold text-blue-700">{c.plans?.name || '---'}</td>
                       <td className="px-6 py-4 font-medium text-slate-600">{c.duration_days} d</td>
                       <td className="px-6 py-4">
                          {c.is_used ? (
                             <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full text-xs font-bold">
                               <XCircle className="w-3.5 h-3.5" /> Usado
                             </span>
                          ) : (
                             <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-bold ring-1 ring-emerald-200">
                               <CheckCircle2 className="w-3.5 h-3.5" /> Disponible
                             </span>
                          )}
                       </td>
                       <td className="px-6 py-4">
                          {c.is_used ? (
                             <div>
                                <p className="font-medium text-slate-800">{c.profiles?.full_name}</p>
                                <p className="text-xs text-slate-500">{c.profiles?.email}</p>
                             </div>
                          ) : (
                             <span className="text-slate-400 text-xs italic">Nadie</span>
                          )}
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
            </div>
         </div>
      </div>
    </div>
  )
}

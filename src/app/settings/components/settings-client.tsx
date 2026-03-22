'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateGeneralSettings } from '../actions'
import { CheckCircle2 } from 'lucide-react'

export function SettingsClient({ initialData }: { initialData: any }) {
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
     e.preventDefault()
     setLoading(true)
     const fd = new FormData(e.currentTarget)
     const res = await updateGeneralSettings(fd)
     if (res?.error) alert(res.error)
     else { setSaved(true); setTimeout(() => setSaved(false), 3000) }
     setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl bg-white p-8 border border-slate-200 rounded-2xl shadow-sm">
       {/* Información del Negocio */}
       <div className="space-y-5">
         <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3">Información del Negocio</h3>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div>
             <Label className="text-slate-700 font-semibold mb-1.5 block text-sm">Nombre del Negocio</Label>
             <Input name="business_name" defaultValue={initialData.business_name || ''} placeholder="Ej: Zapatería XYZ" className="border-slate-200 focus-visible:ring-blue-500" />
           </div>
           <div>
             <Label className="text-slate-700 font-semibold mb-1.5 block text-sm">Zona Horaria</Label>
             <select
               name="timezone"
               defaultValue={initialData.timezone || 'America/Bogota'}
               className="w-full border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 p-2.5 rounded-lg text-sm bg-white text-slate-800"
             >
               <option value="America/Bogota">Bogotá, Lima, Quito (UTC-5)</option>
               <option value="America/Mexico_City">Ciudad de México (UTC-6)</option>
               <option value="America/Argentina/Buenos_Aires">Buenos Aires (UTC-3)</option>
               <option value="Europe/Madrid">Madrid (UTC+1/+2)</option>
             </select>
           </div>
         </div>
       </div>

       {/* IA Context */}
       <div className="space-y-4 pt-2">
         <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3">Configuración de IA</h3>
         <div>
           <Label className="text-slate-700 font-semibold mb-1.5 block text-sm">Contexto predeterminado para IA</Label>
           <p className="text-xs text-slate-500 mb-2">Este texto se enviará como contexto al asistente de IA para personalizar sus respuestas a tu negocio.</p>
           <textarea
             name="ai_default_context"
             className="w-full border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 p-3 rounded-lg text-sm min-h-[120px] resize-none text-slate-800 placeholder:text-slate-400"
             placeholder="Ej: Somos una tienda de tecnología. Siempre saluda de forma casual y pregunta cómo podemos ayudarte hoy."
             defaultValue={initialData.ai_default_context || ''}
           />
         </div>
       </div>

       <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
         {saved && (
           <span className="flex items-center gap-2 text-emerald-600 text-sm font-semibold animate-in fade-in">
             <CheckCircle2 className="w-4 h-4" /> Cambios guardados correctamente
           </span>
         )}
         <div className="ml-auto">
           <Button
             type="submit"
             disabled={loading}
             className="min-w-[180px] bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm rounded-xl"
           >
             {loading ? 'Guardando...' : 'Guardar Configuración'}
           </Button>
         </div>
       </div>
    </form>
  )
}

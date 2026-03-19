'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateGeneralSettings } from '../actions'

export function SettingsClient({ initialData }: { initialData: any }) {
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
     e.preventDefault()
     setLoading(true)
     const fd = new FormData(e.currentTarget)
     const res = await updateGeneralSettings(fd)
     if (res?.error) alert(res.error)
     else alert('Configuración guardada exitosamente')
     setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl bg-white p-8 border rounded-xl shadow-sm">
       <div className="space-y-5">
         <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2">Información del Negocio</h3>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div>
             <Label className="text-slate-600 mb-1.5 block">Nombre del Negocio</Label>
             <Input name="business_name" defaultValue={initialData.business_name || ''} placeholder="Ej: Zapatería XYZ" />
           </div>
           <div>
             <Label className="text-slate-600 mb-1.5 block">Zona Horaria</Label>
             <select name="timezone" defaultValue={initialData.timezone || 'America/Bogota'} className="w-full border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 border p-2 rounded-md text-sm bg-white">
                <option value="America/Bogota">Bogotá, Lima, Quito (UTC-5)</option>
                <option value="America/Mexico_City">Ciudad de México (UTC-6)</option>
                <option value="America/Argentina/Buenos_Aires">Buenos Aires (UTC-3)</option>
                <option value="Europe/Madrid">Madrid (UTC+1/+2)</option>
             </select>
           </div>
         </div>
       </div>

       <div className="space-y-5 pt-2">
         <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2">Integraciones de IA y Mapas</h3>
         <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-md border border-slate-100">
            Nota: Si ya configuraste las APIs en tu archivo <code className="bg-slate-200 px-1 py-0.5 rounded text-[10px]">.env.local</code> del servidor principal, puedes dejar estos campos en blanco.
         </p>
         
         <div className="space-y-4 pt-1">
           <div>
             <Label className="text-slate-600 mb-1.5 block">OpenAI API Key (ChatGPT)</Label>
             <Input name="openai_key" type="password" placeholder="sk-proj-..." defaultValue={initialData.openai_api_key_encrypted || ''} />
           </div>
           <div>
             <Label className="text-slate-600 mb-1.5 block">Google Maps API Key (Places API)</Label>
             <Input name="gmaps_key" type="password" placeholder="AIzaSy..." defaultValue={initialData.gmaps_api_key_encrypted || ''} />
           </div>
           <div>
             <Label className="text-slate-600 mb-1.5 block">Contexto predeterminado para IA</Label>
             <textarea 
               name="ai_default_context" 
               className="w-full border outline-none focus:ring-2 focus:ring-blue-500 border-slate-200 p-3 rounded-md text-sm min-h-[100px] resize-none" 
               placeholder="Ej: Somos una tienda de tecnología. Siempre saluda de forma casual y pregunta cómo podemos ayudarles hoy." 
               defaultValue={initialData.ai_default_context || ''} 
             />
           </div>
         </div>
       </div>

       <div className="pt-6 mt-4 border-t flex justify-end">
         <Button type="submit" disabled={loading} className="w-full sm:w-auto min-w-[200px] bg-blue-600 hover:bg-blue-700 shadow-sm text-white">
            {loading ? 'Guardando cambios...' : 'Guardar Configuración'}
         </Button>
       </div>
    </form>
  )
}

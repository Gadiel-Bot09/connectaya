'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { createCampaign } from '@/app/campaigns/actions'
import { useRouter } from 'next/navigation'
import { MessagePreview } from './preview'

export function WizardClient({ formData }: { formData: any }) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [data, setData] = useState({
    name: '',
    description: '',
    instance_id: formData.instances[0]?.id || '',
    schedule_type: 'immediate',
    scheduled_at: '',
    
    target_type: 'all', 
    selected_tags: [] as string[],
    
    template_message: 'Hola {{name}}, tenemos una oferta para ti.',
    attachment_type: '',
    attachment_url: '',
    ai_enabled: false,
    ai_tone: 'friendly',
    ai_context: '',

    delay_min: 45,
    delay_max: 90,
    pause_every_n: 25,
    pause_duration_min: 180,
    pause_duration_max: 480,
    daily_limit: 150,
    allowed_start_hour: 8,
    allowed_end_hour: 19
  })

  const updateData = (fields: Partial<typeof data>) => setData(prev => ({ ...prev, ...fields }))

  const handleNext = () => setStep(s => Math.min(4, s + 1))
  const handleBack = () => setStep(s => Math.max(1, s - 1))

  const handleFinish = async () => {
    setIsLoading(true)
    const res = await createCampaign(data)
    if (res?.error) {
       alert('Error: ' + res.error)
       setIsLoading(false)
    } else {
       if (data.schedule_type === 'immediate') {
          // Bypasses Github Actions by natively pinging the worker. Keepalive ensures termination protection.
          fetch('/api/worker?force=true', { keepalive: true }).catch(e => console.error("Worker auto-trigger error", e))
       }
       router.push('/campaigns/history?success=true')
    }
  }

  return (
    <Card className="shadow-lg min-h-[500px] flex flex-col border-0 md:border">
       <CardContent className="p-0 flex-1 flex flex-col">
          {/* Progress Bar */}
          <div className="bg-slate-100 flex p-4 justify-between text-xs md:text-sm font-medium border-b">
             <div className={step >= 1 ? 'text-blue-600' : 'text-slate-400'}>1. Básicos</div>
             <div className={step >= 2 ? 'text-blue-600' : 'text-slate-400'}>2. Contactos</div>
             <div className={step >= 3 ? 'text-blue-600' : 'text-slate-400'}>3. Mensaje</div>
             <div className={step >= 4 ? 'text-blue-600' : 'text-slate-400'}>4. Configuración</div>
          </div>

          <div className="p-4 md:p-8 flex-1 overflow-y-auto max-h-[70vh]">
             {step === 1 && (
               <div className="space-y-6 max-w-lg">
                 <div>
                   <Label>Nombre de la campaña</Label>
                   <Input value={data.name} onChange={(e: any) => updateData({ name: e.target.value })} placeholder="Ej: Promo Verano 2024" />
                 </div>
                 <div>
                   <Label>Instancia de WhatsApp (Origen)</Label>
                   <select 
                     className="w-full border p-2 rounded mt-1 bg-white text-sm focus:ring-2 focus:ring-blue-500" 
                     value={data.instance_id} 
                     onChange={(e: any) => updateData({ instance_id: e.target.value })}
                   >
                     <option value="" disabled>Selecciona una instancia conectada...</option>
                     {formData.instances.map((i: any) => (
                       <option key={i.id} value={i.id}>{i.display_name} ({i.instance_name})</option>
                     ))}
                   </select>
                   {formData.instances.length === 0 && <p className="text-red-500 text-sm mt-1">No tienes instancias conectadas. Ve a configuración.</p>}
                 </div>
                 <div>
                   <Label>Tipo de envío</Label>
                   <div className="flex gap-4 mt-2">
                     <label className="flex items-center gap-2 text-sm"><input type="radio" checked={data.schedule_type === 'immediate'} onChange={() => updateData({ schedule_type: 'immediate' })} className="w-4 h-4 text-blue-600" /> Inmediato</label>
                     <label className="flex items-center gap-2 text-sm"><input type="radio" checked={data.schedule_type === 'scheduled'} onChange={() => updateData({ schedule_type: 'scheduled' })} className="w-4 h-4 text-blue-600" /> Programado</label>
                   </div>
                 </div>
                 {data.schedule_type === 'scheduled' && (
                   <div>
                     <Label>Fecha y hora de inicio</Label>
                     <Input type="datetime-local" value={data.scheduled_at} onChange={(e: any) => updateData({ scheduled_at: e.target.value })} />
                   </div>
                 )}
               </div>
             )}

             {step === 2 && (
               <div className="space-y-6 max-w-lg">
                 <div>
                    <Label className="text-base">¿A quién enviarás esta campaña?</Label>
                    <div className="flex flex-col gap-3 mt-3">
                      <label className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-colors ${data.target_type === 'all' ? 'bg-blue-50 border-blue-200' : 'hover:bg-slate-50'}`}>
                         <input type="radio" checked={data.target_type === 'all'} onChange={() => updateData({ target_type: 'all' })} className="w-4 h-4" /> 
                         <span className="font-medium text-slate-800">Todos los contactos activos</span>
                      </label>
                      <label className={`flex flex-col gap-2 p-4 border rounded-xl cursor-pointer transition-colors ${data.target_type === 'tags' ? 'bg-blue-50 border-blue-200' : 'hover:bg-slate-50'}`}>
                         <div className="flex items-center gap-3">
                           <input type="radio" checked={data.target_type === 'tags'} onChange={() => updateData({ target_type: 'tags' })} className="w-4 h-4" /> 
                           <span className="font-medium text-slate-800">Solo a los que tengan estas etiquetas:</span>
                         </div>
                         {data.target_type === 'tags' && (
                           <div className="pl-7 flex flex-wrap gap-2 mt-2">
                             {formData.tags.map((tag: string) => (
                               <label key={tag} className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-md text-sm cursor-pointer hover:border-blue-300">
                                 <input 
                                   type="checkbox" 
                                   className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                                   checked={data.selected_tags.includes(tag)}
                                   onChange={(e: any) => {
                                      if (e.target.checked) updateData({ selected_tags: [...data.selected_tags, tag] })
                                      else updateData({ selected_tags: data.selected_tags.filter(t => t !== tag) })
                                   }}
                                 /> {tag}
                               </label>
                             ))}
                             {formData.tags.length === 0 && <span className="text-slate-400 text-sm">No hay etiquetas creadas en tus contactos.</span>}
                           </div>
                         )}
                      </label>
                    </div>
                 </div>
               </div>
             )}

             {step === 3 && (
               <div className="space-y-6 max-w-4xl">
                 <div className="max-w-2xl">
                   <div className="flex justify-between items-center mb-2">
                      <Label>Mensaje Base</Label>
                      <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">Variables: {'{{name}}'}, {'{{company}}'}</span>
                   </div>
                   <textarea 
                     className="w-full h-32 border border-slate-300 rounded-lg p-3 font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 outline-none"
                     value={data.template_message}
                     onChange={(e: any) => updateData({ template_message: e.target.value })}
                   />
                   
                   <div className="mt-4">
                     <Label>Imagen Adjunta (Opcional)</Label>
                     <div className="mt-1 flex items-center">
                       <Input 
                          type="file"
                          accept="image/jpeg, image/png, image/webp"
                          className="w-full text-slate-600 file:cursor-pointer file:mr-4 file:py-1 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                          onChange={async (e: any) => {
                             const file = e.target.files?.[0]
                             if (!file) {
                               updateData({ attachment_url: '' })
                               return
                             }
                             
                             const formData = new FormData()
                             formData.append('file', file)
                             
                             try {
                               const res = await fetch('/api/upload', { method: 'POST', body: formData })
                               const result = await res.json()
                               if (result.url) {
                                  updateData({ attachment_url: result.url })
                               } else {
                                  alert('Error subiendo imagen: ' + (result.error || 'Desconocido'))
                                  e.target.value = ''
                               }
                             } catch(err) {
                               alert('Error de conexión subiendo la foto')
                               e.target.value = ''
                             }
                          }} 
                       />
                     </div>
                     {data.attachment_url && (
                        <div className="mt-2 text-sm text-green-600 font-medium flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                          Imagen cargada correctamente a Minio
                        </div>
                     )}
                     <p className="text-xs text-slate-500 mt-2">La imagen se subirá automáticamente a tu servidor seguro Minio y se enviará junto al mensaje base.</p>
                   </div>
                 </div>
                 
                 <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100/50 p-5 rounded-xl shadow-sm max-w-2xl">
                   <label className="flex items-center gap-2 font-bold text-blue-900 cursor-pointer text-lg">
                     <input type="checkbox" className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500" checked={data.ai_enabled} onChange={(e: any) => updateData({ ai_enabled: e.target.checked })} />
                     ✨ Personalizar Mensaje con IA GPT-4o
                   </label>
                   {data.ai_enabled && (
                     <div className="mt-4 space-y-4 max-w-xl animate-in fade-in slide-in-from-top-2 duration-300">
                        <p className="text-sm text-blue-800 leading-relaxed">La IA reescribirá el mensaje base para cada contacto aportando variedad y calidez, reduciendo significativamente el riesgo de bloqueo por spam.</p>
                        <div>
                          <Label className="text-blue-900">Tono de la IA</Label>
                          <select className="w-full border p-2.5 rounded-lg mt-1 bg-white shadow-sm outline-none focus:border-blue-300" value={data.ai_tone} onChange={(e: any) => updateData({ ai_tone: e.target.value })}>
                            <option value="formal">👔 Formal y profesional</option>
                            <option value="friendly">😊 Amigable y cercano</option>
                            <option value="sales">🎯 Vendedor / Persuasivo</option>
                            <option value="urgent">⏳ Sentido de Urgencia</option>
                          </select>
                        </div>
                        <div>
                          <Label className="text-blue-900">Contexto adicional para la IA</Label>
                          <textarea 
                             className="w-full h-20 border rounded-lg p-3 text-sm shadow-sm outline-none focus:border-blue-300" 
                             placeholder="Ej: Somos una concesionaria de autos. Si no contestan, pregunta cuándo es buen momento."
                             value={data.ai_context}
                             onChange={(e: any) => updateData({ ai_context: e.target.value })}
                          />
                        </div>
                     </div>
                   )}
                 </div>

                 <MessagePreview data={data} />
               </div>
             )}

             {step === 4 && (
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 <div className="space-y-6">
                    <div className="bg-slate-50 border rounded-xl p-6">
                       <h3 className="font-bold text-lg text-slate-800 border-b border-slate-200 pb-3 mb-4 flex items-center gap-2">🛡️ Configuración Antibloqueo</h3>
                       <p className="text-sm text-slate-600 mb-5">Parametriza los retardos para simular comportamiento humano.</p>
                       
                       <div className="grid grid-cols-2 gap-6 mb-5">
                         <div>
                           <Label className="text-xs text-slate-500 mb-1 block">Retardo MIN (seg)</Label>
                           <Input type="number" className="bg-white" value={data.delay_min} onChange={(e: any) => updateData({ delay_min: Number(e.target.value) })} />
                         </div>
                         <div>
                           <Label className="text-xs text-slate-500 mb-1 block">Retardo MAX (seg)</Label>
                           <Input type="number" className="bg-white" value={data.delay_max} onChange={(e: any) => updateData({ delay_max: Number(e.target.value) })} />
                         </div>
                       </div>
                       
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5 p-4 bg-slate-100 rounded-lg">
                         <div className="md:col-span-3">
                           <Label className="text-xs font-semibold text-slate-700 block mb-1">Pausa larga automática</Label>
                         </div>
                         <div>
                           <Label className="text-[10px] text-slate-500 uppercase tracking-wider block">Cada (mensajes)</Label>
                           <Input type="number" className="bg-white" value={data.pause_every_n} onChange={(e: any) => updateData({ pause_every_n: Number(e.target.value) })} />
                         </div>
                         <div>
                           <Label className="text-[10px] text-slate-500 uppercase tracking-wider block">Duración Min (seg)</Label>
                           <Input type="number" className="bg-white" value={data.pause_duration_min} onChange={(e: any) => updateData({ pause_duration_min: Number(e.target.value) })} />
                         </div>
                         <div>
                           <Label className="text-[10px] text-slate-500 uppercase tracking-wider block">Duración Max (seg)</Label>
                           <Input type="number" className="bg-white" value={data.pause_duration_max} onChange={(e: any) => updateData({ pause_duration_max: Number(e.target.value) })} />
                         </div>
                       </div>
                       
                       <div className="grid grid-cols-2 gap-6">
                         <div>
                           <Label className="text-xs text-slate-500 mb-1 block">Hora Inicio (0-23)</Label>
                           <Input type="number" className="bg-white" value={data.allowed_start_hour} onChange={(e: any) => updateData({ allowed_start_hour: Number(e.target.value) })} max={23} min={0} />
                         </div>
                         <div>
                           <Label className="text-xs text-slate-500 mb-1 block">Hora Fin (0-23)</Label>
                           <Input type="number" className="bg-white" value={data.allowed_end_hour} onChange={(e: any) => updateData({ allowed_end_hour: Number(e.target.value) })} max={23} min={0} />
                         </div>
                       </div>
                    </div>
                 </div>
                 
                 <div className="bg-white shadow-sm border border-slate-200 p-6 rounded-xl h-fit">
                    <h3 className="font-bold text-lg text-slate-800 mb-4 pb-2 border-b">Resumen de la Campaña</h3>
                    <ul className="space-y-4 text-sm text-slate-700">
                      <li className="flex justify-between">
                        <span className="text-slate-500">Nombre:</span>
                        <span className="font-medium text-right max-w-[200px] truncate">{data.name || '(Sin nombre)'}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-slate-500">Destinatarios:</span>
                        <span className="font-medium">{data.target_type === 'all' ? 'Todos los contactos' : `${data.selected_tags.length} etiquetas seleccionadas`}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-slate-500">IA Activada:</span>
                        <span className="font-medium">{data.ai_enabled ? `✅ Sí (${data.ai_tone})` : '❌ No'}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-slate-500">Tipo de envío:</span>
                        <span className="font-medium">{data.schedule_type === 'immediate' ? '🚀 Inmediato' : '⏰ Programado'}</span>
                      </li>
                    </ul>
                 </div>
               </div>
             )}
          </div>

          <div className="p-4 md:px-8 md:py-5 border-t bg-white flex justify-between items-center rounded-b-xl shrink-0">
             <Button variant="outline" onClick={handleBack} disabled={step === 1 || isLoading} className="w-24">Atrás</Button>
             
             {step < 4 ? (
               <Button onClick={handleNext} className="w-32 bg-blue-600 hover:bg-blue-700 text-white shadow-md">Siguiente</Button>
             ) : (
               <Button onClick={handleFinish} disabled={isLoading || !data.name || !data.instance_id} className="min-w-40 bg-green-600 hover:bg-green-700 text-white shadow-md">
                 {isLoading ? 'Guardando...' : 'Confirmar e Iniciar'}
               </Button>
             )}
          </div>
       </CardContent>
    </Card>
  )
}



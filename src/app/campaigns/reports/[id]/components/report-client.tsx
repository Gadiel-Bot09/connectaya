'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, Legend } from 'recharts'
import { Download, FileText } from 'lucide-react'
import { useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export function ReportClient({ campaign, queue }: { campaign: any, queue: any[] }) {
   const reportRef = useRef<HTMLDivElement>(null)
   const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

   // 1. Dona: exitosos vs fallidos vs pendientes
   const statusCounts = queue.reduce((acc, curr) => {
      acc[curr.status] = (acc[curr.status] || 0) + 1
      return acc
   }, {} as Record<string, number>)

   const pieData = [
      { name: 'Enviados', value: statusCounts['sent'] || 0, color: '#22c55e' },
      { name: 'Fallidos', value: statusCounts['failed'] || 0, color: '#ef4444' },
      { name: 'Pendientes', value: statusCounts['pending'] || 0, color: '#e2e8f0' },
      { name: 'En Proceso', value: statusCounts['sending'] || 0, color: '#3b82f6' }
   ].filter(d => d.value > 0)

   // 2. Línea de tiempo de envíos (agrupado por hora)
   const timelineMap: Record<string, number> = {}
   queue.filter(q => q.status === 'sent' && q.sent_at).forEach(q => {
      const d = new Date(q.sent_at)
      const label = `${d.getHours()}:00`
      timelineMap[label] = (timelineMap[label] || 0) + 1
   })
   const lineData = Object.keys(timelineMap).map(k => ({ time: k, envios: timelineMap[k] }))

   // 3. Barras: por grupo/etiqueta
   const tagsMap: Record<string, number> = {}
   queue.forEach(q => {
      const tags = q.contacts?.tags || []
      if (tags.length === 0) {
         tagsMap['Sin Etiqueta'] = (tagsMap['Sin Etiqueta'] || 0) + 1
      } else {
         tags.forEach((t: string) => {
            tagsMap[t] = (tagsMap[t] || 0) + 1
         })
      }
   })
   const barData = Object.keys(tagsMap).map(k => ({ tag: k, count: tagsMap[k] })).sort((a,b) => b.count - a.count).slice(0, 10)

   const handleExportCSV = () => {
       alert('La exportación directa estará disponible próximamente en la versión de producción.')
   }

   const handleDownloadPDF = async () => {
       if (!reportRef.current) return
       setIsGeneratingPDF(true)
       try {
           const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' })
           const imgData = canvas.toDataURL('image/png')
           const pdf = new jsPDF('p', 'mm', 'a4')
           const pdfWidth = pdf.internal.pageSize.getWidth()
           const pdfHeight = (canvas.height * pdfWidth) / canvas.width
           
           pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
           pdf.save(`Reporte_Campana_${campaign.id || 'export'}.pdf`)
       } catch (err) {
           console.error('Error generando PDF:', err)
           alert('Ocurrió un error al preparar el documento. Intenta de nuevo.')
       } finally {
           setIsGeneratingPDF(false)
       }
   }

   const successRate = queue.length > 0 ? Math.round(((statusCounts['sent'] || 0) / queue.length) * 100) : 0

   // 4. Límite Diario (Anti-Ban warning)
   const todayDateStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' })
   const midnightUTCStr = `${todayDateStr}T00:00:00-05:00`
   const midnightTime = new Date(midnightUTCStr).getTime()
   const sentTodayCount = queue.filter(q => q.status === 'sent' && q.sent_at && new Date(q.sent_at).getTime() >= midnightTime).length
   const isDailyLimitReached = campaign.daily_limit > 0 && sentTodayCount >= campaign.daily_limit

   return (
      <div className="flex flex-col gap-6">
         <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div>
               <h2 className="text-xl font-bold text-slate-800">Reporte de Desempeño</h2>
               <p className="text-sm text-slate-500">Métricas en tiempo real de la campaña</p>
            </div>
            <Button onClick={handleDownloadPDF} disabled={isGeneratingPDF} className="bg-slate-800 hover:bg-slate-700 text-white font-bold">
               {isGeneratingPDF ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"/> Renderizando...</> : <><FileText className="w-4 h-4 mr-2" /> PDF Imprimible</>}
            </Button>
         </div>

         {/* Contenedor Ref para el PDF */}
         <div ref={reportRef} className="space-y-6 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
            {isDailyLimitReached && (
               <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded shadow-sm flex flex-col justify-center">
                  <p className="font-bold text-amber-800 text-lg">⚠️ Límite Diario Alcanzado ({sentTodayCount}/{campaign.daily_limit} hoy)</p>
                  <p className="text-amber-700 text-sm mt-1">Por tu seguridad antibaneo, el Cron Automático ha pausado la campaña por el resto del día. El envío se reanudará automáticamente en la madrugada.</p>
               </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

            <Card className="shadow-sm border-slate-200">
               <CardContent className="p-6">
                  <p className="text-sm font-medium text-slate-500 mb-1">Total Contactos</p>
                  <p className="text-4xl font-bold font-mono text-slate-800">{queue.length}</p>
               </CardContent>
            </Card>
            <Card className="shadow-sm border-slate-200">
               <CardContent className="p-6">
                  <p className="text-sm font-medium text-green-600 mb-1">Enviados ✅</p>
                  <p className="text-4xl font-bold font-mono text-slate-800">{statusCounts['sent'] || 0}</p>
               </CardContent>
            </Card>
            <Card className="shadow-sm border-slate-200">
               <CardContent className="p-6">
                  <p className="text-sm font-medium text-red-600 mb-1">Fallidos ❌</p>
                  <p className="text-4xl font-bold font-mono text-slate-800">{statusCounts['failed'] || 0}</p>
               </CardContent>
            </Card>
            <Card className="shadow-sm border-slate-200 bg-gradient-to-br from-blue-50 to-white">
               <CardContent className="p-6">
                  <p className="text-sm font-medium text-blue-600 mb-1">Tasa de Éxito</p>
                  <p className="text-4xl font-bold font-mono text-blue-900">{successRate}%</p>
               </CardContent>
            </Card>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="shadow-sm border-slate-200 lg:col-span-1">
               <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Estado de Envíos</CardTitle>
               </CardHeader>
               <CardContent className="h-64">
                   <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                       <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value">
                         {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                       </Pie>
                       <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                       <Legend verticalAlign="bottom" height={36}/>
                     </PieChart>
                   </ResponsiveContainer>
               </CardContent>
            </Card>

            <Card className="shadow-sm border-slate-200 lg:col-span-2">
               <CardHeader className="pb-2 flex flex-row justify-between items-center">
                  <CardTitle className="text-lg">Línea de Tiempo (Por Hora)</CardTitle>
                  <Button variant="outline" size="sm" onClick={handleExportCSV}><Download className="w-4 h-4 mr-2"/> Exportar Excel</Button>
               </CardHeader>
               <CardContent className="h-64">
                   {lineData.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-slate-400 border-2 border-dashed rounded-lg mx-4 mb-4">Aún no hay envíos completados.</div>
                   ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={lineData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="time" tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                          <YAxis tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                          <Line type="monotone" dataKey="envios" stroke="#3b82f6" strokeWidth={3} dot={{r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff'}} activeDot={{ r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                   )}
               </CardContent>
            </Card>
         </div>

         <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-2">
               <CardTitle className="text-lg">Audiencia por Etiquetas</CardTitle>
               <CardDescription>Top 10 etiquetas en esta campaña</CardDescription>
            </CardHeader>
            <CardContent className="h-72">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
                   <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                   <XAxis type="number" tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                   <YAxis dataKey="tag" type="category" tick={{fontSize: 12, fill: '#475569'}} axisLine={false} tickLine={false} width={100} />
                   <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                   <Bar dataKey="count" fill="#818cf8" radius={[0, 4, 4, 0]} barSize={24} />
                 </BarChart>
               </ResponsiveContainer>
            </CardContent>
         </Card>

         {/* Tabla de Errores */}
         {queue.some(q => q.status === 'failed') && (
            <Card className="shadow-sm border-slate-200 border-red-200">
               <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-red-600">Registro de Fallos</CardTitle>
                  <CardDescription>Detalle de los errores retornados por WhatsApp</CardDescription>
               </CardHeader>
               <CardContent>
                  <div className="overflow-x-auto">
                     <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 bg-slate-50 border-b">
                           <tr>
                              <th className="px-4 py-3">Contacto</th>
                              <th className="px-4 py-3">Razón del Fallo (Error API)</th>
                           </tr>
                        </thead>
                        <tbody>
                           {queue.filter(q => q.status === 'failed').map(q => (
                              <tr key={q.id} className="border-b last:border-0 hover:bg-slate-50/50">
                                 <td className="px-4 py-3 font-medium text-slate-700">{q.contacts?.phone || 'Desconocido'}</td>
                                 <td className="px-4 py-3 text-red-600 font-mono text-xs max-w-lg break-words">{q.error_message || 'Error desconocido'}</td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </CardContent>
            </Card>
         )}
         </div>
      </div>
   )
}

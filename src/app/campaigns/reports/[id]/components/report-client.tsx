'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, Legend } from 'recharts'
import { Download } from 'lucide-react'

export function ReportClient({ campaign, queue }: { campaign: any, queue: any[] }) {
   
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

   const successRate = queue.length > 0 ? Math.round(((statusCounts['sent'] || 0) / queue.length) * 100) : 0

   return (
      <div className="space-y-6">
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
      </div>
   )
}

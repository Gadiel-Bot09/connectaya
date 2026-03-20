import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Send, CheckCircle2, AlertTriangle, ArrowRight, Play, Server, Clock, MapPin } from 'lucide-react'
import Link from 'next/link'

import { LandingPage } from '@/components/marketing/landing-page'

export const dynamic = 'force-dynamic'

export default async function IndexPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if(!user) {
     return <LandingPage />
  }

  // Get Stats
  const [{ count: contactsCount }, { count: instancesCount }, { count: campaignsCount }] = await Promise.all([
     supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
     supabase.from('whatsapp_instances').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
     supabase.from('campaigns').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
  ])

  // Get recent campaigns
  const { data: recentCampaigns } = await supabase
    .from('campaigns')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  // Get overall message stats
  const { data: queueStats } = await supabase
     .from('message_queue')
     .select('status')
  
  let sentCount = 0
  let failedCount = 0
  if (queueStats) {
     sentCount = queueStats.filter(q => q.status === 'sent').length
     failedCount = queueStats.filter(q => q.status === 'failed').length
  }

  const statCards = [
    { title: 'Contactos Totales', value: contactsCount || 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100', link: '/contacts' },
    { title: 'Campañas Lanzadas', value: campaignsCount || 0, icon: Send, color: 'text-indigo-600', bg: 'bg-indigo-100', link: '/campaigns/history' },
    { title: 'Mensajes Enviados', value: sentCount || 0, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100', link: '/campaigns/history' },
    { title: 'Instancias Activas', value: instancesCount || 0, icon: Server, color: 'text-amber-600', bg: 'bg-amber-100', link: '/settings/whatsapp' }
  ]

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Header and Call to Action */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-6 rounded-2xl border shadow-sm">
         <div>
            <div className="flex items-center gap-2 mb-2">
               <div className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider">
                 ConnectaYa Panel
               </div>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Vuele Global.</h1>
            <p className="text-slate-500 mt-2 text-md">Monitorea el estado y rendimiento de tus envíos hoy.</p>
         </div>
         <Link href="/campaigns/create" className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]">
            <Play className="w-4 h-4 fill-current" /> Lanzar Nueva Campaña
         </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
         {statCards.map((stat, i) => {
            const Icon = stat.icon
            return (
              <Card key={i} className="border-none shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group bg-white">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-4">
                       <p className="font-bold text-slate-500 text-xs uppercase tracking-wider">{stat.title}</p>
                       <p className="text-4xl font-black text-slate-900">{stat.value}</p>
                    </div>
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stat.bg}`}>
                       <Icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                  </div>
                  <Link href={stat.link} className="absolute inset-0 z-10">
                     <span className="sr-only">Ver {stat.title}</span>
                  </Link>
                </CardContent>
                <div className="h-1.5 w-full bg-slate-50 absolute bottom-0 left-0">
                  <div className={`h-1.5 ${stat.bg.replace('100', '500')} w-0 group-hover:w-full transition-all duration-300 ease-out`}></div>
                </div>
              </Card>
            )
         })}
      </div>

      {/* Recent Campaigns and Error Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Recent Campaigns Table */}
         <Card className="col-span-1 lg:col-span-2 border-slate-200 shadow-sm overflow-hidden bg-white">
            <CardHeader className="border-b border-slate-100 bg-white pb-4">
              <div className="flex items-center justify-between">
                 <CardTitle className="text-lg font-bold text-slate-800">Campañas Recientes</CardTitle>
                 <Link href="/campaigns/history" className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors">
                    Ver todas <ArrowRight className="w-4 h-4" />
                 </Link>
              </div>
            </CardHeader>
            <div className="p-0 overflow-x-auto">
               {recentCampaigns && recentCampaigns.length > 0 ? (
                 <table className="w-full text-sm text-left">
                   <thead className="text-[11px] text-slate-500 uppercase tracking-widest bg-slate-50 border-b font-bold">
                     <tr>
                       <th className="px-6 py-4">Campaña</th>
                       <th className="px-6 py-4">Estado</th>
                       <th className="px-6 py-4 hidden sm:table-cell">Fecha</th>
                       <th className="px-6 py-4 text-right">Progreso</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     {recentCampaigns.map((camp: any) => (
                       <tr key={camp.id} className="hover:bg-slate-50/80 transition-colors">
                         <td className="px-6 py-4 font-bold text-slate-900 border-l-4 border-transparent hover:border-blue-500 whitespace-nowrap">
                            {camp.name}
                         </td>
                         <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold
                               ${camp.status === 'completed' ? 'bg-green-100 text-green-700' : 
                                 camp.status === 'sending' ? 'bg-amber-100 text-amber-700' : 
                                 'bg-blue-100 text-blue-700'}`}>
                               {camp.status === 'completed' ? <CheckCircle2 className="w-3.5 h-3.5"/> : <Clock className="w-3.5 h-3.5"/>}
                               {camp.status.charAt(0).toUpperCase() + camp.status.slice(1)}
                            </span>
                         </td>
                         <td className="px-6 py-4 text-slate-500 font-medium hidden sm:table-cell whitespace-nowrap">
                            {new Date(camp.created_at).toLocaleDateString()}
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap text-right text-slate-700 font-bold">
                            {camp.sent_count} / {camp.total_contacts} <span className="text-slate-400 font-medium text-xs">envíos</span>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               ) : (
                 <div className="p-12 text-center flex flex-col items-center justify-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                       <Send className="w-10 h-10 text-slate-300" />
                    </div>
                    <p className="text-slate-600 font-bold text-lg">Aún no hay campañas activas</p>
                    <p className="text-slate-400 text-sm mt-1 max-w-sm mb-6">Crea tu primera campaña para empezar a automatizar tus mensajes por WhatsApp.</p>
                    <Link href="/campaigns/create">
                       <Button className="font-bold">Empezar ahora</Button>
                    </Link>
                 </div>
               )}
            </div>
         </Card>

         {/* Failures summary and quick actions */}
         <div className="space-y-6">
            <Card className="border-none shadow-md bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden relative">
               <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                 <AlertTriangle className="w-32 h-32" />
               </div>
               <CardHeader className="pb-2 relative z-10">
                 <CardTitle className="text-lg font-bold flex items-center gap-2">
                    Alertas del Sistema
                 </CardTitle>
               </CardHeader>
               <CardContent className="relative z-10">
                 <div className="mt-2 space-y-5">
                    <div className="bg-white/10 rounded-2xl p-5 flex items-center justify-between border border-white/5 backdrop-blur-sm">
                       <div>
                          <p className="text-slate-400 text-xs uppercase font-extrabold tracking-widest mb-1.5">Mensajes Fallidos</p>
                          <p className="text-3xl font-black">{failedCount}</p>
                       </div>
                       <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center text-red-400 border border-red-500/20">
                          <AlertTriangle className="w-6 h-6" />
                       </div>
                    </div>
                    <p className="text-[13px] text-slate-400 leading-relaxed">
                       Revisa el <Link href="/campaigns/history" className="text-blue-400 font-bold hover:underline">Historial</Link> para ver reportes y auditar envíos fallidos.
                    </p>
                 </div>
               </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm bg-white">
               <CardHeader className="pb-3 border-b border-slate-50">
                 <CardTitle className="text-lg font-bold text-slate-800">Acciones Rápidas</CardTitle>
               </CardHeader>
               <CardContent className="space-y-2 pt-4">
                  <Link href="/contacts" className="flex items-center justify-between p-3.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all group">
                     <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                           <Users className="w-5 h-5" />
                        </div>
                        <p className="font-bold text-slate-700 text-sm">Base de Contactos</p>
                     </div>
                     <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                  </Link>

                  <Link href="/settings/whatsapp" className="flex items-center justify-between p-3.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all group">
                     <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                           <Server className="w-5 h-5" />
                        </div>
                        <p className="font-bold text-slate-700 text-sm">Conectar WhatsApp</p>
                     </div>
                     <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                  </Link>
                  
                  <Link href="/maps" className="flex items-center justify-between p-3.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all group">
                     <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                           <MapPin className="w-5 h-5" />
                        </div>
                        <p className="font-bold text-slate-700 text-sm">Extraer Leads (Maps)</p>
                     </div>
                     <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                  </Link>
               </CardContent>
            </Card>
         </div>

      </div>

    </div>
  )
}

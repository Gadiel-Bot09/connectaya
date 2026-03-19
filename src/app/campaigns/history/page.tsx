import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export default async function HistoryPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('*, whatsapp_instances(display_name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Historial de Campañas</h1>
          <p className="text-slate-500 mt-1">Revisa el estado de tus envíos y accede a los reportes de rendimiento.</p>
        </div>
        <div className="flex gap-4">
          <Link href="/">
             <Button variant="outline">Volver a Dashboard</Button>
          </Link>
          <Link href="/campaigns/create">
             <Button className="bg-blue-600 hover:bg-blue-700 text-white">+ Nueva Campaña</Button>
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
         <table className="w-full text-sm text-left">
           <thead className="bg-slate-50 text-slate-600 font-medium border-b">
             <tr>
               <th className="px-6 py-4">Campaña</th>
               <th className="px-6 py-4">Estado</th>
               <th className="px-6 py-4">Instancia Origen</th>
               <th className="px-6 py-4">Progreso de Envío</th>
               <th className="px-6 py-4 text-right">Acciones</th>
             </tr>
           </thead>
           <tbody>
             {campaigns?.length === 0 ? (
               <tr><td colSpan={5} className="text-center py-12 text-slate-500 text-lg">No hay campañas registradas.</td></tr>
             ) : (
               campaigns?.map(c => (
                 <tr key={c.id} className="border-b last:border-0 hover:bg-slate-50/50 transition-colors">
                   <td className="px-6 py-4 font-medium text-slate-800">
                     {c.name || '(Sin nombre)'}
                     <div className="text-xs text-slate-400 font-normal mt-1">{new Date(c.created_at).toLocaleString()}</div>
                   </td>
                   <td className="px-6 py-4">
                     <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide uppercase shadow-sm ${c.status === 'completed' ? 'bg-green-100 text-green-800 border-green-200' : c.status === 'active' ? 'bg-blue-100 text-blue-800 border-blue-200 animate-pulse' : c.status === 'paused' ? 'bg-orange-100 text-orange-800' : 'bg-slate-100 border-slate-200'}`}>
                        {c.status}
                     </span>
                   </td>
                   <td className="px-6 py-4 text-slate-600">{c.whatsapp_instances?.display_name || <span className="text-slate-400">Desconocida</span>}</td>
                   <td className="px-6 py-4">
                      <div className="w-full max-w-[150px] bg-slate-100 rounded-full h-2 mb-1.5 overflow-hidden shadow-inner border border-slate-200">
                         <div className="bg-blue-500 h-2 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (c.sent_count / (c.total_contacts || 1)) * 100)}%` }}></div>
                      </div>
                      <span className="text-xs font-medium text-slate-600">{c.sent_count} / {c.total_contacts} enviados</span>
                   </td>
                   <td className="px-6 py-4 text-right">
                     <Link href={`/campaigns/reports/${c.id}`}>
                        <Button variant="outline" size="sm" className="hover:bg-blue-50 hover:text-blue-600 border-slate-200">Ver Reporte</Button>
                     </Link>
                   </td>
                 </tr>
               ))
             )}
           </tbody>
         </table>
      </div>
    </div>
  )
}

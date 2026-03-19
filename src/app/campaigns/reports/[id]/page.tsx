import { createClient } from '@/utils/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { ReportClient } from './components/report-client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export default async function ReportPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: campaign } = await supabase
    .from('campaigns')
    .select('*, whatsapp_instances(display_name)')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!campaign) notFound()

  // Fetch message queue stats and tags
  const { data: queue } = await supabase
    .from('message_queue')
    .select('id, status, sent_at, error_message, contacts(tags)')
    .eq('campaign_id', params.id)

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Reporte: <span className="text-blue-600">{campaign.name}</span></h1>
          <p className="text-slate-500 mt-1">Métricas detalladas y estado de la campaña.</p>
        </div>
        <div className="flex gap-4">
          <Link href="/campaigns/history">
             <Button variant="outline">Volver al Historial</Button>
          </Link>
        </div>
      </div>

      <ReportClient campaign={campaign} queue={queue || []} />
    </div>
  )
}

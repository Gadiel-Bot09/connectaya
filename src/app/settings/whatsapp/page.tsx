import { createClient } from '@/utils/supabase/server'
import { InstancesListClient } from './components/instances-client'

export const dynamic = 'force-dynamic'

export default async function WhatsAppSettingsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <div>No autenticado</div>
  }

  const { data: instances, error } = await supabase
    .from('whatsapp_instances')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return <div className="text-red-500">Error cargando instancias: {error.message}</div>
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Instancias de WhatsApp</h2>
      <p className="text-slate-600 mb-6">Gestiona tus dispositivos conectados vía Evolution API.</p>
      
      <InstancesListClient initialInstances={instances || []} />
    </div>
  )
}

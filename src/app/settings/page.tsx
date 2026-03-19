import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { SettingsClient } from './components/settings-client'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: settings } = await supabase.from('user_settings').select('*').eq('user_id', user.id).single()

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Configuración General</h2>
      <p className="text-slate-500 mb-6">Administra los datos de tu negocio y credenciales de API.</p>
      <SettingsClient initialData={settings || {}} />
    </div>
  )
}

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { BillingClient } from './components/billing-client'

export const metadata = {
  title: 'Mi Plan | ConnectaYa',
}

export default async function BillingPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user profile with their plan and current instances count
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, plans(*)')
    .eq('id', user.id)
    .single()

  const { count: instancesCount } = await supabase
    .from('whatsapp_instances')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Suscripción y Facturación</h2>
        <p className="text-sm text-slate-500 mt-1">Gestiona tu plan actual, límites de cuenta y canjea licencias.</p>
      </div>

      <BillingClient 
        profile={profile} 
        plan={profile?.plans || null} 
        instancesCount={instancesCount || 0} 
      />
    </div>
  )
}

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { CodesClient } from './components/codes-client'

export const dynamic = 'force-dynamic'

export default async function AdminCodesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/')

  // Fetch plans
  const { data: plans } = await supabase.from('plans').select('*').order('price_cop')
  
  // Fetch codes with plan and user info
  const { data: codes } = await supabase
    .from('activation_codes')
    .select('*, plans(name), profiles:used_by(full_name, email)')
    .order('created_at', { ascending: false })

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Códigos de Activación</h1>
        <p className="text-slate-500 mt-1">Genera licencias alfanuméricas para vender los planes por WhatsApp.</p>
      </div>

      <CodesClient initialCodes={codes || []} plans={plans || []} />
    </div>
  )
}

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { WizardClient } from './components/wizard'
import { getCampaignFormData } from '../actions'

export const dynamic = 'force-dynamic'

export default async function CreateCampaignPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const formData = await getCampaignFormData()

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto py-12 px-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Crear Nueva Campaña</h1>
        <p className="text-slate-500 mb-8">Configura tu envío masivo de WhatsApp en 4 sencillos pasos.</p>
        
        <WizardClient formData={formData} />
      </div>
    </div>
  )
}

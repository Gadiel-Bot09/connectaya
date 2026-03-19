import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { MapsClient } from './components/maps-client'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function MapsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Explorador de Google Maps</h1>
          <p className="text-slate-500 mt-1">Encuentra negocios locales y extrae sus datos a tus contactos.</p>
        </div>
        <div className="flex gap-4 items-center">
          <Link href="/contacts" className="px-4 py-2 border rounded hover:bg-slate-50 text-sm font-medium">Ver mis contactos</Link>
        </div>
      </div>
      
      <MapsClient />
    </div>
  )
}

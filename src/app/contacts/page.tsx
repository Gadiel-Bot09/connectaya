import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { ContactsClient } from './components/contacts-client'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function ContactsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: contacts, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Mis Contactos</h1>
          <p className="text-slate-500 mt-1">Gestiona tu base de datos de clientes para envíos masivos.</p>
        </div>
        <div className="flex gap-4 items-center">
          <Link href="/" className="px-4 py-2 border rounded hover:bg-slate-50 text-sm font-medium">Volver a Dashboard</Link>
        </div>
      </div>
      
      {error ? (
        <div className="text-red-500">Error cargando contactos: {error.message}</div>
      ) : (
        <ContactsClient initialContacts={contacts || []} />
      )}
    </div>
  )
}

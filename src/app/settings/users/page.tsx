import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { UsersClient } from './components/users-client'

export const dynamic = 'force-dynamic'

export default async function UsersPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  
  if (profile?.role !== 'admin') {
     return (
       <div className="p-8 text-center bg-red-50 border border-red-200 rounded-xl max-w-lg mx-auto mt-10 text-red-600 shadow-sm">
          <h2 className="font-bold text-xl mb-2">Acceso Denegado</h2>
          <p>Esta sección es exclusiva para administradores del sistema. Comunícate con un administrador para obtener permisos.</p>
       </div>
     )
  }

  const { data: users } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Gestión de Usuarios</h2>
      <p className="text-slate-500 mb-6">Administra los accesos y roles de tu equipo en el sistema.</p>
      
      <UsersClient initialUsers={users || []} />
    </div>
  )
}

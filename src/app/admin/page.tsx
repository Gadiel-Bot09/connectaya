import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getAllUsers } from './actions'
import { AdminClient } from './components/admin-client'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/')

  const users = await getAllUsers()

  // Summary stats
  const stats = {
    total: users.length,
    active: users.filter(u => u.account_status === 'active').length,
    trial: users.filter(u => u.license_plan === 'trial').length,
    suspended: users.filter(u => u.account_status === 'suspended').length,
    expiringSoon: users.filter(u => {
      if (!u.license_expires_at) return false
      const days = (new Date(u.license_expires_at).getTime() - Date.now()) / 86400000
      return days <= 7 && days > 0
    }).length,
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Panel de Administración</h1>
        <p className="text-slate-500 mt-1">Gestiona las licencias y cuentas de ConnectaYa</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Total cuentas', value: stats.total, color: 'blue' },
          { label: 'Activas', value: stats.active, color: 'emerald' },
          { label: 'En trial', value: stats.trial, color: 'amber' },
          { label: 'Suspendidas', value: stats.suspended, color: 'red' },
          { label: 'Vencen en 7d', value: stats.expiringSoon, color: 'orange' },
        ].map(s => (
          <div key={s.label} className={`bg-white border rounded-xl p-4 shadow-sm border-${s.color}-100`}>
            <p className="text-xs font-medium text-slate-500 mb-1">{s.label}</p>
            <p className={`text-3xl font-black text-${s.color}-600`}>{s.value}</p>
          </div>
        ))}
      </div>

      <AdminClient initialUsers={users} />
    </div>
  )
}

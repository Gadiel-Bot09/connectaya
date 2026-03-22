'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toggleUserStatus } from '../../actions'
import { Shield, User, UserX, UserCheck } from 'lucide-react'

export function UsersClient({ initialUsers }: { initialUsers: any[] }) {
  const [users, setUsers] = useState(initialUsers)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleToggle = async (id: string, currentStatus: boolean) => {
    if (!confirm(`¿Seguro que deseas ${currentStatus ? 'desactivar' : 'activar'} a este usuario?`)) return
    setLoadingId(id)
    const res = await toggleUserStatus(id, currentStatus)
    if (res?.error) {
      alert(res.error)
    } else {
      setUsers(prev => prev.map(u => u.id === id ? { ...u, is_active: !currentStatus } : u))
    }
    setLoadingId(null)
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500 bg-white border rounded-xl shadow-sm">
        Ningún usuario encontrado en el sistema.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Desktop table — hidden on mobile */}
      <div className="hidden sm:block bg-white border rounded-xl shadow-sm overflow-hidden text-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-600 border-b text-xs uppercase tracking-wide font-semibold">
            <tr>
              <th className="px-5 py-3">Usuario</th>
              <th className="px-5 py-3">Rol</th>
              <th className="px-5 py-3">Estado</th>
              <th className="px-5 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b last:border-0 hover:bg-slate-50/50 transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold shrink-0">
                      {u.full_name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{u.full_name || 'Sin nombre'}</p>
                      <p className="text-xs text-slate-400 font-mono">...{u.id.substring(u.id.length - 8)}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wide border
                    ${u.role === 'admin' ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                    {u.role === 'admin' ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                    {u.role}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border
                    ${u.is_active ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                    {u.is_active ? 'Activo' : 'Bloqueado'}
                  </span>
                </td>
                <td className="px-5 py-4 text-right">
                  <Button
                    variant={u.is_active ? 'outline' : 'default'}
                    size="sm"
                    className={`text-xs font-semibold ${!u.is_active ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'text-red-600 hover:bg-red-50 border-red-200'}`}
                    disabled={loadingId === u.id}
                    onClick={() => handleToggle(u.id, u.is_active)}
                  >
                    {loadingId === u.id
                      ? 'Procesando...'
                      : u.is_active
                        ? <><UserX className="w-3.5 h-3.5 mr-1" />Desactivar</>
                        : <><UserCheck className="w-3.5 h-3.5 mr-1" />Activar</>
                    }
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards — shown only on small screens */}
      <div className="flex flex-col gap-3 sm:hidden">
        {users.map(u => (
          <div key={u.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold shrink-0">
                {u.full_name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 truncate">{u.full_name || 'Sin nombre'}</p>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold uppercase border
                    ${u.role === 'admin' ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                    {u.role === 'admin' ? <Shield className="w-2.5 h-2.5" /> : <User className="w-2.5 h-2.5" />}
                    {u.role}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border
                    ${u.is_active ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                    {u.is_active ? 'Activo' : 'Bloqueado'}
                  </span>
                </div>
              </div>
            </div>
            <Button
              variant={u.is_active ? 'outline' : 'default'}
              size="sm"
              className={`shrink-0 text-xs font-semibold ${!u.is_active ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'text-red-600 hover:bg-red-50 border-red-200'}`}
              disabled={loadingId === u.id}
              onClick={() => handleToggle(u.id, u.is_active)}
            >
              {loadingId === u.id ? '...' : u.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
            </Button>
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-400 text-right">{users.length} usuario{users.length !== 1 ? 's' : ''} en el sistema</p>
    </div>
  )
}

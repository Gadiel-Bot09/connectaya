'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toggleUserStatus } from '../../actions'
import { Shield, User, UserX, UserCheck } from 'lucide-react'

export function UsersClient({ initialUsers }: { initialUsers: any[] }) {
  const [users, setUsers] = useState(initialUsers)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleToggle = async (id: string, currentStatus: boolean) => {
    if(!confirm(`¿Seguro que deseas ${currentStatus ? 'desactivar' : 'activar'} a este usuario?`)) return
    
    setLoadingId(id)
    const res = await toggleUserStatus(id, currentStatus)
    if (res?.error) {
       alert(res.error)
    } else {
       setUsers(prev => prev.map(u => u.id === id ? {...u, is_active: !currentStatus} : u))
    }
    setLoadingId(null)
  }

  return (
    <div className="bg-white border rounded-xl shadow-sm overflow-hidden text-sm max-w-4xl">
       <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-600 border-b">
             <tr>
               <th className="px-6 py-4">Usuario</th>
               <th className="px-6 py-4">Rol</th>
               <th className="px-6 py-4">Estado</th>
               <th className="px-6 py-4 text-right">Acciones</th>
             </tr>
          </thead>
          <tbody>
             {users.map(u => (
               <tr key={u.id} className="border-b last:border-0 hover:bg-slate-50/50">
                 <td className="px-6 py-4 font-medium text-slate-800">
                    <div className="flex items-center justify-start gap-4">
                       <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg shadow-inner">
                          {u.full_name?.charAt(0).toUpperCase() || 'U'}
                       </div>
                       <div>
                         <div className="text-[15px]">{u.full_name || 'Sin nombre'}</div>
                         <div className="text-xs text-slate-400 font-mono mt-0.5" title={u.id}>...{u.id.substring(u.id.length-10)}</div>
                       </div>
                    </div>
                 </td>
                 <td className="px-6 py-4">
                    <span className={`flex items-center gap-1.5 w-fit px-2.5 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider shadow-sm ${u.role === 'admin' ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                      {u.role === 'admin' ? <Shield className="w-3.5 h-3.5"/> : <User className="w-3.5 h-3.5"/>}
                      {u.role}
                    </span>
                 </td>
                 <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase shadow-sm ${u.is_active ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
                       {u.is_active ? 'Activo' : 'Bloqueado'}
                    </span>
                 </td>
                 <td className="px-6 py-4 text-right">
                    <Button 
                       variant={u.is_active ? "outline" : "default"} 
                       size="sm" 
                       className={`font-medium ${!u.is_active ? 'bg-green-600 hover:bg-green-700 text-white shadow-sm' : 'text-red-700 hover:bg-red-50 border-red-200 shadow-sm disabled:opacity-50'}`}
                       disabled={loadingId === u.id}
                       onClick={() => handleToggle(u.id, u.is_active)}
                    >
                       {loadingId === u.id ? <span className="animate-pulse">Procesando...</span> : u.is_active ? <><UserX className="w-4 h-4 mr-2"/> Desactivar</> : <><UserCheck className="w-4 h-4 mr-2"/> Activar</>}
                    </Button>
                 </td>
               </tr>
             ))}
             {users.length === 0 && (
                <tr>
                   <td colSpan={4} className="text-center py-10 text-slate-500">Ningún usuario encontrado en el sistema.</td>
                </tr>
             )}
          </tbody>
       </table>
    </div>
  )
}

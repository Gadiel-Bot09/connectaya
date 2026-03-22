'use client'

import { useState, useTransition } from 'react'
import { Search, ChevronDown, Shield } from 'lucide-react'
import { suspendUser, activateUser, extendLicense, deleteUser, saveNote } from '../actions'

type UserRow = {
  id: string
  email: string
  full_name: string | null
  role: string
  account_status: string | null
  license_plan: string | null
  license_expires_at: string | null
  license_notes: string | null
  created_at: string
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active:    { label: 'Activa',      color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  trial:     { label: 'Trial',       color: 'bg-amber-100 text-amber-700 border-amber-200' },
  suspended: { label: 'Suspendida',  color: 'bg-red-100 text-red-700 border-red-200' },
  expired:   { label: 'Vencida',     color: 'bg-slate-100 text-slate-600 border-slate-200' },
  cancelled: { label: 'Cancelada',   color: 'bg-rose-100 text-rose-700 border-rose-200' },
}

const PLAN_LABELS: Record<string, string> = {
  trial:    '14 días gratis',
  monthly:  'Mensual',
  annual:   'Anual',
  lifetime: 'Vitalicia',
}

function StatusBadge({ status }: { status: string | null }) {
  const s = STATUS_LABELS[status || 'active'] || STATUS_LABELS['active']
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold border ${s.color}`}>
      {s.label}
    </span>
  )
}

function formatDate(d: string | null) {
  if (!d) return '—'
  const date = new Date(d)
  const isExpired = date < new Date()
  return (
    <span className={isExpired ? 'text-red-500 font-semibold' : ''}>
      {date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
      {isExpired && ' ⚠️'}
    </span>
  )
}

interface Props { initialUsers: UserRow[] }

export function AdminClient({ initialUsers }: Props) {
  const [users, setUsers] = useState(initialUsers)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPlan, setFilterPlan] = useState('')
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [noteEdit, setNoteEdit] = useState<{ id: string; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<string | null>(null)

  const toast = (msg: string) => { setFeedback(msg); setTimeout(() => setFeedback(null), 3000) }

  const filtered = users.filter(u => {
    const matchSearch = !search || u.email.includes(search) || (u.full_name || '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = !filterStatus || u.account_status === filterStatus
    const matchPlan   = !filterPlan   || u.license_plan === filterPlan
    return matchSearch && matchStatus && matchPlan
  })

  const act = (fn: () => Promise<any>, successMsg: string) => {
    startTransition(async () => {
      const res = await fn()
      if (res?.error) toast('❌ ' + res.error)
      else { toast('✅ ' + successMsg); setOpenMenu(null) }
    })
  }

  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
      {/* Feedback toast */}
      {feedback && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-xl text-sm font-medium animate-in slide-in-from-top-2">
          {feedback}
        </div>
      )}

      {/* Toolbar */}
      <div className="p-4 border-b flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="w-full pl-9 pr-4 h-9 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Buscar por email o nombre..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="h-9 px-3 text-sm border border-slate-300 rounded-lg bg-slate-50 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
        >
          <option value="">Todos los estados</option>
          <option value="active">Activa</option>
          <option value="trial">Trial</option>
          <option value="suspended">Suspendida</option>
          <option value="expired">Vencida</option>
          <option value="cancelled">Cancelada</option>
        </select>
        <select
          className="h-9 px-3 text-sm border border-slate-300 rounded-lg bg-slate-50 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filterPlan}
          onChange={e => setFilterPlan(e.target.value)}
        >
          <option value="">Todos los planes</option>
          <option value="trial">Trial</option>
          <option value="monthly">Mensual</option>
          <option value="annual">Anual</option>
          <option value="lifetime">Vitalicia</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-600 font-semibold border-b text-xs uppercase tracking-wide">
            <tr>
              <th className="px-5 py-3">Usuario</th>
              <th className="px-5 py-3">Estado</th>
              <th className="px-5 py-3">Plan</th>
              <th className="px-5 py-3">Vence</th>
              <th className="px-5 py-3">Registrado</th>
              <th className="px-5 py-3">Notas</th>
              <th className="px-5 py-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="text-center py-12 text-slate-400">Sin usuarios que coincidan</td></tr>
            )}
            {filtered.map(u => (
              <tr key={u.id} className="border-b last:border-0 hover:bg-slate-50/50 transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    {u.role === 'admin' && <Shield className="w-4 h-4 text-blue-500 shrink-0" title="Admin" />}
                    <div>
                      <p className="font-semibold text-slate-900">{u.full_name || '(sin nombre)'}</p>
                      <p className="text-slate-500 text-xs">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <StatusBadge status={u.account_status} />
                </td>
                <td className="px-5 py-4 text-slate-600">{PLAN_LABELS[u.license_plan || 'trial'] || u.license_plan}</td>
                <td className="px-5 py-4">{formatDate(u.license_expires_at)}</td>
                <td className="px-5 py-4 text-slate-400 text-xs">
                  {new Date(u.created_at).toLocaleDateString('es-CO')}
                </td>
                <td className="px-5 py-4 max-w-[180px]">
                  {noteEdit?.id === u.id ? (
                    <div className="flex gap-1">
                      <input
                        autoFocus
                        className="flex-1 h-7 border border-slate-200 rounded px-2 text-xs"
                        value={noteEdit.text}
                        onChange={e => setNoteEdit({ id: u.id, text: e.target.value })}
                        onKeyDown={e => {
                          if (e.key === 'Enter') act(() => saveNote(u.id, noteEdit.text), 'Nota guardada')
                          if (e.key === 'Escape') setNoteEdit(null)
                        }}
                      />
                      <button onClick={() => act(() => saveNote(u.id, noteEdit.text), 'Nota guardada')} className="text-blue-600 text-xs font-bold px-1">OK</button>
                      <button onClick={() => setNoteEdit(null)} className="text-slate-400 text-xs px-1">✕</button>
                    </div>
                  ) : (
                    <p
                      className="text-xs text-slate-500 truncate cursor-pointer hover:text-blue-600"
                      title={u.license_notes || 'Clic para agregar nota'}
                      onClick={() => setNoteEdit({ id: u.id, text: u.license_notes || '' })}
                    >
                      {u.license_notes || <span className="text-slate-300 italic">+ nota</span>}
                    </p>
                  )}
                </td>
                <td className="px-5 py-4 text-center relative">
                  {u.role !== 'admin' && (
                    <div className="relative inline-block">
                      <button
                        onClick={() => setOpenMenu(openMenu === u.id ? null : u.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors shadow-sm"
                      >
                        Acciones <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                      {openMenu === u.id && (
                        <div className="absolute right-0 top-9 z-30 w-52 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                          {u.account_status !== 'active' && (
                            <button onClick={() => act(() => activateUser(u.id), 'Cuenta activada')} className="w-full text-left px-4 py-2.5 text-sm hover:bg-emerald-50 text-emerald-700 font-medium flex items-center gap-2">✅ Activar cuenta</button>
                          )}
                          {u.account_status !== 'suspended' && (
                            <button onClick={() => act(() => suspendUser(u.id), 'Cuenta suspendida')} className="w-full text-left px-4 py-2.5 text-sm hover:bg-red-50 text-red-600 font-medium flex items-center gap-2">🚫 Suspender</button>
                          )}
                          <div className="h-px bg-slate-100 my-1" />
                          <button onClick={() => act(() => extendLicense(u.id, 30, 'monthly'), 'Licencia extendida 30 días')} className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 text-blue-700 font-medium">📅 +30 días (Mensual)</button>
                          <button onClick={() => act(() => extendLicense(u.id, 365, 'annual'), 'Licencia extendida 1 año')} className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 text-blue-700 font-medium">📅 +1 año (Anual)</button>
                          <button onClick={() => act(() => extendLicense(u.id, 36500, 'lifetime'), 'Licencia vitalicia asignada')} className="w-full text-left px-4 py-2.5 text-sm hover:bg-purple-50 text-purple-700 font-medium">♾️ Vitalicia</button>
                          <div className="h-px bg-slate-100 my-1" />
                          <button
                            onClick={() => {
                              if (confirm(`¿Eliminar permanentemente la cuenta de ${u.email}? Esta acción no se puede deshacer.`)) {
                                act(() => deleteUser(u.id), 'Cuenta eliminada')
                              }
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm hover:bg-red-50 text-red-600 font-medium"
                          >
                            🗑️ Eliminar cuenta
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  {u.role === 'admin' && <span className="text-slate-300 text-xs">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-5 py-3 text-xs text-slate-400 border-t text-right">
        {filtered.length} de {users.length} cuentas
      </div>

      {/* Close menu on outside click */}
      {openMenu && <div className="fixed inset-0 z-20" onClick={() => setOpenMenu(null)} />}
    </div>
  )
}

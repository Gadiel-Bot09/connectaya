'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Users, Send, MapPin, Settings, History, MessageSquareShare, ShieldCheck, X } from 'lucide-react'
import { Logo } from '@/components/ui/logo'

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Campañas', href: '/campaigns/create', icon: Send },
  { name: 'Historial', href: '/campaigns/history', icon: History },
  { name: 'Contactos', href: '/contacts', icon: Users },
  { name: 'Mapas', href: '/maps', icon: MapPin },
  { name: 'Instancias', href: '/settings/whatsapp', icon: MessageSquareShare },
  { name: 'Ajustes Base', href: '/settings', icon: Settings },
]

interface SidebarProps {
  userRole?: string
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ userRole, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const isAdmin = userRole === 'admin'

  const NavLink = ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <Link href={href} onClick={onClose} className={className}>
      {children}
    </Link>
  )

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r bg-slate-950 text-slate-300 transition-transform duration-300 ease-in-out',
          // Mobile: off-canvas unless open. Desktop: always visible
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between px-5 border-b border-slate-800 bg-slate-950 shrink-0">
          <NavLink href="/" className="inline-block transition-transform hover:scale-105">
            <Logo variant="dark" iconClassName="w-8 h-8 rounded-lg" textClassName="text-xl" />
          </NavLink>
          {/* Close button — only visible on mobile */}
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto py-5 px-3">
          <nav className="flex flex-col gap-1">
            {/* Admin link */}
            {isAdmin && (
              <div className="mb-2 space-y-1 bg-amber-950/20 p-2 rounded-2xl border border-amber-500/10">
                <p className="px-2 text-[10px] font-bold uppercase tracking-widest text-amber-500/50 mb-1">Superadmin</p>
                <NavLink
                  href="/admin"
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-semibold transition-all duration-150 group',
                    pathname === '/admin'
                      ? 'bg-amber-500/10 text-amber-400'
                      : 'text-amber-500/70 hover:bg-slate-800/80 hover:text-amber-400'
                  )}
                >
                  <ShieldCheck className={cn('h-4 w-4 shrink-0', pathname === '/admin' ? 'text-amber-400' : 'text-amber-600/60')} />
                  Gestionar Usuarios
                </NavLink>
                <NavLink
                  href="/admin/codes"
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-semibold transition-all duration-150 group',
                    pathname === '/admin/codes'
                      ? 'bg-amber-500/10 text-amber-400'
                      : 'text-amber-500/70 hover:bg-slate-800/80 hover:text-amber-400'
                  )}
                >
                  <ShieldCheck className={cn('h-4 w-4 shrink-0', pathname === '/admin/codes' ? 'text-amber-400' : 'text-amber-600/60')} />
                  Fábrica de Códigos
                </NavLink>
              </div>
            )}

            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
              const Icon = item.icon
              return (
                <NavLink
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition-all duration-150 group',
                    isActive
                      ? 'bg-blue-600/15 text-blue-400'
                      : 'hover:bg-slate-800/80 hover:text-white text-slate-400'
                  )}
                >
                  <Icon className={cn('h-5 w-5 shrink-0', isActive ? 'text-blue-400' : 'text-slate-500')} />
                  {item.name}
                </NavLink>
              )
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 shrink-0">
          <div className="rounded-xl bg-gradient-to-br from-slate-900 to-slate-800/80 p-3.5 border border-slate-800/60">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0" />
              <h4 className="text-xs font-bold text-white">Sistema Activo</h4>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">Worker WhatsApp corriendo.</p>
          </div>
        </div>
      </aside>
    </>
  )
}

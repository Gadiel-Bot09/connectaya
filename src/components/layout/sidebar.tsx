'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Users, Send, MapPin, Settings, History, MessageSquareShare } from 'lucide-react'

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Campañas', href: '/campaigns/create', icon: Send },
  { name: 'Historial', href: '/campaigns/history', icon: History },
  { name: 'Contactos', href: '/contacts', icon: Users },
  { name: 'Mapas', href: '/maps', icon: MapPin },
  { name: 'Instancias', href: '/settings/whatsapp', icon: MessageSquareShare },
  { name: 'Ajustes Base', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed inset-y-0 left-0 z-20 flex w-64 flex-col border-r bg-slate-950 text-slate-300 transition-all lg:w-72">
      <div className="flex h-16 items-center px-6 border-b border-slate-800 bg-slate-950">
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow">
             <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <span className="text-xl font-extrabold text-white tracking-tight">Connecta<span className="text-blue-500">Ya</span></span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4">
        <nav className="flex flex-col gap-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium transition-all group",
                  isActive 
                    ? "bg-blue-600/10 text-blue-400" 
                    : "hover:bg-slate-900 hover:text-white"
                )}
              >
                <Icon className={cn("h-5 w-5 transition-transform", isActive ? "text-blue-500" : "text-slate-500 group-hover:scale-110")} />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-800 bg-slate-950">
        <div className="rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 p-4 border border-slate-800/80 shadow-lg">
          <div className="flex items-center gap-2 mb-2">
             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
             <h4 className="text-sm font-bold text-white">Sistema Activo</h4>
          </div>
          <p className="text-xs text-slate-400 mb-4 leading-relaxed">WhatsApp worker corriendo en segundo plano.</p>
        </div>
      </div>
    </aside>
  )
}

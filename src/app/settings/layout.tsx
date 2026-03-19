'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  
  const navItems = [
    { name: 'General', href: '/settings' },
    { name: 'WhatsApp', href: '/settings/whatsapp' },
    { name: 'Usuarios', href: '/settings/users' },
  ]

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Configuración</h1>
      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-64 shrink-0">
           <nav className="flex flex-col gap-2">
             {navItems.map((item) => {
               const isActive = pathname === item.href
               return (
                 <Link 
                   key={item.href} 
                   href={item.href} 
                   className={`p-2 rounded transition-colors ${isActive ? 'bg-slate-100 font-semibold' : 'hover:bg-slate-50'}`}
                 >
                   {item.name}
                 </Link>
               )
             })}
           </nav>
        </aside>
        <main className="flex-1 bg-white border rounded-xl p-6 shadow-sm min-h-[500px]">
          {children}
        </main>
      </div>
    </div>
  )
}

'use client'

import { usePathname } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { Bell, Search, LogOut } from 'lucide-react'

export function AppLayoutWrapper({ children, userInitial, userName, userRole }: { children: React.ReactNode, userInitial: string, userName: string, userRole: string }) {
  const pathname = usePathname()

  const isAuthenticated = userName !== 'Invitado'

  // Ocultar barra en login/register siempre. Ocultar en '/' SOLO si no ha iniciado sesión.
  const authRoutes = ['/login', '/register', '/reset-password', '/update-password']
  const isPublicRoute = authRoutes.includes(pathname) || (pathname === '/' && !isAuthenticated)

  if (isPublicRoute) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <div className="flex-1 lg:pl-72 pl-64 flex flex-col min-h-screen transition-all">
        <header className="sticky top-0 z-10 w-full h-16 border-b bg-white/80 backdrop-blur-md px-8 flex items-center justify-between shadow-sm">
           <div className="flex items-center gap-4 flex-1">
              <div className="relative w-full max-w-md hidden md:block">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                 <input type="text" placeholder="Buscar campañas..." className="w-full h-10 pl-10 pr-4 text-sm bg-slate-100 border-transparent rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400" />
              </div>
           </div>

           <div className="flex items-center gap-4">
              <button className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center relative hover:bg-slate-200 transition-colors">
                 <Bell className="w-5 h-5 text-slate-600" />
                 <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-slate-100 animate-pulse"></span>
              </button>
              <div className="h-8 w-[1px] bg-slate-200 mx-2"></div>
              <div className="flex items-center gap-3">
                 <div className="text-right hidden sm:block">
                   <p className="text-sm font-bold text-slate-900 leading-none">{userName}</p>
                   <p className="text-xs text-slate-500 mt-1 capitalize font-medium">{userRole}</p>
                 </div>
                 <div className="w-10 h-10 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-extrabold shadow-sm">
                   {userInitial}
                 </div>
                 <form action="/auth/signout" method="post" className="ml-2">
                   <button type="submit" className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Cerrar sesión">
                      <LogOut className="w-5 h-5" />
                   </button>
                 </form>
              </div>
           </div>
        </header>

        <main className="flex-1 p-8 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}

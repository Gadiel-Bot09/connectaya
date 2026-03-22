'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { Bell, LogOut, Menu } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

export function AppLayoutWrapper({
  children,
  userInitial,
  userName,
  userRole,
}: {
  children: React.ReactNode
  userInitial: string
  userName: string
  userRole: string
}) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const isAuthenticated = userName !== 'Invitado'

  const authRoutes = ['/login', '/register', '/reset-password', '/update-password', '/suspended']
  const isPublicRoute = authRoutes.includes(pathname) || (pathname === '/' && !isAuthenticated)

  const handleSignout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  if (isPublicRoute) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar (drawer on mobile, fixed on desktop) */}
      <Sidebar
        userRole={userRole}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content — shifts right on desktop to make room for the fixed sidebar */}
      <div className="flex-1 lg:pl-72 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-20 w-full h-16 border-b bg-white/90 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 shadow-sm shrink-0">
          {/* Left: hamburger (mobile) */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Abrir menú"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          {/* Right: actions + user */}
          <div className="flex items-center gap-2 sm:gap-3 ml-auto">
            <button className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center relative hover:bg-slate-200 transition-colors">
              <Bell className="w-4 h-4 text-slate-600" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 border-2 border-white animate-pulse" />
            </button>

            <div className="h-7 w-px bg-slate-200 hidden sm:block" />

            <div className="flex items-center gap-2">
              {/* Name — hidden on very small screens */}
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-900 leading-none truncate max-w-[120px]">{userName}</p>
                <p className="text-xs text-slate-500 mt-0.5 capitalize font-medium">{userRole}</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-extrabold text-sm shadow-sm shrink-0">
                {userInitial}
              </div>
              <button
                onClick={handleSignout}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}

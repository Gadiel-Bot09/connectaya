import Link from 'next/link'
import { Logo } from '@/components/ui/logo'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function SuspendedPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_status, license_expires_at, full_name')
    .eq('id', user.id)
    .single()

  const isExpired = profile?.account_status === 'expired' ||
    (profile?.license_expires_at && new Date(profile.license_expires_at) < new Date())

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo variant="dark" />
        </div>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 text-center backdrop-blur-sm shadow-2xl">
          {/* Icon */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center bg-red-500/10 border border-red-500/20">
            <span className="text-4xl">{isExpired ? '⏰' : '🔒'}</span>
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">
            {isExpired ? 'Licencia Vencida' : 'Cuenta Suspendida'}
          </h1>

          <p className="text-slate-400 mb-2 leading-relaxed">
            {isExpired
              ? 'Tu período de prueba o suscripción ha vencido. Renueva tu licencia para seguir usando ConnectaYa.'
              : 'Tu cuenta ha sido suspendida temporalmente. Contacta al administrador para más información.'}
          </p>

          {profile?.license_expires_at && (
            <p className="text-xs text-slate-500 mb-6">
              Venció el: {new Date(profile.license_expires_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          )}

          <div className="flex flex-col gap-3">
            <a
              href="https://wa.me/message/CONNECTAYASUPPORT"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-6 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2"
            >
              <span>💬</span> Contactar Soporte por WhatsApp
            </a>

            <Link
              href="/auth/signout"
              className="w-full py-3 px-6 rounded-xl font-medium text-slate-400 hover:text-white border border-white/10 hover:border-white/20 transition-colors"
            >
              Cerrar sesión
            </Link>
          </div>
        </div>

        <p className="text-center text-slate-600 text-sm mt-6">
          © 2026 ConnectaYa — Todos los derechos reservados
        </p>
      </div>
    </div>
  )
}

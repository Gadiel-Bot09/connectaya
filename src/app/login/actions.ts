'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const supabase = createClient()
  
  // Obtener IP para rate limiting y logging
  const ip = headers().get('x-forwarded-for') || '127.0.0.1'
  const userAgent = headers().get('user-agent') || ''

  // Validar rate limiting básico (5 intentos en 15 minutos)
  const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString()
  
  const { count } = await supabase
    .from('auth_logs')
    .select('*', { count: 'exact', head: true })
    .eq('ip_address', ip)
    .eq('event', 'login_failed')
    .gt('created_at', fifteenMinsAgo)

  if (count && count >= 5) {
    return { error: 'Demasiados intentos fallidos. Cuenta bloqueada por 15 minutos.' }
  }

  // Intentar login con Supabase Auth
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    // Log intent fallido
    await supabase.from('auth_logs').insert({
       event: 'login_failed',
       ip_address: ip,
       user_agent: userAgent
    })
    return { error: 'Credenciales inválidas.' }
  }

  // Log login exitoso
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
     await supabase.from('auth_logs').insert({
       user_id: user.id,
       event: 'login_success',
       ip_address: ip,
       user_agent: userAgent
    })
  }

  redirect('/')
}

export async function signup(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const supabase = createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  // Manejar errores como rate limiting de Supabase (51 seconds)
  if (error) {
    if (error.message.includes('security purposes') || error.message.includes('rate limit')) {
       return { error: 'Por seguridad, debes esperar un minuto antes de intentar registrarte de nuevo.' }
    }
    return { error: 'Error al registrar: ' + error.message }
  }

  if (data?.user && !data.session) {
    return { success: true, message: '¡Registro exitoso! Por favor revisa tu bandeja de correo para confirmar tu cuenta y poder iniciar sesión.' }
  }

  return { success: true, message: '¡Cuenta creada! Ya puedes iniciar sesión con tus credenciales.' }
}

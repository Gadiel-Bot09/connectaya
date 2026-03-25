import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return request.cookies.get(name)?.value },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          supabaseResponse = NextResponse.next({ request: { headers: request.headers } })
          supabaseResponse.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          supabaseResponse = NextResponse.next({ request: { headers: request.headers } })
          supabaseResponse.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  const isPublicRoute =
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/suspended') ||
    pathname.startsWith('/api')

  // Redirect unauthenticated users to login (except public routes and root)
  if (!user && !isPublicRoute && pathname !== '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from auth pages
  if (user && (pathname.startsWith('/login') || pathname.startsWith('/register'))) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // ── License check for authenticated users ──────────────────────────────
  if (user && !isPublicRoute) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('account_status, license_expires_at, role')
      .eq('id', user.id)
      .single()

    if (profile) {
      const isSuspended  = profile.account_status === 'suspended' || profile.account_status === 'cancelled'
      const isExpired    = profile.account_status === 'expired' ||
                           (profile.license_expires_at && new Date(profile.license_expires_at) < new Date())
      const isAdmin      = profile.role === 'admin'

      // Admins always have access
      if (!isAdmin && (isSuspended || isExpired) && pathname !== '/suspended') {
        const url = request.nextUrl.clone()
        url.pathname = '/suspended'
        return NextResponse.redirect(url)
      }
    }
  }

  return supabaseResponse
}

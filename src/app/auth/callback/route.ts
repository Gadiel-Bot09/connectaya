import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')  // 'signup', 'recovery', 'email_change', etc.
  const next = searchParams.get('next') ?? '/'

  // Always use the production URL to avoid localhost redirects in emails
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || origin

  const supabase = createClient()

  // Flow 1: PKCE code (newer Supabase auth flow)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const redirectTo = type === 'recovery' ? '/update-password' : next
      return NextResponse.redirect(`${siteUrl}${redirectTo}`)
    }
  }

  // Flow 2: token_hash (used in older/email-based templates)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type: type as any })
    if (!error) {
      const redirectTo = type === 'recovery' ? '/update-password' : next
      return NextResponse.redirect(`${siteUrl}${redirectTo}`)
    }
  }

  // Error: redirect to login with message
  return NextResponse.redirect(`${siteUrl}/login?error=link_invalido_o_expirado`)
}

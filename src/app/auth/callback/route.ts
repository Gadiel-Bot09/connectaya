import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // next is the URL path to redirect to after exchanging the code
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Si todo sale bien, redirigir al "next" (ej: /update-password)
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // En caso de error de auth o sin código, redirigir al login
  return NextResponse.redirect(`${origin}/login?error=Invalid_Token`)
}

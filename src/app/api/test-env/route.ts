import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY
  return NextResponse.json({
    hasServiceKey,
    keyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0
  })
}

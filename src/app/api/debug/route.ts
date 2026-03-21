import { NextResponse } from 'next/server'
import { createClient as createJsClient } from '@supabase/supabase-js'

// Diagnostic endpoint to debug production environment and RLS issues
// Access: GET /api/debug
// REMOVE THIS FILE AFTER DEBUGGING IS COMPLETE
export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function GET(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const envCheck = {
    supabaseUrl: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : '❌ MISSING',
    serviceKey: serviceKey
      ? `✅ Present (${serviceKey.length} chars, starts: ${serviceKey.substring(0, 15)}...)`
      : '❌ MISSING - This is the ROOT CAUSE',
    anonKey: anonKey ? `✅ Present (${anonKey.length} chars)` : '❌ MISSING',
  }

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({
      status: 'CRITICAL - Missing env vars',
      envCheck,
      fix: 'Go to Vercel Dashboard → Project Settings → Environment Variables and add SUPABASE_SERVICE_ROLE_KEY',
    })
  }

  // Test with service role (should bypass all RLS)
  const adminClient = createJsClient(supabaseUrl, serviceKey)

  // Test 1: Can we read ANY campaign at all?
  const { data: allCampaigns, error: allError } = await adminClient
    .from('campaigns')
    .select('id, name, status, user_id, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  // Test 2: Can we read ACTIVE campaigns specifically?
  const { data: activeCampaigns, error: activeError } = await adminClient
    .from('campaigns')
    .select('id, name, status, user_id')
    .eq('status', 'active')
    .limit(5)

  // Test 3: Can we read message_queue?
  const { data: queueSample, error: queueError } = await adminClient
    .from('message_queue')
    .select('id, campaign_id, status, attempts')
    .limit(5)

  // Test 4: Check Supabase auth.admin works with service role
  let adminAuthWorks = false
  try {
    const { data: users } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1 })
    adminAuthWorks = !!users
  } catch (e: any) {
    adminAuthWorks = false
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    environment: envCheck,
    serviceRoleBypassWorks: adminAuthWorks,
    tests: {
      allCampaigns: {
        count: allCampaigns?.length ?? 0,
        error: allError?.message ?? null,
        data: allCampaigns?.map(c => ({ name: c.name, status: c.status, user_id: c.user_id?.substring(0, 8) + '...' })) ?? [],
      },
      activeCampaigns: {
        count: activeCampaigns?.length ?? 0,
        error: activeError?.message ?? null,
        data: activeCampaigns?.map(c => ({ name: c.name, status: c.status })) ?? [],
      },
      messageQueue: {
        count: queueSample?.length ?? 0,
        error: queueError?.message ?? null,
        statuses: queueSample?.map(q => q.status) ?? [],
      },
    },
    diagnosis:
      !serviceKey
        ? 'ROOT CAUSE: SUPABASE_SERVICE_ROLE_KEY missing in Vercel'
        : activeCampaigns?.length === 0 && (allCampaigns?.length ?? 0) > 0
        ? 'Campaigns exist but none are ACTIVE — check status values in DB'
        : activeCampaigns?.length === 0 && allCampaigns?.length === 0
        ? 'No campaigns found at all — RLS may still be applying or table is empty'
        : 'Data accessible — check allowed_hours or instance status',
  })
}

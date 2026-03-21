import { NextResponse } from 'next/server'
import { createClient as createJsClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/utils/supabase/server'

// POST /api/reset-campaign?id=<campaignId>
// Resets all failed/stuck messages back to 'pending' so the campaign can retry
// This is used by the "Forzar Envío" button when a campaign has stuck messages
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)
  const campaignId = searchParams.get('id')

  if (!campaignId) {
    return NextResponse.json({ error: 'Campaign ID required' }, { status: 400 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  let supabase: any
  if (serviceKey) {
    supabase = createJsClient(supabaseUrl, serviceKey)
  } else {
    supabase = createServerClient()
  }

  // Check the current state of the campaign queue
  const { data: queueStats } = await supabase
    .from('message_queue')
    .select('status, attempts')
    .eq('campaign_id', campaignId)

  if (!queueStats || queueStats.length === 0) {
    return NextResponse.json({ error: 'No messages found for this campaign' }, { status: 404 })
  }

  const totalMessages = queueStats.length
  const failedMessages = queueStats.filter((m: any) => m.status === 'failed').length
  const sentMessages = queueStats.filter((m: any) => m.status === 'sent').length
  const pendingMessages = queueStats.filter((m: any) => m.status === 'pending').length

  // Reset all failed messages back to pending with attempts reset to 0
  const { error: resetError } = await supabase
    .from('message_queue')
    .update({
      status: 'pending',
      attempts: 0,
      error_message: null,
      updated_at: new Date().toISOString(),
    })
    .eq('campaign_id', campaignId)
    .eq('status', 'failed')

  if (resetError) {
    return NextResponse.json({ error: resetError.message }, { status: 500 })
  }

  // Re-activate only if PAUSED (never re-open a completed campaign!)
  await supabase
    .from('campaigns')
    .update({ status: 'active' })
    .eq('id', campaignId)
    .eq('status', 'paused')

  return NextResponse.json({
    success: true,
    message: `Reset ${failedMessages} failed messages back to pending`,
    stats: { totalMessages, failedMessages, sentMessages, pendingMessages },
  })
}
